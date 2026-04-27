import { PageSkeleton, SkeletonText } from "@/storefront/components/ui/Skeleton";

export default function CheckoutLoading() {
  return (
    <PageSkeleton>
      <SkeletonText lines={2} />
    </PageSkeleton>
  );
}
