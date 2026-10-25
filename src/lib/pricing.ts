export const SESSION_BUNDLES = [8, 16, 24, 32] as const;
export const MIN_SESSIONS = SESSION_BUNDLES[0];
export const MAX_SESSIONS = SESSION_BUNDLES[SESSION_BUNDLES.length - 1];
export const SESSION_STEP = SESSION_BUNDLES[1] - SESSION_BUNDLES[0];
export const DEFAULT_SESSIONS = 16;
export const BASE_RATE = 180;

// Anchored so that 16 sessions cost exactly 2,699 MAD.
const MID_RATE = 2699 / 16;

function roundUpTo99(price: number): number {
  return Math.ceil((price - 99) / 100) * 100 + 99;
}

export function getTotal(sessions: number): number {
  const price =
    sessions <= 10
      ? sessions * BASE_RATE
      : sessions <= 20
        ? Math.round(sessions * MID_RATE)
        : Math.max(sessions * 155, Math.round(20 * MID_RATE));

  const discountedPrice = roundUpTo99(price);
  const regularPrice = getRegularTotal(sessions);

  return discountedPrice < regularPrice ? discountedPrice : Math.floor((regularPrice - 99) / 100) * 100 + 99;
}

export function getRegularTotal(sessions: number): number {
  return sessions * BASE_RATE;
}
