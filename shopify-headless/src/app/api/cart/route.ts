import { NextRequest, NextResponse } from "next/server";

import { logApiError } from "@/lib/logging";
import { addCartLines, createCart, getCart } from "@/lib/shopify/commerce";

export async function GET(request: NextRequest) {
  try {
    const cartId = request.nextUrl.searchParams.get("id");
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
    const body = (await request.json()) as {
      cartId?: string;
      lines: Array<{ merchandiseId: string; quantity: number }>;
    };

    if (!body.lines?.length) {
      return NextResponse.json({ message: "No lines provided." }, { status: 400 });
    }

    if (!body.cartId) {
      const cart = await createCart(body.lines);
      return NextResponse.json({ cart });
    }

    const cart = await addCartLines(body.cartId, body.lines);
    return NextResponse.json({ cart });
  } catch (error) {
    logApiError("api.cart.post", error);
    return NextResponse.json({ message: "Unable to update cart right now." }, { status: 500 });
  }
}
