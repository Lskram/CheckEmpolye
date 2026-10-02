'use client';

// Client-side atomic server time synchronization & anti-tamper engine

let cachedServerOffset = 0; // ms: serverTime - deviceLocalTime
let hasSynced = false;

export function syncServerTime(serverTimestamp: number) {
  if (!serverTimestamp) return;
  const now = Date.now();
  cachedServerOffset = serverTimestamp - now;
  hasSynced = true;
}

export function getNowWithServerSync(): Date {
  return new Date(Date.now() + cachedServerOffset);
}

export function getServerTimeDriftMinutes(): number {
  return Math.round(cachedServerOffset / 60000);
}

export function isDeviceClockTampered(): boolean {
  // Flag as tampered/drifting if more than 3 minutes off
  return hasSynced && Math.abs(cachedServerOffset) > 180000;
}
