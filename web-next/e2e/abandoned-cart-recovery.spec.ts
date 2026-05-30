import { expect, test } from "@playwright/test"

import { createTestCartRecoverToken, createTestUnsubscribeToken } from "./helpers/cart-recover-token"

const RECOVER_SECRET = process.env.HORO_CART_RECOVER_SECRET?.trim() || ""
const MEDUSA_BASE = process.env.MEDUSA_BACKEND_URL?.trim() || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.trim() || ""
const PUBLISHABLE = process.env.MEDUSA_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY?.trim() || ""

test.describe("abandoned cart recovery (staging)", () => {
  test("cart-recover sets Medusa cart cookie when token is valid", async ({ page }) => {
    test.skip(!RECOVER_SECRET, "HORO_CART_RECOVER_SECRET not set")

    const token = createTestCartRecoverToken({
      cartId: "cart_test_recover_e2e",
      email: "e2e@horo.test",
      secret: RECOVER_SECRET,
    })

    await page.goto(`/api/cart-recover?token=${encodeURIComponent(token)}`)
    await expect(page).toHaveURL(/\/cart\?recovered=1/)
    const cookies = await page.context().cookies()
    const cartCookie = cookies.find((c) => c.name === "horo_cart_id")
    expect(cartCookie?.value).toBe("cart_test_recover_e2e")
  })

  test("unsubscribe proxy redirects when Medusa accepts token", async ({ page, request }) => {
    test.skip(!RECOVER_SECRET || !MEDUSA_BASE || !PUBLISHABLE, "Medusa + recover secret required")

    const token = createTestUnsubscribeToken({
      email: `e2e-unsub-${Date.now()}@horo.test`,
      secret: RECOVER_SECRET,
    })

    const medusaProbe = await request.get(
      `${MEDUSA_BASE.replace(/\/$/, "")}/store/custom/abandoned-cart/unsubscribe?token=${encodeURIComponent(token)}`,
      { headers: { "x-publishable-api-key": PUBLISHABLE } },
    )
    test.skip(!medusaProbe.ok(), "Medusa unsubscribe route unavailable")

    await page.goto(`/api/abandoned-cart/unsubscribe?token=${encodeURIComponent(token)}`)
    await expect(page).toHaveURL(/\?unsubscribe=cart-reminders/)
  })
})
