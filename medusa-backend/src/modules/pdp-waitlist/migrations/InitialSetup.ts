import { generateEntityId } from "@medusajs/framework/utils"
import { Migration } from "@mikro-orm/migrations"

export class InitialSetup extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "pdp_waitlist" (
        "id" text NOT NULL,
        "product_id" text NOT NULL,
        "email" text NOT NULL,
        "locale" text DEFAULT 'en',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        "notified_at" timestamptz NULL,
        CONSTRAINT "pdp_waitlist_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pdp_waitlist_product_email"
      ON "pdp_waitlist" ("product_id", "email")
      WHERE "deleted_at" IS NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "pdp_waitlist" CASCADE;`)
  }
}
