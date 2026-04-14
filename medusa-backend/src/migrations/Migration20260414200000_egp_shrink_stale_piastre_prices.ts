import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * NOTE (Medusa v2): `medusa db:migrate` does not run `src/migrations/` — use `npm run migrate:egp-prices`.
 *
 * If `currency.decimal_digits` was already set to `0` before `price.amount` rows were
 * divided by 100, catalog amounts stay in "piastre magnitudes" (e.g. 79900) and the storefront
 * shows 79,900 EGP. This pass shrinks obvious legacy rows once: whole-pound EGP tees are
 * expected under 10,000; anything ≥ 10,000 is treated as still stored in piastres.
 *
 * Idempotent: after amounts are in the hundreds/thousands range, `amount >= 10000` is false.
 */
export class Migration20260414200000_egp_shrink_stale_piastre_prices extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      UPDATE "price" SET "amount" = ROUND("amount" / 100)
      WHERE "deleted_at" IS NULL
        AND LOWER("currency_code") = 'egp'
        AND "amount" >= 10000
        AND EXISTS (SELECT 1 FROM "currency" WHERE LOWER("code") = 'egp' AND "decimal_digits" = 0);
    `)
  }

  override async down(): Promise<void> {
    // Not reversible without knowing which rows this migration adjusted.
  }
}
