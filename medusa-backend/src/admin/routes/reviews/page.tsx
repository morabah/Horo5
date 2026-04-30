import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { ReviewCard } from "../../components/reviews/ReviewCard"
import { sdk } from "../../lib/sdk"
import { REVIEW_STATUSES, type AdminReview, type ReviewStatus } from "../../../lib/reviews/types"

type ReviewsResponse = {
  reviews: AdminReview[]
  count: number
}

async function fetchReviews(status?: ReviewStatus, productId?: string) {
  const params = new URLSearchParams()
  if (status) params.set("status", status)
  if (productId) params.set("product_id", productId)
  return sdk.client.fetch<ReviewsResponse>(`/admin/custom/reviews?${params.toString()}`, { method: "GET" })
}

async function updateReviewStatus(id: string, status: ReviewStatus) {
  return sdk.client.fetch(`/admin/custom/reviews/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { status },
  })
}

async function bulkUpdateReviewStatus(ids: string[], status: ReviewStatus) {
  return sdk.client.fetch("/admin/custom/reviews", {
    method: "PATCH",
    body: { ids, status },
  })
}

async function deleteReview(id: string) {
  return sdk.client.fetch(`/admin/custom/reviews/${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
}

type TabValue = "all" | "pending" | "approved" | "rejected"

export default function ReviewsPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TabValue>("pending")
  const [productIdFilter, setProductIdFilter] = useState("")

  const statusFilter = tab === "all" ? undefined : tab as ReviewStatus

  const { data, isLoading } = useQuery({
    queryKey: ["horo", "reviews", tab, productIdFilter],
    queryFn: () => fetchReviews(statusFilter, productIdFilter || undefined),
    staleTime: 30_000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) => updateReviewStatus(id, status),
    onSuccess: async () => {
      toast.success("Review updated.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "reviews"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed."),
  })

  const bulkApproveMutation = useMutation({
    mutationFn: () => {
      const pendingIds = (data?.reviews ?? [])
        .filter((r) => r.status === "pending")
        .map((r) => r.id)
      if (pendingIds.length === 0) throw new Error("No pending reviews.")
      return bulkUpdateReviewStatus(pendingIds, "approved")
    },
    onSuccess: async () => {
      toast.success("All pending reviews approved.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "reviews"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Bulk approve failed."),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: async () => {
      toast.success("Review deleted.")
      await queryClient.invalidateQueries({ queryKey: ["horo", "reviews"] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Delete failed."),
  })

  const reviews = data?.reviews ?? []
  const count = data?.count ?? 0
  const busy = updateMutation.isPending || bulkApproveMutation.isPending || deleteMutation.isPending

  const pendingCount = reviews.filter((r) => r.status === "pending").length

  return (
    <Container className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Heading level="h1">Product Reviews</Heading>
          <Badge size="small" color="orange">{count}</Badge>
        </div>
        <Text size="small" className="mt-1 text-ui-fg-subtle">
          Moderate product reviews — approve, reject, or delete.
        </Text>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(["all", ...REVIEW_STATUSES] as TabValue[]).map((t) => (
            <Button
              key={t}
              type="button"
              size="small"
              variant={tab === t ? "primary" : "transparent"}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>
        <Input
          size="small"
          placeholder="Filter by product ID"
          value={productIdFilter}
          onChange={(e) => setProductIdFilter(e.target.value)}
          className="max-w-xs"
        />
        {tab === "pending" && pendingCount > 0 ? (
          <Button
            type="button"
            size="small"
            disabled={busy}
            isLoading={bulkApproveMutation.isPending}
            onClick={() => bulkApproveMutation.mutate()}
          >
            Approve all pending ({pendingCount})
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="rounded-md border border-ui-border-base p-8 text-center">
            <Text size="small" className="text-ui-fg-muted">Loading reviews...</Text>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-md border border-dashed border-ui-border-base p-8 text-center">
            <Text size="small" className="text-ui-fg-muted">No reviews found.</Text>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              disabled={busy}
              onStatusChange={(id, status) => updateMutation.mutate({ id, status })}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Reviews",
  rank: 60,
  icon: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
})
