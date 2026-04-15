/**
 * Fixed-concurrency index pool (used by bulk capture API).
 * Each index is processed exactly once; at most `concurrency` workers run at a time.
 */
export async function runPoolByIndex<T>(itemCount: number, concurrency: number, worker: (index: number) => Promise<T>): Promise<T[]> {
  if (itemCount <= 0) return [];
  const results: T[] = new Array(itemCount);
  let next = 0;
  const runners = Math.min(Math.max(1, concurrency), itemCount);

  const run = async () => {
    while (true) {
      const i = next++;
      if (i >= itemCount) return;
      results[i] = await worker(i);
    }
  };

  await Promise.all(Array.from({ length: runners }, () => run()));
  return results;
}
