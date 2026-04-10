import Image from "next/image";
import Link from "next/link";

import type { ShopifyCollection } from "@/lib/shopify/types";

type CollectionCardProps = {
  collection: ShopifyCollection;
};

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link
      href={`/products?collection=${collection.handle}`}
      className="group block overflow-hidden rounded-2xl border border-black/10 bg-white"
    >
      <div className="relative aspect-[16/9] bg-black/5">
        {collection.image ? (
          <Image
            src={collection.image.url}
            alt={collection.image.altText ?? collection.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : null}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="font-semibold">{collection.title}</h3>
        <p className="line-clamp-2 text-sm text-black/70">{collection.description}</p>
      </div>
    </Link>
  );
}
