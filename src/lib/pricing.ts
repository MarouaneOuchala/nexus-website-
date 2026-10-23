export const MIN_SESSIONS = 5;
export const MAX_SESSIONS = 40;
export const DEFAULT_SESSIONS = 16;
export const BASE_RATE = 180;

// Anchored so that 16 sessions cost exactly 2,699 MAD.
const MID_RATE = 2699 / 16;

export const tiers = [
  { from: 5, to: 10, rate: 180 },
  { from: 11, to: 20, rate: 169 },
  { from: 21, to: 40, rate: 155 },
];

export function getTotal(sessions: number): number {
  if (sessions <= 10) return sessions * BASE_RATE;
  if (sessions <= 20) return Math.round(sessions * MID_RATE);
  // Never cheaper than 20 sessions, so crossing into the 21+ tier cannot lower the total.
  return Math.max(sessions * 155, Math.round(20 * MID_RATE));
}

export function getTierIndex(sessions: number): number {
  return tiers.findIndex((tier) => sessions >= tier.from && sessions <= tier.to);
}
