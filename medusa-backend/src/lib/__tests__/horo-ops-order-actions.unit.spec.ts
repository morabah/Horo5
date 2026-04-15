import { orderLineItemsForFulfillment } from "../horo-ops-order-actions"

describe("orderLineItemsForFulfillment", () => {
  it("reads flat items.* rows", () => {
    expect(
      orderLineItemsForFulfillment({
        items: [{ id: "orli_01", quantity: 2 }],
      }),
    ).toEqual([{ id: "orli_01", quantity: 2 }])
  })

  it("prefers nested item.id when Remote Query nests the line entity", () => {
    expect(
      orderLineItemsForFulfillment({
        items: [
          {
            id: "orditem_01",
            item: { id: "orli_01", title: "Tee" },
            quantity: 1,
          },
        ],
      }),
    ).toEqual([{ id: "orli_01", quantity: 1 }])
  })

  it("resolves quantity from detail when root quantity is missing", () => {
    expect(
      orderLineItemsForFulfillment({
        items: [{ id: "orli_02", detail: { quantity: "3" } }],
      }),
    ).toEqual([{ id: "orli_02", quantity: 3 }])
  })

  it("returns empty when items missing or not fulfillable", () => {
    expect(orderLineItemsForFulfillment({})).toEqual([])
    expect(orderLineItemsForFulfillment({ items: [] })).toEqual([])
    expect(orderLineItemsForFulfillment({ items: [{ id: "", quantity: 1 }] })).toEqual([])
    expect(orderLineItemsForFulfillment({ items: [{ id: "orli_x", quantity: 0 }] })).toEqual([])
  })
})
