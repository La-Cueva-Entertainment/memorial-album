/**
 * Seeded deterministic random helpers — mirrors the prototype's hashFloat / rotFor / pin logic
 * so polaroid scatter and push-pins are stable per item id.
 */

/** FNV-1a 32-bit hash → float in [0, 1) */
export function hashFloat(id: string, salt: string): number {
  let h = 2166136261 >>> 0;
  const s = id + salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0) / 4294967295;
}

/** Small rotation for guestbook notes */
export function rotFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h * 31 + id.charCodeAt(i)) >>> 0);
  return ((h % 9) - 4) * 0.85;
}

/** Returns CSS transform for a polaroid card */
export function polaroidTransform(id: string, angleProp: number | null): string {
  const angle = angleProp !== null && angleProp !== undefined
    ? angleProp
    : hashFloat(id, 'rot') * 16 - 8;
  const jx = (hashFloat(id, 'jx') * 28 - 14).toFixed(1);
  const sc = (0.96 + hashFloat(id, 'sc') * 0.08).toFixed(3);
  return `translateX(${jx}px) rotate(${angle.toFixed(2)}deg) scale(${sc})`;
}

/** Top margin (stagger) for a polaroid card */
export function polaroidMarginTop(id: string): number {
  return Math.round(hashFloat(id, 'mt') * 50);
}

const PIN_COLORS = ['#e8896b', '#7fa37a', '#7d9bc0', '#d98aa6', '#e0b15e', '#a98ec9'];

export interface PinData {
  color: string;
  offsetX: number; // px, applied with translateX
  tiltDeg: string; // deg, applied with rotate
}

/** Seeded push-pin parameters for a given item id */
export function pinData(id: string): PinData {
  const color = PIN_COLORS[Math.floor(hashFloat(id, 'pc') * PIN_COLORS.length)];
  const offsetX = Math.round(hashFloat(id, 'px') * 36 - 18);
  const tiltDeg = (hashFloat(id, 'pt') * 30 - 15).toFixed(1);
  return { color, offsetX, tiltDeg };
}
