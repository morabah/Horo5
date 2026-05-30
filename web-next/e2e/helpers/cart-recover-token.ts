import { createHmac } from "crypto"

export function createTestCartRecoverToken(args: {
  cartId: string
  email: string
  secret: string
  ttlSec?: number
}): string {
  const exp = Math.floor(Date.now() / 1000) + (args.ttlSec ?? 3600)
  const encoded = Buffer.from(
    JSON.stringify({
      cart_id: args.cartId,
      email: args.email.trim().toLowerCase(),
      exp,
    }),
    "utf8",
  ).toString("base64url")
  const sig = createHmac("sha256", args.secret).update(encoded).digest("base64url")
  return `${encoded}.${sig}`
}

export function createTestUnsubscribeToken(args: {
  email: string
  secret: string
}): string {
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24
  const encoded = Buffer.from(
    JSON.stringify({
      email: args.email.trim().toLowerCase(),
      exp,
      kind: "abandon_unsub",
    }),
    "utf8",
  ).toString("base64url")
  const sig = createHmac("sha256", args.secret).update(encoded).digest("base64url")
  return `${encoded}.${sig}`
}
