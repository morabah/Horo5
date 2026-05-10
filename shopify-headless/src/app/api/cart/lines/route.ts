import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logApiError } from "@/lib/logging";
import { updateCartLines } from "@/lib/shopify/commerce";

const cartLineUpdateSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().min(0).max(99),
});

const cartLinesMutationSchema = z.object({
  cartId: z.string().min(1),
  lines: z.array(cartLineUpdateSchema).min(1).max(50),
});

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = cartLinesMutationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Missing cart update payload." }, { status: 400 });
    }

    const cart = await updateCartLines(parsed.data.cartId, parsed.data.lines);
    return NextResponse.json({ cart });
  } catch (error) {
    logApiError("api.cart.lines.patch", error);
    return NextResponse.json({ message: "Unable to update cart lines right now." }, { status: 500 });
  }
}
