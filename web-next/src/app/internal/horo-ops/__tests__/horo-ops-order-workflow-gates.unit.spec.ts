import {
  canCapturePayment,
  canCreateFulfillment,
  canMarkFulfillmentDelivered,
  resolveNextOpsAction,
} from "../horo-ops-order-workflow-gates";

function graph(partial: Record<string, unknown>): Record<string, unknown> {
  return { ...partial };
}

describe("horo-ops-order-workflow-gates", () => {
  it("resolveNextOpsAction prefers capture when payment pending", () => {
    const g = graph({
      payment_status: "awaiting",
      fulfillment_status: "not_fulfilled",
      status: "pending",
      payment_collections: [
        {
          payments: [{ status: "pending", provider_id: "pp_system_default" }],
        },
      ],
      items: [{ id: "li1" }],
    });
    expect(canCapturePayment(g)).toBe(true);
    expect(resolveNextOpsAction(g)).toBe("capture_payment");
  });

  it("resolveNextOpsAction chooses fulfillment after capture", () => {
    const g = graph({
      payment_status: "captured",
      fulfillment_status: "not_fulfilled",
      status: "pending",
      payment_collections: [
        {
          payments: [{ status: "captured", provider_id: "pp_system_default" }],
        },
      ],
      items: [{ id: "li1" }],
    });
    expect(canCapturePayment(g)).toBe(false);
    expect(canCreateFulfillment(g)).toBe(true);
    expect(resolveNextOpsAction(g)).toBe("create_fulfillment");
  });

  it("resolveNextOpsAction chooses mark delivered when fulfillment open", () => {
    const g = graph({
      payment_status: "captured",
      fulfillment_status: "fulfilled",
      status: "pending",
      payment_collections: [
        {
          payments: [{ status: "captured", provider_id: "pp_system_default" }],
        },
      ],
      fulfillments: [{ id: "f1", delivered_at: null }],
      items: [{ id: "li1" }],
    });
    expect(canCapturePayment(g)).toBe(false);
    expect(canCreateFulfillment(g)).toBe(false);
    expect(canMarkFulfillmentDelivered(g)).toBe(true);
    expect(resolveNextOpsAction(g)).toBe("mark_fulfillment_delivered");
  });

  it("Instapay uncaptured blocks fulfillment until capture", () => {
    const g = graph({
      payment_status: "awaiting",
      fulfillment_status: "not_fulfilled",
      status: "pending",
      payment_collections: [
        {
          payment_sessions: [{ provider_id: "instapay_something" }],
          payments: [],
        },
      ],
      items: [{ id: "li1" }],
    });
    expect(canCapturePayment(g)).toBe(true);
    expect(canCreateFulfillment(g)).toBe(false);
    expect(resolveNextOpsAction(g)).toBe("capture_payment");
  });
});
