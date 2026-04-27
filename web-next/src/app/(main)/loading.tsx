import { PageSkeleton, SkeletonText } from "@/storefront/components/ui/Skeleton";

export default function MainLoading() {
  return (
    <PageSkeleton>
      <SkeletonText lines={3} />
    </PageSkeleton>
  );
}
