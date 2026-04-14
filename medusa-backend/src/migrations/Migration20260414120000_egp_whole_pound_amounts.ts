import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * NOTE (Medusa v2): `medusa db:migrate` does not run files under `src/migrations/`. Use
 * `npm run migrate:egp-prices` (`src/scripts/apply-egp-whole-pound-prices.ts`) to apply this SQL,
 * or run the statements manually against Postgres.
 *
 * Store EGP as whole pounds: `currency.decimal_digits = 0` and `price.amount` in integer EGP.
 * Converts existing rows that were stored in piastres (÷100) while EGP still used 2 decimals.
 * Idempotent: second run skips the price UPDATE when `currency` is already on 0 decimals.
 */
export class Migration20260414120000_egp_whole_pound_amounts extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      UPDATE "price" SET "amount" = ROUND("amount" / 100)
      WHERE "deleted_at" IS NULL
        AND LOWER("currency_code") = 'egp'
        AND "amount" >= 10000
        AND EXISTS (SELECT 1 FROM "currency" WHERE LOWER("code") = 'egp' AND "decimal_digits" = 2);
    `)
    this.addSql(`UPDATE "currency" SET "decimal_digits" = 0 WHERE LOWER("code") = 'egp';`)
  }

  override async down(): Promise<void> {
    this.addSql(`UPDATE "currency" SET "decimal_digits" = 2 WHERE LOWER("code") = 'egp';`)
    this.addSql(`
      UPDATE "price" SET "amount" = "amount" * 100
      WHERE "deleted_at" IS NULL AND LOWER("currency_code") = 'egp';
    `)
  }
}
