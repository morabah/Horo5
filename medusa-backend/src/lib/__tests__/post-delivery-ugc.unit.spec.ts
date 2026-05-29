import {
  buildPendingUgcRequestMetadata,
  isOrderDeliveredForUgc,
  isUgcRequestDue,
} from "../post-delivery-ugc"

describe("post-delivery UGC metadata", () => {
  it("stamps a pending due date without overwriting sent requests", () => {
    const deliveredAt = new Date("2026-05-01T10:00:00.000Z")
    const metadata = buildPendingUgcRequestMetadata({
      existingMetadata: {},
      deliveredAt,
      now: deliveredAt,
    })

    expect(metadata.ugc_request_status).toBe("pending")
    expect(metadata.ugc_request_channel).toBe("whatsapp")
    expect(metadata.ugc_request_due_at).toBe("2026-05-04T10:00:00.000Z")

    const sent = buildPendingUgcRequestMetadata({
      existingMetadata: { ugc_request_status: "sent", ugc_request_due_at: "old" },
      deliveredAt,
    })
    expect(sent.ugc_request_status).toBe("sent")
    expect(sent.ugc_request_due_at).toBe("old")
  })

  it("requires delivered orders and pending due metadata", () => {
    const due = {
      fulfillment_status: "fulfilled",
      metadata: {
        ugc_request_status: "pending",
        ugc_request_due_at: "2026-05-01T00:00:00.000Z",
      },
    }
    expect(isOrderDeliveredForUgc(due)).toBe(true)
    expect(isUgcRequestDue(due, new Date("2026-05-02T00:00:00.000Z"))).toBe(true)
    expect(isUgcRequestDue({ ...due, metadata: { ugc_request_status: "sent" } }, new Date("2026-05-02T00:00:00.000Z"))).toBe(false)
  })
})
