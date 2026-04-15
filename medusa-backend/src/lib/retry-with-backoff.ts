function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Retries an async operation with exponential backoff (base delay 400ms).
 * Use for outbound HTTP (Resend, WhatsApp) when a single transient failure should not drop the notification.
 */
export async function retryWithBackoff<T>(
  label: string,
  attempts: number,
  fn: () => Promise<T>,
  isSuccess: (result: T) => boolean,
  log: { warn: (msg: string) => void },
): Promise<T | null> {
  let last: T | undefined
  for (let i = 0; i < attempts; i++) {
    last = await fn()
    if (isSuccess(last)) {
      return last
    }
    if (i < attempts - 1) {
      await sleep(400 * 2 ** i)
    }
  }
  log.warn(`${label} failed after ${attempts} attempt(s).`)
  return last ?? null
}
