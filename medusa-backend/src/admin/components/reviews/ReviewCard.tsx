import { Badge, Button, Text } from "@medusajs/ui"

import { ReviewStatusBadge } from "./ReviewStatusBadge"
import type { AdminReview, ReviewStatus } from "../../../lib/reviews/types"

type ReviewCardProps = {
  review: AdminReview
  disabled?: boolean
  onStatusChange: (id: string, status: ReviewStatus) => void
  onDelete: (id: string) => void
}

function ratingStars(rating: number) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)))
  return "★".repeat(filled) + "☆".repeat(5 - filled)
}

export function ReviewCard({ review, disabled, onStatusChange, onDelete }: ReviewCardProps) {
  return (
    <div className="rounded-md border border-ui-border-base p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <Text size="small" weight="plus">
            {review.productTitle || review.productId}
          </Text>
          <Text size="xsmall" className="font-mono text-ui-fg-muted">
            {review.productId}
          </Text>
        </div>
        <ReviewStatusBadge status={review.status} />
      </div>

      <div className="mb-2">
        <Text size="small" className="text-ui-fg-subtle">
          <span className="text-orange-500">{ratingStars(review.rating)}</span>
          <span className="ml-2 text-ui-fg-muted">{review.rating}/5</span>
        </Text>
      </div>

      {review.body ? (
        <div className="mb-3">
          <Text size="small" className="text-ui-fg-base">{review.body}</Text>
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-2">
        <Badge size="small" color="grey">{review.locale}</Badge>
        <Badge size="small" color="grey">{review.ugcType.replace(/_/g, " ")}</Badge>
        <Badge size="small" color={review.permissionToRepost ? "green" : "orange"}>
          {review.permissionToRepost ? "repost permitted" : "no repost permission"}
        </Badge>
        <Badge size="small" color="grey">{review.source.replace(/_/g, " ")}</Badge>
        {review.customerId ? (
          <Badge size="small" color="grey">customer</Badge>
        ) : null}
        {review.createdAt ? (
          <Text size="xsmall" className="text-ui-fg-muted">
            {new Date(review.createdAt).toLocaleDateString()}
          </Text>
        ) : null}
      </div>

      <div className="mb-3 space-y-1">
        {review.photoUrl ? (
          <Text size="xsmall" className="text-ui-fg-muted">
            Photo: <a href={review.photoUrl} target="_blank" rel="noreferrer" className="underline">{review.photoUrl}</a>
          </Text>
        ) : null}
        {review.videoUrl ? (
          <Text size="xsmall" className="text-ui-fg-muted">
            Video: <a href={review.videoUrl} target="_blank" rel="noreferrer" className="underline">{review.videoUrl}</a>
          </Text>
        ) : null}
        {review.instagramHandle ? (
          <Text size="xsmall" className="text-ui-fg-muted">Instagram: {review.instagramHandle}</Text>
        ) : null}
        {review.fitFeedback ? (
          <Text size="xsmall" className="text-ui-fg-muted">Fit: {review.fitFeedback}</Text>
        ) : null}
        {review.giftFeedback ? (
          <Text size="xsmall" className="text-ui-fg-muted">Gift: {review.giftFeedback}</Text>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {review.status !== "approved" ? (
          <Button
            type="button"
            size="small"
            variant="transparent"
            disabled={disabled}
            onClick={() => onStatusChange(review.id, "approved")}
          >
            Approve
          </Button>
        ) : null}
        {review.status !== "rejected" ? (
          <Button
            type="button"
            size="small"
            variant="transparent"
            disabled={disabled}
            onClick={() => onStatusChange(review.id, "rejected")}
          >
            Reject
          </Button>
        ) : null}
        <Button
          type="button"
          size="small"
          variant="danger"
          disabled={disabled}
          onClick={() => {
            if (window.confirm("Delete this review permanently?")) {
              onDelete(review.id)
            }
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  )
}
