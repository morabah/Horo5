import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logApiError } from "@/lib/logging";
import { addCartLines, createCart, getCart } from "@/lib/shopify/commerce";

const cartLineSchema = z.object({
  merchandiseId: z.string().min(1),
  quantity: z.number().int().positive().max(99),
});

const cartMutationSchema = z.object({
  cartId: z.string().min(1).optional(),
  lines: z.array(cartLineSchema).min(1).max(50),
});

export async function GET(request: NextRequest) {
  try {
    const cartId = request.nextUrl.searchParams.get("id")?.trim();
    if (!cartId) {
      return NextResponse.json({ cart: null });
    }

    const cart = await getCart(cartId);
    return NextResponse.json({ cart });
  } catch (error) {
    logApiError("api.cart.get", error);
    return NextResponse.json({ message: "Unable to load cart right now." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = cartMutationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid cart payload." }, { status: 400 });
    }

    if (!parsed.data.cartId) {
      const cart = await createCart(parsed.data.lines);
      return NextResponse.json({ cart });
    }

    const cart = await addCartLines(parsed.data.cartId, parsed.data.lines);
    return NextResponse.json({ cart });
  } catch (error) {
    logApiError("api.cart.post", error);
    return NextResponse.json({ message: "Unable to update cart right now." }, { status: 500 });
  }
}
