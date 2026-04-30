/**
 * Link every HORO product to the Default Shipping Profile.
 *
 * WHY THIS EXISTS
 * ---------------
 * Medusa V2 enforces a hard invariant in `completeCartWorkflow`:
 *
 *   For every line item in the cart, the cart MUST carry a shipping method
 *   whose `shipping_profile_id` matches the item's product.shipping_profile.id.
 *   Otherwise `POST /store/carts/:id/complete` returns 400 with:
 *
 *     "The cart items require shipping profiles that are not satisfied by the
 *     current shipping methods"
 *
 * The historical `seed-egypt-catalog.ts` created products WITHOUT passing
 * `shipping_profile_id` to `createProductsWorkflow`. That bug has been fixed in
 * the seed for new/re-seeded products, but products that were already in the
 * database before the fix still have no link in `product_shipping_profile`.
 *
 * This script is the one-shot, idempotent backfill: it picks the
 * Default Shipping Profile (the same one the Egypt shipping option is created
 * against in `ensureEgyptCheckoutInfrastructure`) and links every product that
 * is missing a profile link to it.
 *
 * USAGE
 * -----
 *   # Preview which products WOULD be linked (no writes):
 *   npx medusa exec ./src/scripts/link-products-to-shipping-profile.ts dryrun
 *
 *   # Backfill (idempotent — safe to run repeatedly):
 *   npx medusa exec ./src/scripts/link-products-to-shipping-profile.ts
 *
 * BEHAVIOR
 * --------
 *   - already-linked: products whose `shipping_profile.id` already matches the
 *     target profile are skipped.
 *   - wrong-profile : products linked to a DIFFERENT shipping profile are NOT
 *     touched. The script logs a warning so you can decide explicitly. (HORO
 *     only has one default profile today, so this should normally be empty.)
 *   - missing       : products with no link are linked to the Default Shipping
 *     Profile.
 *
 * NOTE
 * ----
 * Because Medusa's CLI argument parser swallows `--flags`, this script uses
 * the bare positional token `dryrun` to enable dry-run mode (mirrors
 * `enable-variant-stock-tracking.ts`).
 */

import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

type ShippingProfileRow = {
  id: string;
  name: string;
  type: string | null;
};

type ProductRow = {
  id: string;
  handle: string | null;
  shipping_profile?: { id: string; name?: string | null } | null;
};

export type LinkProductsToShippingProfileOptions = {
  dryRun?: boolean;
};

export type LinkProductsToShippingProfileResult = {
  summary: string;
  details: {
    dryRun: boolean;
    targetProfileId: string;
    targetProfileName: string;
    totalProducts: number;
    alreadyLinked: number;
    wrongProfile: number;
    missing: number;
    linked: number;
    sampleMissing: string[];
    sampleWrongProfile: string[];
  };
};

async function ensureLinkExists(
  link: { create: (input: Record<string, unknown>) => Promise<unknown> },
  input: Record<string, unknown>,
) {
  try {
    await link.create(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/(already exists|already linked|duplicate|exists)/i.test(message)) {
      throw error;
    }
  }
}

export async function runLinkProductsToShippingProfile(
  container: ExecArgs["container"],
  options: LinkProductsToShippingProfileOptions = {},
): Promise<LinkProductsToShippingProfileResult> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const link = container.resolve<{
    create: (input: Record<string, unknown>) => Promise<unknown>;
  }>(ContainerRegistrationKeys.LINK);
  const fulfillmentModule = container.resolve<{
    listShippingProfiles: (filter?: Record<string, unknown>) => Promise<ShippingProfileRow[]>;
  }>(Modules.FULFILLMENT);

  const dryRun = Boolean(options.dryRun);

  // 1) Resolve the target shipping profile.
  // Prefer type:"default", then a profile whose name contains "default",
  // then the first profile we see. This mirrors Medusa's own
  // `migrate-product-shipping-profile` migration.
  const defaults = await fulfillmentModule.listShippingProfiles({ type: "default" });
  const allProfiles = defaults.length
    ? defaults
    : await fulfillmentModule.listShippingProfiles({});

  if (!allProfiles.length) {
    throw new Error(
      "No shipping profiles exist yet. Run the catalog seed first " +
        "(npx medusa exec ./src/scripts/seed-egypt-catalog.ts) so the " +
        "Default Shipping Profile is created.",
    );
  }

  const profile =
    allProfiles.find((p) => p.name?.toLowerCase().includes("default")) ?? allProfiles[0];

  logger.info(
    `link-products-to-shipping-profile: target profile="${profile.name}" id=${profile.id}` +
      (dryRun ? " (DRY RUN)" : ""),
  );

  // 2) Read every product and its current shipping_profile link.
  const { data: productsRaw } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "shipping_profile.id", "shipping_profile.name"],
    pagination: { take: 10000 },
  });
  const products = (productsRaw || []) as ProductRow[];

  if (!products.length) {
    logger.info("No products in the catalog — nothing to do.");
    return {
      summary: "No products in the catalog.",
      details: {
        dryRun,
        targetProfileId: profile.id,
        targetProfileName: profile.name,
        totalProducts: 0,
        alreadyLinked: 0,
        wrongProfile: 0,
        missing: 0,
        linked: 0,
        sampleMissing: [],
        sampleWrongProfile: [],
      },
    };
  }

  const linkedCorrectly: ProductRow[] = [];
  const linkedToWrongProfile: ProductRow[] = [];
  const missing: ProductRow[] = [];

  for (const p of products) {
    const currentId = p.shipping_profile?.id ?? null;
    if (!currentId) {
      missing.push(p);
    } else if (currentId === profile.id) {
      linkedCorrectly.push(p);
    } else {
      linkedToWrongProfile.push(p);
    }
  }

  logger.info(
    `Products: total=${products.length}, already-linked=${linkedCorrectly.length}, ` +
      `wrong-profile=${linkedToWrongProfile.length}, missing=${missing.length}`,
  );

  if (linkedToWrongProfile.length) {
    const sample = linkedToWrongProfile
      .slice(0, 5)
      .map((p) => `${p.handle ?? p.id}→${p.shipping_profile?.name ?? p.shipping_profile?.id}`)
      .join(", ");
    logger.warn(
      `${linkedToWrongProfile.length} product(s) are linked to a different shipping ` +
        `profile and will be left untouched. Sample: ${sample}` +
        (linkedToWrongProfile.length > 5 ? " ..." : ""),
    );
  }

  if (!missing.length) {
    logger.info(
      "Nothing to backfill — every product already has a shipping profile link.",
    );
    return {
      summary: "Every product already has a shipping profile link.",
      details: {
        dryRun,
        targetProfileId: profile.id,
        targetProfileName: profile.name,
        totalProducts: products.length,
        alreadyLinked: linkedCorrectly.length,
        wrongProfile: linkedToWrongProfile.length,
        missing: 0,
        linked: 0,
        sampleMissing: [],
        sampleWrongProfile: linkedToWrongProfile.slice(0, 10).map((p) => p.handle ?? p.id),
      },
    };
  }

  if (dryRun) {
    const preview = missing
      .slice(0, 10)
      .map((p) => p.handle ?? p.id)
      .join(", ");
    logger.info(
      `DRY RUN — would create ${missing.length} product↔shipping_profile link(s). ` +
        `Sample: ${preview}${missing.length > 10 ? " ..." : ""}`,
    );
    return {
      summary: `Dry run: would link ${missing.length} product(s) to "${profile.name}".`,
      details: {
        dryRun,
        targetProfileId: profile.id,
        targetProfileName: profile.name,
        totalProducts: products.length,
        alreadyLinked: linkedCorrectly.length,
        wrongProfile: linkedToWrongProfile.length,
        missing: missing.length,
        linked: 0,
        sampleMissing: missing.slice(0, 10).map((p) => p.handle ?? p.id),
        sampleWrongProfile: linkedToWrongProfile.slice(0, 10).map((p) => p.handle ?? p.id),
      },
    };
  }

  // 3) Create the missing links. Use ensureLinkExists so this is safe to
  //    re-run if the script is interrupted partway through.
  let linked = 0;
  for (const p of missing) {
    await ensureLinkExists(link, {
      [Modules.PRODUCT]: { product_id: p.id },
      [Modules.FULFILLMENT]: { shipping_profile_id: profile.id },
    });
    linked++;
  }

  logger.info(
    `Linked ${missing.length} product(s) to shipping profile "${profile.name}".`,
  );
  logger.info(
    "Done. POST /store/carts/:id/complete will now pass the shipping-profile " +
      "validation for these products, provided the cart has a shipping method " +
      "for the same profile (the storefront's checkout already attaches one).",
  );
  return {
    summary: `Linked ${linked} product(s) to shipping profile "${profile.name}".`,
    details: {
      dryRun,
      targetProfileId: profile.id,
      targetProfileName: profile.name,
      totalProducts: products.length,
      alreadyLinked: linkedCorrectly.length,
      wrongProfile: linkedToWrongProfile.length,
      missing: missing.length,
      linked,
      sampleMissing: missing.slice(0, 10).map((p) => p.handle ?? p.id),
      sampleWrongProfile: linkedToWrongProfile.slice(0, 10).map((p) => p.handle ?? p.id),
    },
  };
}

export default async function linkProductsToShippingProfile({
  container,
  args,
}: ExecArgs) {
  await runLinkProductsToShippingProfile(container, {
    dryRun: Array.isArray(args) && args.includes("dryrun"),
  });
}
