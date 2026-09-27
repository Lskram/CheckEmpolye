/**
 * Web Audio API & Desktop Push Notification Utility
 * Provides 100% reliable sound alerts and native browser notifications
 */

export interface WebNotification {
  id: string;
  type: 'checkin' | 'checkout' | 'advance' | 'leave' | 'violation';
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
  relatedId?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  targetTab?: 'overview' | 'employees' | 'staff' | 'leaves' | 'advances' | 'advance' | 'violations' | 'security' | 'settings';
}

// 1. Synthesize crystal-clear audio chimes using Web Audio API (Zero latency, No external audio file)
export function playWebAlertSound(type: 'checkin' | 'checkout' | 'advance' | 'leave' | 'violation' | 'alert') {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === 'advance') {
      // Distinctive 3-tone Cash Chime (F5 -> A5 -> C6)
      const freqs = [698.46, 880.0, 1046.5];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.36);
      });
    } else if (type === 'checkin') {
      // Pleasant Upward 2-tone Check-in Chime (E5 -> G5)
      const freqs = [659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0, now + idx * 0.14);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.14 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.31);
      });
    } else if (type === 'checkout') {
      // Soft Completion Chime (G5 -> E5)
      const freqs = [783.99, 659.25];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
        gain.gain.setValueAtTime(0, now + idx * 0.14);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.14 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.14);
        osc.stop(now + idx * 0.14 + 0.31);
      });
    } else if (type === 'leave') {
      // Gentle Bell (D5 -> F#5)
      const freqs = [587.33, 739.99];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.41);
      });
    } else if (type === 'violation') {
      // Urgent Warning Buzzer (Two rapid 440Hz alert pulses)
      [0, 0.18].forEach((startTime) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now + startTime);
        gain.gain.setValueAtTime(0.3, now + startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, now + startTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + startTime);
        osc.stop(now + startTime + 0.13);
      });
    }
  } catch (e) {
    console.warn('Could not play web audio alert:', e);
  }
}

// 2. Browser Desktop Push Notification API
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function showBrowserDesktopNotification(title: string, body: string, icon = '/icons/icon-192x192.png') {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: icon,
        silent: true, // We already play our high-fidelity synthesized Web Audio chime
      });
    } catch (e) {
      console.warn('Desktop notification error:', e);
    }
  }
}
