import type { CheckoutStatusResponse } from './medusa/types';

/** Poll attempts while Medusa checkout status stays `pending` (Paymob webhook lag). */
export const PAYMOB_CHECKOUT_STATUS_MAX_ATTEMPTS = 8;

/** Hard cap on total wait time across sleeps + network (milliseconds). */
export const PAYMOB_CHECKOUT_STATUS_MAX_TOTAL_MS = 15_000;

export type PollPaymobCheckoutStatusDeps = {
  getCheckoutStatus: (cartId: string) => Promise<CheckoutStatusResponse | null>;
  sleep: (ms: number) => Promise<void>;
  nowMs?: () => number;
};

function backoffMsForAttempt(attempt: number): number {
  const base = 450;
  return Math.round(Math.min(3500, base * 1.55 ** attempt));
}

/**
 * Polls checkout completion status after Paymob redirect while status is `pending`.
 * Uses exponential backoff with a total wall-clock budget.
 */
export async function pollPaymobCheckoutStatus(
  cartId: string,
  initial: CheckoutStatusResponse | null,
  deps: PollPaymobCheckoutStatusDeps,
): Promise<CheckoutStatusResponse | null> {
  const { getCheckoutStatus, sleep, nowMs = () => Date.now() } = deps;
  let s = initial;
  const deadline = nowMs() + PAYMOB_CHECKOUT_STATUS_MAX_TOTAL_MS;

  for (let attempt = 0; attempt < PAYMOB_CHECKOUT_STATUS_MAX_ATTEMPTS && s?.status === 'pending'; attempt += 1) {
    const remaining = deadline - nowMs();
    if (remaining <= 0) break;
    const wait = Math.min(backoffMsForAttempt(attempt), remaining);
    await sleep(wait);
    s = await getCheckoutStatus(cartId).catch(() => null);
  }

  return s;
}
