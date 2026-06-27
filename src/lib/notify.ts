/**
 * DOKAN — Staff Alert Helpers
 * Ported from Sari3 with enhancements
 *
 * Sound, Vibrate, WakeLock, and Browser Notification
 * for foreground staff/kitchen screens.
 *
 * NOTE: True background push notifications (app fully closed) use
 * the service worker at public/sw.js + server-side push via /api/push.
 * This module handles the "app is open in foreground" case.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (audioCtx && audioCtx.state !== 'closed') return audioCtx;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Play a simple sine-wave tone.
 */
function tone(ctx: AudioContext, freq: number, when: number, dur: number, vol = 0.35) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + when;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Short two-note chime — used for "sound enabled" confirmation. */
export function playChime() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  tone(ctx, 880, 0, 0.18);
  tone(ctx, 1320, 0.18, 0.25);
}

/**
 * Loud, attention-grabbing alert for a new order.
 * Three rising pings — impossible to miss in a noisy kitchen.
 */
export function playAlert() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  // Three urgent pings: C6 → E6 → G6
  tone(ctx, 1046, 0.0, 0.22, 0.45);
  tone(ctx, 1318, 0.22, 0.22, 0.45);
  tone(ctx, 1568, 0.44, 0.35, 0.5);
}

/**
 * Vibrate device with a pattern.
 * Default: 3 pulses (200ms on, 80ms off × 2, 400ms final)
 */
export function tryVibrate(pattern: number | number[] = [200, 80, 200, 80, 400]) {
  try { navigator.vibrate?.(pattern); } catch { /* ignore */ }
}

/**
 * Request notification permission (browser-level).
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const res = await Notification.requestPermission();
  return res === 'granted';
}

/**
 * Show a foreground browser notification.
 * `tag` prevents stacking duplicate notifications per order.
 */
export function notify(title: string, body: string, tag?: string) {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const n = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: tag ?? `order-${Date.now()}`,
        requireInteraction: true,
        silent: false,
      });
      n.onclick = () => {
        try { window.focus(); n.close(); } catch { /* ignore */ }
      };
    }
  } catch { /* ignore */ }
}

// ── Screen Wake Lock ────────────────────────────────────────

let wakeLock: WakeLockSentinel | null = null;

/**
 * Keep the screen on while the staff/kitchen page is visible.
 * Works on Chrome Android / Edge Android.
 */
export async function requestWakeLock(): Promise<boolean> {
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinel> } };
    if (!nav.wakeLock) return false;
    wakeLock = await nav.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => { wakeLock = null; });
    return true;
  } catch {
    return false;
  }
}

export async function releaseWakeLock() {
  try { await wakeLock?.release(); } catch { /* ignore */ }
  wakeLock = null;
}

/**
 * Play the alert sequence 3 times with vibration so it's impossible to miss
 * in a noisy environment. Call this when a new order arrives.
 */
export function playOrderAlertSequence() {
  playAlert();
  tryVibrate();
  setTimeout(() => playAlert(), 1200);
  setTimeout(() => { playAlert(); tryVibrate(); }, 2600);
}
