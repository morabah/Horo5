import {
  customerDisplayNameFromGraph,
  filterOrdersByFulfillmentChip,
  filterOrdersByPaymentChip,
  sortSummarizedOrders,
} from "../horo-ops-dashboard-table-helpers";

describe("horo-ops-dashboard-table-helpers", () => {
  const rows = [
    {
      id: "a",
      display_id: 2,
      friendly: null,
      email: "a@test.com",
      created_at: "2024-01-02T00:00:00.000Z",
      total: 100,
      payment_status: "captured",
      fulfillment_status: "not_fulfilled",
      sla_deadline_day_utc: "2024-01-10",
    },
    {
      id: "b",
      display_id: 1,
      friendly: null,
      email: "b@test.com",
      created_at: "2024-01-01T00:00:00.000Z",
      total: 200,
      payment_status: "pending",
      fulfillment_status: "fulfilled",
      sla_deadline_day_utc: "2024-01-05",
    },
  ];

  it("sortSummarizedOrders sorts by total desc", () => {
    const s = sortSummarizedOrders(rows, "total", "desc");
    expect(s[0].id).toBe("b");
    expect(s[1].id).toBe("a");
  });

  it("sortSummarizedOrders sorts by created asc", () => {
    const s = sortSummarizedOrders(rows, "created", "asc");
    expect(s[0].id).toBe("b");
    expect(s[1].id).toBe("a");
  });

  it("sortSummarizedOrders sorts by sla day", () => {
    const s = sortSummarizedOrders(rows, "sla", "asc");
    expect(s[0].id).toBe("b");
    expect(s[1].id).toBe("a");
  });

  it("sortSummarizedOrders sorts by ref", () => {
    const s = sortSummarizedOrders(rows, "ref", "asc");
    expect(s.map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("filterOrdersByPaymentChip captured", () => {
    const f = filterOrdersByPaymentChip(rows, "captured");
    expect(f.map((r) => r.id)).toEqual(["a"]);
  });

  it("filterOrdersByFulfillmentChip not_fulfilled", () => {
    const f = filterOrdersByFulfillmentChip(rows, "not_fulfilled");
    expect(f.map((r) => r.id)).toEqual(["a"]);
  });

  it("customerDisplayNameFromGraph uses shipping_address", () => {
    const name = customerDisplayNameFromGraph({
      shipping_address: { first_name: "Sam", last_name: "Lee" },
    });
    expect(name).toBe("Sam Lee");
  });
});
