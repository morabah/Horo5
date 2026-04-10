import Image from "next/image";
import Link from "next/link";

import { formatMoney } from "@/lib/format";
import type { ShopifyProduct } from "@/lib/shopify/types";

type ProductCardProps = {
  product: ShopifyProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const image = product.featuredImage ?? product.images[0];
  const price = formatMoney(
    product.priceRange.minVariantPrice.amount,
    product.priceRange.minVariantPrice.currencyCode
  );

  return (
    <article className="group overflow-hidden rounded-2xl border border-black/10 bg-white">
      <Link href={`/products/${product.handle}`} className="block">
        <div className="relative aspect-[4/5] bg-black/5">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : null}
        </div>
        <div className="space-y-1 p-4">
          <h3 className="line-clamp-1 font-semibold">{product.title}</h3>
          <p className="text-sm text-black/70">{price}</p>
        </div>
      </Link>
    </article>
  );
}
