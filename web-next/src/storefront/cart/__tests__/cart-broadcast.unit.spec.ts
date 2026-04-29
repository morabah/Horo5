/**
 * Unit tests for the cross-tab cart broadcast module.
 *
 * The Jest test environment is `node` (no `BroadcastChannel` global), so we
 * stub a minimal in-process implementation that mirrors the spec'd semantics:
 * `postMessage` fires `message` events on every OTHER channel sharing the same
 * name, never on the originator. This is the property that makes the
 * `inRemoteApplyRef` guard in `CartContext` sufficient to prevent broadcast
 * loops.
 */
import type { MedusaCart } from "../../lib/medusa/types"
import { createCartBroadcast } from "../cart-broadcast"

type Listener = (event: { data: unknown }) => void

class FakeBroadcastChannel {
  static channels = new Map<string, Set<FakeBroadcastChannel>>()
  private listeners = new Set<Listener>()
  closed = false

  constructor(public name: string) {
    if (!FakeBroadcastChannel.channels.has(name)) {
      FakeBroadcastChannel.channels.set(name, new Set())
    }
    FakeBroadcastChannel.channels.get(name)!.add(this)
  }

  addEventListener(_type: "message", listener: Listener) {
    this.listeners.add(listener)
  }

  removeEventListener(_type: "message", listener: Listener) {
    this.listeners.delete(listener)
  }

  postMessage(data: unknown) {
    if (this.closed) throw new Error("channel closed")
    const peers = FakeBroadcastChannel.channels.get(this.name) || new Set<FakeBroadcastChannel>()
    for (const ch of peers) {
      if (ch === this || ch.closed) continue
      for (const listener of ch.listeners) {
        listener({ data })
      }
    }
  }

  close() {
    this.closed = true
    FakeBroadcastChannel.channels.get(this.name)?.delete(this)
    this.listeners.clear()
  }
}

beforeAll(() => {
  ;(globalThis as unknown as { BroadcastChannel: typeof FakeBroadcastChannel }).BroadcastChannel =
    FakeBroadcastChannel
  ;(globalThis as unknown as { window: object }).window = globalThis as unknown as object
})

afterAll(() => {
  delete (globalThis as unknown as { BroadcastChannel?: typeof FakeBroadcastChannel })
    .BroadcastChannel
  delete (globalThis as unknown as { window?: object }).window
})

afterEach(() => {
  FakeBroadcastChannel.channels.clear()
})

function makeCart(id: string): MedusaCart {
  return { id, items: [] } as unknown as MedusaCart
}

describe("createCartBroadcast", () => {
  it("delivers `snapshot` to other tabs but never echoes to the sender", () => {
    const tabA = { snapshots: [] as MedusaCart[], clears: 0 }
    const tabB = { snapshots: [] as MedusaCart[], clears: 0 }
    const a = createCartBroadcast({
      onSnapshot: (cart) => tabA.snapshots.push(cart),
      onClear: () => {
        tabA.clears += 1
      },
    })
    const b = createCartBroadcast({
      onSnapshot: (cart) => tabB.snapshots.push(cart),
      onClear: () => {
        tabB.clears += 1
      },
    })

    a.broadcastSnapshot(makeCart("cart_x"))

    // Tab B receives, tab A does NOT (no echo) — this is the property that
    // lets `CartContext` use a simple ref guard against loops.
    expect(tabB.snapshots).toHaveLength(1)
    expect(tabB.snapshots[0].id).toBe("cart_x")
    expect(tabA.snapshots).toHaveLength(0)

    a.close()
    b.close()
  })

  it("delivers `clear` to siblings", () => {
    let aClears = 0
    let bClears = 0
    const a = createCartBroadcast({ onSnapshot: () => {}, onClear: () => (aClears += 1) })
    const b = createCartBroadcast({ onSnapshot: () => {}, onClear: () => (bClears += 1) })

    a.broadcastClear()
    expect(bClears).toBe(1)
    expect(aClears).toBe(0)

    a.close()
    b.close()
  })

  it("close() unsubscribes the receiver", () => {
    const seen: MedusaCart[] = []
    const a = createCartBroadcast({ onSnapshot: () => {}, onClear: () => {} })
    const b = createCartBroadcast({ onSnapshot: (c) => seen.push(c), onClear: () => {} })

    b.close()
    a.broadcastSnapshot(makeCart("cart_z"))

    expect(seen).toHaveLength(0)
    a.close()
  })

  it("returns a no-op when BroadcastChannel is unavailable (SSR / unsupported browser)", () => {
    const original = (globalThis as unknown as { BroadcastChannel?: unknown }).BroadcastChannel
    delete (globalThis as unknown as { BroadcastChannel?: unknown }).BroadcastChannel

    const seen: MedusaCart[] = []
    const handle = createCartBroadcast({
      onSnapshot: (c) => seen.push(c),
      onClear: () => {},
    })

    // No throws, all methods are safe to call.
    expect(() => handle.broadcastSnapshot(makeCart("cart_q"))).not.toThrow()
    expect(() => handle.broadcastClear()).not.toThrow()
    expect(() => handle.close()).not.toThrow()
    expect(seen).toHaveLength(0)

    ;(globalThis as unknown as { BroadcastChannel?: unknown }).BroadcastChannel = original
  })

  it("malformed messages from the channel are ignored", () => {
    let snapshots = 0
    let clears = 0
    const a = createCartBroadcast({
      onSnapshot: () => (snapshots += 1),
      onClear: () => (clears += 1),
    })
    // Reach into the fake to inject a junk payload directly to the receiver.
    const peer = new FakeBroadcastChannel("horo:cart:v1")
    peer.postMessage(null)
    peer.postMessage({ type: "unknown" })
    peer.postMessage({ type: "snapshot" /* missing cart */ })

    expect(snapshots).toBe(0)
    expect(clears).toBe(0)
    peer.close()
    a.close()
  })
})
