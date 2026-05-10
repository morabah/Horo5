import crypto from "node:crypto"

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789"

export function generateReferralCode(email: string): string {
  const input = `${email}:${Date.now()}:${crypto.randomBytes(4).toString("hex")}`
  const hash = crypto.createHash("sha256").update(input).digest("hex")
  let code = ""
  for (let i = 0; i < 8; i++) {
    const idx = parseInt(hash.slice(i * 2, i * 2 + 2), 16) % ALPHABET.length
    code += ALPHABET[idx]
  }
  return code
}
