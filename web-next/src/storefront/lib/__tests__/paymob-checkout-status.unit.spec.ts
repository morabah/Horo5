import { jest } from '@jest/globals';
import {
  PAYMOB_CHECKOUT_STATUS_MAX_ATTEMPTS,
  pollPaymobCheckoutStatus,
} from '../paymob-checkout-status';
import type { CheckoutStatusResponse } from '../medusa/types';

describe('pollPaymobCheckoutStatus', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('stops when status is no longer pending', async () => {
    const getCheckoutStatus = jest
      .fn<() => Promise<CheckoutStatusResponse | null>>()
      .mockResolvedValueOnce({ status: 'completed', order_id: 'ord_1' });

    const sleep = jest.fn<(ms: number) => Promise<void>>().mockImplementation(
      (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    );

    const p = pollPaymobCheckoutStatus(
      'cart_1',
      { status: 'pending' },
      { getCheckoutStatus, sleep },
    );

    await jest.runAllTimersAsync();
    const result = await p;

    expect(result?.status).toBe('completed');
    expect(getCheckoutStatus).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('respects attempt budget for repeated pending', async () => {
    const getCheckoutStatus = jest
      .fn<() => Promise<CheckoutStatusResponse | null>>()
      .mockResolvedValue({ status: 'pending' });

    const sleep = jest.fn<(ms: number) => Promise<void>>().mockImplementation(
      (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    );

    const p = pollPaymobCheckoutStatus(
      'cart_1',
      { status: 'pending' },
      { getCheckoutStatus, sleep },
    );

    await jest.runAllTimersAsync();
    const result = await p;

    expect(result?.status).toBe('pending');
    expect(getCheckoutStatus).toHaveBeenCalledTimes(PAYMOB_CHECKOUT_STATUS_MAX_ATTEMPTS);
    expect(sleep).toHaveBeenCalledTimes(PAYMOB_CHECKOUT_STATUS_MAX_ATTEMPTS);
  });

  it('stops when total time budget is exhausted', async () => {
    let t = 0;
    const getCheckoutStatus = jest
      .fn<() => Promise<CheckoutStatusResponse | null>>()
      .mockResolvedValue({ status: 'pending' });

    const sleep = jest.fn<(ms: number) => Promise<void>>().mockImplementation(
      (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    );

    const p = pollPaymobCheckoutStatus(
      'cart_1',
      { status: 'pending' },
      {
        getCheckoutStatus,
        sleep,
        nowMs: () => {
          t += 20_000;
          return t;
        },
      },
    );

    await jest.runAllTimersAsync();
    await p;

    expect(getCheckoutStatus).not.toHaveBeenCalled();
    expect(sleep).not.toHaveBeenCalled();
  });
});
