import { runPoolByIndex } from "../horo-ops-bulk-pool";

describe("runPoolByIndex", () => {
  it("runs every index once and returns ordered results", async () => {
    const out = await runPoolByIndex(5, 2, async (i) => i * 10);
    expect(out).toEqual([0, 10, 20, 30, 40]);
  });

  it("never runs more than concurrency tasks at once", async () => {
    let active = 0;
    let maxActive = 0;
    const hold = () => new Promise<void>((r) => setTimeout(r, 20));
    await runPoolByIndex(12, 3, async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await hold();
      active -= 1;
      return 1;
    });
    expect(maxActive).toBeLessThanOrEqual(3);
  });
});
