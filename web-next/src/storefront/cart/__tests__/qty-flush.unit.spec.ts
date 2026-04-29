/**
 * Race-condition regression tests for the qty-flush runner used by `CartContext`.
 *
 * These tests reproduce the two bugs the user reported (lag + qty snapping back to
 * the previous number on rapid +/- clicks) WITHOUT React, JSDOM, or a live Medusa
 * backend, by driving `createQtyFlushRunner` through a controllable mock.
 *
 * What we assert (and would fail before the single-flight fix):
 *
 * 1. **No concurrent network writes** even when `run()` is invoked while a flush is
 *    in progress (the bug: a second timer firing during an in-flight first flush
 *    issued two concurrent `updateLineItem` POSTs against the same Medusa cart).
 * 2. **Per-line writes are serialised** within one drain (concurrency = 1), matching
 *    `lib/checkout-cart-rebuild.ts` `DEFAULT_CHECKOUT_LINE_ADD_CONCURRENCY = 1`.
 * 3. **The drain loop absorbs entries queued mid-flush** (latest qty wins, no
 *    "snap back" because the runner waits for the in-flight network round-trip
 *    before the loop iteration ends, then picks up the newer qty).
 * 4. **The cart applied to local state is the LAST successful response** — the bug
 *    where an earlier response committed last and overwrote the newer qty cannot
 *    happen with this contract.
 */
import {
  createQtyFlushRunner,
  type QtyFlushDeps,
  type QtyFlushPending,
} from "../qty-flush"
import type { MedusaCart } from "../../lib/medusa/types"

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (err: unknown) => void
}

function defer<T>(): Deferred<T> {
  let resolve: (value: T) => void = () => {}
  let reject: (err: unknown) => void = () => {}
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function makeCart(id: string, qty: number): MedusaCart {
  return {
    id,
    items: [{ id: "line_a", quantity: qty } as unknown as MedusaCart["items"][number]],
  } as unknown as MedusaCart
}

type Harness = {
  pending: Map<string, QtyFlushPending>
  flushingKeys: Set<string>
  generation: { current: number }
  cartId: { current: string | null }
  applyCalls: Array<{ qty: number; gen: number }>
  /** Wrapped in an object so reads see live mutations, not a stale snapshot. */
  syncCalls: { count: number }
  /** Issue order: ["lineId:qty", ...]. Used to assert serialisation across the suite. */
  updateOrder: string[]
  /**
   * Pending update calls awaiting a manual `resolve(cart)`. The harness blocks
   * each `updateLineItem` mock on a deferred so tests can interleave queueing with
   * in-flight writes deterministically.
   */
  inflightUpdates: Array<{ lineId: string; qty: number; respond: (cart: MedusaCart) => void; reject: (err: unknown) => void }>
  /** Wrapped in an object so reads see live mutations, not a stale snapshot. */
  parallelInflightSeen: { value: number }
  deps: QtyFlushDeps
}

function makeHarness(): Harness {
  const pending = new Map<string, QtyFlushPending>()
  const flushingKeys = new Set<string>()
  const generation = { current: 0 }
  const cartId: { current: string | null } = { current: "cart_test" }
  const applyCalls: Harness["applyCalls"] = []
  const syncCalls = { count: 0 }
  const updateOrder: string[] = []
  const inflightUpdates: Harness["inflightUpdates"] = []
  const parallelInflightSeen = { value: 0 }

  let parallel = 0
  const deps: QtyFlushDeps = {
    drainPending: () => {
      const captured = new Map(pending)
      pending.clear()
      return captured
    },
    hasPending: () => pending.size > 0,
    getCartId: () => cartId.current,
    getGeneration: () => generation.current,
    updateLineItem: (_cartId, lineId, qty) => {
      parallel += 1
      parallelInflightSeen.value = Math.max(parallelInflightSeen.value, parallel)
      updateOrder.push(`${lineId}:${qty}`)
      const d = defer<MedusaCart>()
      inflightUpdates.push({
        lineId,
        qty,
        respond: (cart) => {
          parallel -= 1
          d.resolve(cart)
        },
        reject: (err) => {
          parallel -= 1
          d.reject(err)
        },
      })
      return d.promise.then((cart) => ({ cart }))
    },
    syncCart: async () => {
      syncCalls.count += 1
    },
    applyCart: (cart, gen) => {
      const items = cart.items as ReadonlyArray<{ quantity: number }> | undefined
      const qty = items?.[0]?.quantity ?? 0
      applyCalls.push({ qty, gen })
    },
    flushingKeys,
    refreshSavingState: () => {},
  }

  return {
    pending,
    flushingKeys,
    generation,
    cartId,
    applyCalls,
    syncCalls,
    updateOrder,
    inflightUpdates,
    parallelInflightSeen,
    deps,
  }
}

function queueQty(h: Harness, lineId: string, qty: number) {
  h.pending.set(`line:${lineId}`, { lineId, qty })
}

/** Settle all current microtasks so awaits resolve before assertions. */
async function flushMicro() {
  for (let i = 0; i < 8; i += 1) await Promise.resolve()
}

describe("createQtyFlushRunner", () => {
  it("serialises updateLineItem calls within a single flush (concurrency = 1)", async () => {
    const h = makeHarness()
    const runner = createQtyFlushRunner(h.deps)
    queueQty(h, "line_a", 5)
    queueQty(h, "line_b", 7)

    const flushed = runner.run()

    // Both lineIds are pending; only the first should be in flight at any moment.
    await flushMicro()
    expect(h.inflightUpdates).toHaveLength(1)
    expect(h.inflightUpdates[0].lineId).toBe("line_a")

    h.inflightUpdates[0].respond(makeCart("cart_test", 5))
    await flushMicro()

    expect(h.inflightUpdates).toHaveLength(2)
    expect(h.inflightUpdates[1].lineId).toBe("line_b")
    h.inflightUpdates[1].respond(makeCart("cart_test", 7))

    await flushed

    // Critical invariant — never more than one in-flight write to the same cart.
    expect(h.parallelInflightSeen.value).toBe(1)
    expect(h.updateOrder).toEqual(["line_a:5", "line_b:7"])
    // Only the last response is applied (matches `addCheckoutCartLinesInParallelBatches`).
    expect(h.applyCalls.at(-1)).toEqual({ qty: 7, gen: 0 })
  })

  it("is single-flight: a second run() during an in-flight flush DOES NOT start a parallel network write", async () => {
    const h = makeHarness()
    const runner = createQtyFlushRunner(h.deps)
    queueQty(h, "line_a", 2)

    const first = runner.run()
    await flushMicro()
    expect(h.inflightUpdates).toHaveLength(1)
    expect(runner.isRunning()).toBe(true)

    // Simulate the next stepper click landing while the first POST is still in flight.
    queueQty(h, "line_a", 3)
    const second = runner.run()
    await flushMicro()

    // BEFORE THE FIX: this would already be 2 (two concurrent updateLineItem POSTs).
    expect(h.inflightUpdates).toHaveLength(1)
    expect(h.parallelInflightSeen.value).toBe(1)

    // First write commits qty=2.
    h.inflightUpdates[0].respond(makeCart("cart_test", 2))
    await flushMicro()

    // Drain loop now picks up qty=3 and issues exactly ONE more PUT.
    expect(h.inflightUpdates).toHaveLength(2)
    expect(h.inflightUpdates[1].qty).toBe(3)
    expect(h.parallelInflightSeen.value).toBe(1)
    h.inflightUpdates[1].respond(makeCart("cart_test", 3))

    await Promise.all([first, second])

    // Final state applied is the LATEST qty (no "snap back" to the previous number).
    expect(h.applyCalls.at(-1)).toEqual({ qty: 3, gen: 0 })
    // Calls were issued in click order.
    expect(h.updateOrder).toEqual(["line_a:2", "line_a:3"])
  })

  it("collapses multiple clicks within one debounce window into a single PUT (latest qty wins)", async () => {
    const h = makeHarness()
    const runner = createQtyFlushRunner(h.deps)

    // Three clicks land in the same pending window before the timer fires.
    queueQty(h, "line_a", 2)
    queueQty(h, "line_a", 3)
    queueQty(h, "line_a", 4)

    const flushed = runner.run()
    await flushMicro()

    expect(h.inflightUpdates).toHaveLength(1)
    expect(h.inflightUpdates[0].qty).toBe(4)
    h.inflightUpdates[0].respond(makeCart("cart_test", 4))
    await flushed

    expect(h.updateOrder).toEqual(["line_a:4"])
    expect(h.applyCalls.at(-1)).toEqual({ qty: 4, gen: 0 })
  })

  it("absorbs entries queued mid-flush — drain loop handles them on the next iteration", async () => {
    const h = makeHarness()
    const runner = createQtyFlushRunner(h.deps)
    queueQty(h, "line_a", 2)

    const flushed = runner.run()
    await flushMicro()
    expect(h.inflightUpdates).toHaveLength(1)

    // Click again WHILE the first PUT is still awaiting the network.
    queueQty(h, "line_a", 5)

    h.inflightUpdates[0].respond(makeCart("cart_test", 2))
    await flushMicro()

    // Drain loop should now process the new pending entry without requiring another run() call.
    expect(h.inflightUpdates).toHaveLength(2)
    expect(h.inflightUpdates[1].qty).toBe(5)
    h.inflightUpdates[1].respond(makeCart("cart_test", 5))

    await flushed

    expect(h.parallelInflightSeen.value).toBe(1)
    expect(h.updateOrder).toEqual(["line_a:2", "line_a:5"])
    expect(h.applyCalls.at(-1)).toEqual({ qty: 5, gen: 0 })
  })

  it("on update error, falls back to syncCart and stops applying responses", async () => {
    const h = makeHarness()
    const runner = createQtyFlushRunner(h.deps)
    queueQty(h, "line_a", 2)

    const flushed = runner.run()
    await flushMicro()

    h.inflightUpdates[0].reject(new Error("Medusa request failed (409): conflict"))
    await flushed

    expect(h.syncCalls.count).toBe(1)
    expect(h.applyCalls).toHaveLength(0)
  })

  it("clearCart bumping the generation aborts the drain before the next write", async () => {
    const h = makeHarness()
    const runner = createQtyFlushRunner(h.deps)
    queueQty(h, "line_a", 2)
    queueQty(h, "line_b", 3)

    const flushed = runner.run()
    await flushMicro()
    expect(h.inflightUpdates).toHaveLength(1)

    // Caller invokes clearCart while the first write is in flight.
    h.generation.current += 1
    h.cartId.current = null

    h.inflightUpdates[0].respond(makeCart("cart_test", 2))
    await flushed

    // The second `lineId`'s write was abandoned (no new `inflightUpdates` entry).
    expect(h.inflightUpdates).toHaveLength(1)
    // No `applyCart` for the stale generation, no syncCart attempted on the cleared id.
    expect(h.applyCalls).toHaveLength(0)
    expect(h.syncCalls.count).toBe(0)
  })

  it("isRunning() is false before run() and false after the flush settles", async () => {
    const h = makeHarness()
    const runner = createQtyFlushRunner(h.deps)
    expect(runner.isRunning()).toBe(false)

    queueQty(h, "line_a", 2)
    const flushed = runner.run()
    await flushMicro()
    expect(runner.isRunning()).toBe(true)

    h.inflightUpdates[0].respond(makeCart("cart_test", 2))
    await flushed
    expect(runner.isRunning()).toBe(false)
  })
})
