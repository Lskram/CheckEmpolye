/**
 * Hardware Identifier (HWID) Fingerprint Generator for PWA Mobile & Web
 */

export function generateCanvasFingerprint(): string {
  try {
    if (typeof window === 'undefined') return 'server-env';
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Attendance-HWID-PWA', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Attendance-HWID-PWA', 4, 17);

    return simpleHash(canvas.toDataURL());
  } catch (e) {
    return 'canvas-err';
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Gets or creates a persistent HWID for the device
 */
export function getDeviceHWID(): string {
  if (typeof window === 'undefined') return 'SERVER_DEVICE';

  const STORAGE_KEY = 'attendance_pwa_device_hwid';
  let cachedHWID = localStorage.getItem(STORAGE_KEY);

  if (cachedHWID) {
    return cachedHWID;
  }

  // Create composite fingerprint
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const canvasHash = generateCanvasFingerprint();
  const userAgent = navigator.userAgent;
  const platform = navigator.platform || 'unknown';
  const randomSalt = Math.random().toString(36).substring(2, 10);

  const rawFingerprint = `HWID_${simpleHash(screenInfo + timeZone + platform + canvasHash + userAgent)}_${randomSalt}`;
  localStorage.setItem(STORAGE_KEY, rawFingerprint);
  return rawFingerprint;
}

/**
 * Reset HWID (utility for testing multi-device / violation scenarios)
 */
export function resetDeviceHWID(): string {
  if (typeof window === 'undefined') return 'SERVER_DEVICE';
  localStorage.removeItem('attendance_pwa_device_hwid');
  return getDeviceHWID();
}
