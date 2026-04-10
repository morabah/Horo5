import { mkdir, readFile, appendFile } from "node:fs/promises";
import path from "node:path";

import { getOrderEventsStorePath } from "@/lib/env";

export type StoredOrderEvent = {
  source: "shopify";
  topic: string;
  webhookId: string;
  shopDomain: string | null;
  orderId: string;
  orderName: string | null;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  totalPrice: string | null;
  currency: string | null;
  orderStatusUrl: string | null;
  createdAt: string | null;
  processedAt: string | null;
  recordedAt: string;
};

function resolveStorePath(): string {
  return getOrderEventsStorePath() ?? path.join(process.cwd(), ".tmp", "shopify-order-events.ndjson");
}

async function readExistingEvents(filePath: string): Promise<StoredOrderEvent[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as StoredOrderEvent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export async function saveOrderEvent(event: StoredOrderEvent): Promise<{ saved: boolean; path: string }> {
  const filePath = resolveStorePath();
  const existing = await readExistingEvents(filePath);

  if (existing.some((entry) => entry.webhookId === event.webhookId)) {
    return { saved: false, path: filePath };
  }

  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");

  return { saved: true, path: filePath };
}
