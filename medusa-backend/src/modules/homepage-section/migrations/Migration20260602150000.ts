import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Add `editorial_feature` homepage section type for reusable editorial blocks.
 */
export class Migration20260602150000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "storefront_homepage_section"
      DROP CONSTRAINT IF EXISTS "storefront_homepage_section_type_check";
    `)
    this.addSql(`
      ALTER TABLE "storefront_homepage_section"
      ADD CONSTRAINT "storefront_homepage_section_type_check"
      CHECK ("type" IN (
        'hero', 'trust_ribbon', 'primary_routes', 'founding_drop', 'featured_piece',
        'feeling_grid', 'occasion_grid', 'gift_block', 'why_horo', 'first_drop_circle',
        'proof_strip', 'seen_on_you', 'artist_spotlight', 'editorial_feature'
      ));
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`
      ALTER TABLE "storefront_homepage_section"
      DROP CONSTRAINT IF EXISTS "storefront_homepage_section_type_check";
    `)
    this.addSql(`
      ALTER TABLE "storefront_homepage_section"
      ADD CONSTRAINT "storefront_homepage_section_type_check"
      CHECK ("type" IN (
        'hero', 'trust_ribbon', 'primary_routes', 'founding_drop', 'featured_piece',
        'feeling_grid', 'occasion_grid', 'gift_block', 'why_horo', 'first_drop_circle',
        'proof_strip', 'seen_on_you', 'artist_spotlight'
      ));
    `)
  }
}
