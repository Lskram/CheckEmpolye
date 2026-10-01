'use client';

/**
 * Robust IndexedDB & Offline Resilience Engine for Yokohama Attendance PWA
 * Automatically queues actions when offline and syncs them in chronological order when reconnected.
 */

export interface OfflineAction {
  id: string;
  actionType: 'CHECK_IN' | 'CHECK_OUT' | 'ADVANCE_REQUEST' | 'LEAVE_REQUEST';
  payload: any;
  timestamp: string;
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  lastError?: string;
}

const DB_NAME = 'YokohamaAttendanceOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'offline_actions';

// Open / Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fallback to localStorage if IndexedDB is blocked in private browsing
function getLocalStorageQueue(): OfflineAction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('yokohama_offline_queue');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setLocalStorageQueue(queue: OfflineAction[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('yokohama_offline_queue', JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to set localStorage offline queue:', e);
  }
}

/**
 * Save an action to the offline queue
 */
export async function saveOfflineAction(
  actionType: 'CHECK_IN' | 'CHECK_OUT' | 'ADVANCE_REQUEST' | 'LEAVE_REQUEST',
  payload: any
): Promise<OfflineAction> {
  const newAction: OfflineAction = {
    id: `OFFLINE_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    actionType,
    payload,
    timestamp: new Date().toISOString(),
    syncStatus: 'PENDING',
    retryCount: 0,
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(newAction);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IndexedDB write failed, falling back to localStorage:', e);
    const queue = getLocalStorageQueue();
    queue.push(newAction);
    setLocalStorageQueue(queue);
  }

  notifyQueueChange();
  return newAction;
}

/**
 * Get all pending actions from queue
 */
export async function getPendingOfflineActions(): Promise<OfflineAction[]> {
  try {
    const db = await openDB();
    return await new Promise<OfflineAction[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const results: OfflineAction[] = req.result || [];
        resolve(results.filter((a) => a.syncStatus === 'PENDING' || a.syncStatus === 'FAILED'));
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    const queue = getLocalStorageQueue();
    return queue.filter((a) => a.syncStatus === 'PENDING' || a.syncStatus === 'FAILED');
  }
}

/**
 * Remove or mark an action as SYNCED
 */
export async function removeOfflineAction(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    const queue = getLocalStorageQueue().filter((a) => a.id !== id);
    setLocalStorageQueue(queue);
  }
  notifyQueueChange();
}

/**
 * Trigger Auto-Sync Engine
 * Loops through all pending offline records and posts them to their API endpoints
 */
let isSyncing = false;

export async function syncPendingActions(): Promise<{ syncedCount: number; errors: any[] }> {
  if (isSyncing || typeof window === 'undefined' || !navigator.onLine) {
    return { syncedCount: 0, errors: [] };
  }

  isSyncing = true;
  let syncedCount = 0;
  const errors: any[] = [];

  try {
    const pendingActions = await getPendingOfflineActions();
    if (pendingActions.length === 0) {
      isSyncing = false;
      return { syncedCount: 0, errors: [] };
    }

    // Sort chronologically (oldest first)
    pendingActions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (const action of pendingActions) {
      try {
        let endpoint = '';
        if (action.actionType === 'CHECK_IN') endpoint = '/api/check-in';
        else if (action.actionType === 'CHECK_OUT') endpoint = '/api/check-out';
        else if (action.actionType === 'ADVANCE_REQUEST') endpoint = '/api/advance-request';
        else if (action.actionType === 'LEAVE_REQUEST') endpoint = '/api/leave';

        if (!endpoint) continue;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...action.payload,
            isOfflineSync: true,
            originalTimestamp: action.timestamp,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          await removeOfflineAction(action.id);
          syncedCount++;
        } else if (data.alreadyCheckedIn || data.alreadyCheckedOut) {
          // If already recorded on server, remove from offline queue
          await removeOfflineAction(action.id);
          syncedCount++;
        } else {
          errors.push({ id: action.id, message: data.message });
        }
      } catch (err: any) {
        errors.push({ id: action.id, message: err.message });
      }
    }
  } catch (err: any) {
    errors.push({ general: err.message });
  } finally {
    isSyncing = false;
    notifyQueueChange();
  }

  return { syncedCount, errors };
}

function notifyQueueChange() {
  if (typeof window !== 'undefined') {
    getPendingOfflineActions().then((pending) => {
      window.dispatchEvent(
        new CustomEvent('yokohama-offline-queue-changed', {
          detail: { pendingCount: pending.length, pending },
        })
      );
    });
  }
}

/**
 * Initialize background listeners for online/offline events
 */
export function initOfflineSyncListeners() {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = () => {
    console.log('[OfflineSync] Online event detected. Triggering auto-sync...');
    syncPendingActions();
  };

  window.addEventListener('online', handleOnline);

  // Periodic heartbeat sync (every 12 seconds when online)
  const interval = setInterval(() => {
    if (navigator.onLine) {
      syncPendingActions();
    }
  }, 12000);

  // Initial sync check
  if (navigator.onLine) {
    syncPendingActions();
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    clearInterval(interval);
  };
}
