import { NextRequest, NextResponse } from "next/server";

import { logApiError } from "@/lib/logging";
import { updateCartLines } from "@/lib/shopify/commerce";

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      cartId: string;
      lines: Array<{ id: string; quantity: number }>;
    };

    if (!body.cartId || !body.lines?.length) {
      return NextResponse.json({ message: "Missing cart update payload." }, { status: 400 });
    }

    const cart = await updateCartLines(body.cartId, body.lines);
    return NextResponse.json({ cart });
  } catch (error) {
    logApiError("api.cart.lines.patch", error);
    return NextResponse.json({ message: "Unable to update cart lines right now." }, { status: 500 });
  }
}
