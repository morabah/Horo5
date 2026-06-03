import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { ProductViewTracker } from "@/components/analytics/product-view-tracker";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { HoroImagePlaceholder } from "@/components/horo-image-placeholder";
import { formatMoney } from "@/lib/format";
import { env, siteUrl } from "@/lib/env";
import { isUnsafeShopifyProductImage, pickShopifyPdpHeroImage } from "@/lib/product-images";
import { getProductByHandle } from "@/lib/shopify/commerce";
import type { ShopifyImage, ShopifyMetafield } from "@/lib/shopify/types";

type ProductDetailPageProps = {
  params: Promise<{ handle: string }>;
};

function metafield(fields: ShopifyMetafield[], key: string, namespace = "custom"): string | undefined {
  return fields.find((field) => field.namespace === namespace && field.key === key)?.value || undefined;
}

function metafieldBoolean(fields: ShopifyMetafield[], key: string): boolean {
  const value = metafield(fields, key)?.trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

function metafieldList(fields: ShopifyMetafield[], key: string): string[] {
  const value = metafield(fields, key);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map(String).map((item) => item.trim()).filter(Boolean);
    }
  } catch {
    // Shopify single-line/list metafields may arrive as CSV/plain text.
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function imageHasTag(image: ShopifyImage, tag: string): boolean {
  return (image.altText || "").toLowerCase().includes(tag);
}

function firstTaggedImage(
  images: ShopifyImage[],
  tag: string,
  options: { allowProofImage?: boolean } = {},
): ShopifyImage | undefined {
  return images.find((image) => {
    if (!imageHasTag(image, tag)) return false;
    return options.allowProofImage || !isUnsafeShopifyProductImage(image);
  });
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) {
    return {
      title: "Product not found",
    };
  }
  const metaImage = pickShopifyPdpHeroImage(product);

  return {
    title: `${product.title} | HORO`,
    description: product.description.slice(0, 160),
    alternates: {
      canonical: `${siteUrl}/products/${product.handle}`,
    },
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      images: metaImage ? [{ url: metaImage.url }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) {
    notFound();
  }

  const heroImage = pickShopifyPdpHeroImage(product);
  const defaultVariant = product.variants[0];
  const fields = product.metafields;
  const feelsLike = metafieldList(fields, "feels_like");
  const worksFor = metafieldList(fields, "works_for");
  const story = metafield(fields, "story") || product.description;
  const storyDescription = metafield(fields, "story_description");
  const fitLabel = metafield(fields, "fit_label");
  const sizeTableKey = metafield(fields, "size_table_key");
  const artistDisplay = metafield(fields, "artist_display");
  const giftable = metafieldBoolean(fields, "giftable");
  const giftTags = metafieldList(fields, "gift_occasion_tags");
  const material = metafield(fields, "material") || "Cotton T-shirt";
  const careInstructions = metafield(fields, "care_instructions");
  const whatsappUrl =
    metafield(fields, "whatsapp_help_url") ||
    env.NEXT_PUBLIC_WHATSAPP_URL ||
    `https://wa.me/?text=${encodeURIComponent(`Need help with size for ${product.title}`)}`;
  const deliveryNote = metafield(fields, "delivery_note") || "Delivery timing appears at checkout.";
  const exchangeNote = metafield(fields, "exchange_note") || "Exchange support is available according to policy.";
  const lifestyleImage = firstTaggedImage(product.images, "lifestyle");
  const flatLayImage = firstTaggedImage(product.images, "flat_lay", { allowProofImage: true });
  const fabricProofImage = firstTaggedImage(product.images, "proof_fabric");
  const printProofImage = firstTaggedImage(product.images, "proof_print");
  const proofImages = [
    { label: "Lifestyle/on-body", image: lifestyleImage },
    { label: "Flat-lay", image: flatLayImage },
    { label: "Fabric proof", image: fabricProofImage },
    { label: "Print proof", image: printProofImage },
  ];
  const hasProofImages = proofImages.some((item) => Boolean(item.image));
  const sizes = product.variants.map((variant) => ({
    label: variant.selectedOptions.find((option) => option.name.toLowerCase() === "size")?.value || variant.title,
    available: variant.availableForSale,
    qty: variant.quantityAvailable,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 pb-28 md:px-8 md:pb-10">
      <ProductViewTracker
        productId={product.id}
        handle={product.handle}
        title={product.title}
        amount={product.priceRange.minVariantPrice.amount}
        currencyCode={product.priceRange.minVariantPrice.currencyCode}
      />
      <article className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-black/5">
            {heroImage ? (
              <Image
                src={heroImage.url}
                alt={heroImage.altText ?? product.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <HoroImagePlaceholder label={`${product.title} artwork preview`} />
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {proofImages.map(({ label, image }) => (
              <div key={label} className="space-y-1">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-black/5">
                  {image ? (
                    <Image
                      src={image.url}
                      alt={image.altText ?? `${label} for ${product.title}`}
                      fill
                      sizes="25vw"
                      className="object-cover"
                    />
                  ) : (
                    <HoroImagePlaceholder label={`${label} placeholder for ${product.title}`} compact />
                  )}
                </div>
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-black/55">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <h1 className="text-4xl font-bold">{product.title}</h1>
          {feelsLike.length > 0 ? (
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-black/55">
              Feels like: {feelsLike.join(", ")}
            </p>
          ) : null}
          <p className="text-2xl font-semibold text-black/80">
            {formatMoney(
              product.priceRange.minVariantPrice.amount,
              product.priceRange.minVariantPrice.currencyCode
            )}
          </p>

          {sizes.length > 0 ? (
            <section className="space-y-2 rounded-2xl border border-black/10 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-black/60">Size and fit</h2>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <span key={size.label} className={`rounded-full border px-3 py-1 text-sm ${size.available ? "border-black/20" : "border-black/10 text-black/35"}`}>
                    {size.label}{typeof size.qty === "number" && size.qty > 0 ? ` - ${size.qty}` : ""}
                  </span>
                ))}
              </div>
              <p className="text-sm text-black/65">
                {[fitLabel, sizeTableKey ? `Size table: ${sizeTableKey}` : null].filter(Boolean).join(" - ") || "Ask us on WhatsApp if you are between sizes."}
              </p>
            </section>
          ) : null}

          {defaultVariant ? (
            <AddToCartButton merchandiseId={defaultVariant.id} />
          ) : (
            <p className="text-sm text-red-700">No purchasable variant found for this product.</p>
          )}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-full border border-black/20 px-4 py-3 text-sm font-semibold hover:bg-black/5"
          >
            Need help with size? Ask us on WhatsApp
          </a>
          {giftable ? (
            <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">
              Buying it as a gift? Ask us for size help before ordering{giftTags.length > 0 ? ` - ${giftTags.join(", ")}` : ""}.
            </p>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            {["Artist-made design", material, "COD when available at checkout", "Exchange support"].map((badge) => (
              <span key={badge} className="rounded-full bg-black/[0.04] px-3 py-2 text-sm text-black/70">{badge}</span>
            ))}
          </div>
        </div>
      </article>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-black/10 p-5">
          <h2 className="text-lg font-semibold">Delivery and exchange</h2>
          <p className="mt-2 text-sm text-black/70">{deliveryNote}</p>
          <p className="mt-2 text-sm text-black/70">{exchangeNote}</p>
        </div>
        <div className="rounded-2xl border border-black/10 p-5">
          <h2 className="text-lg font-semibold">Design story</h2>
          <p className="mt-2 text-sm text-black/70">{story}</p>
          {storyDescription ? <p className="mt-2 text-sm text-black/70">{storyDescription}</p> : null}
          {worksFor.length > 0 ? <p className="mt-3 text-xs uppercase tracking-[0.14em] text-black/50">Works for: {worksFor.join(", ")}</p> : null}
        </div>
        <div className="rounded-2xl border border-black/10 p-5">
          <h2 className="text-lg font-semibold">Artist and process proof</h2>
          <p className="mt-2 text-sm text-black/70">
            {artistDisplay ? `Artist: ${artistDisplay}` : "Artist credit appears when configured in Shopify metafields."}
          </p>
          {hasProofImages ? <p className="mt-2 text-sm text-black/70">Proof images are tagged in Shopify media alt text.</p> : null}
        </div>
        <div className="rounded-2xl border border-black/10 p-5">
          <h2 className="text-lg font-semibold">Fabric, print, and care</h2>
          <p className="mt-2 text-sm text-black/70">{material}</p>
          {careInstructions ? <p className="mt-2 text-sm text-black/70">{careInstructions}</p> : null}
        </div>
      </section>
      {defaultVariant ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{product.title}</p>
              <p className="text-sm text-black/65">
                {formatMoney(
                  product.priceRange.minVariantPrice.amount,
                  product.priceRange.minVariantPrice.currencyCode
                )}
              </p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Get size help for ${product.title} on WhatsApp`}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white text-black transition hover:bg-black/5"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                <path fill="currentColor" d="M17.5 14.4c-.3-.1-1.8-.9-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-1.8-.9-3-1.9-3.8-3.8-.1-.3-.1-.4.1-.6.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4ZM12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-2.9.9 1-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2Z" />
              </svg>
            </a>
            <AddToCartButton merchandiseId={defaultVariant.id} className="shrink-0 px-5 py-3" />
          </div>
        </div>
      ) : null}
    </main>
  );
}
