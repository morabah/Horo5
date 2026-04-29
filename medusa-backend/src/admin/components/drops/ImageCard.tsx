import { ArrowDownMini, ArrowUpMini, BarsThree, Trash } from "@medusajs/icons"
import { IconButton, Select, Text } from "@medusajs/ui"

import type { DropImage, DropImageTag } from "./types"

const tagOptions: Array<{ value: DropImageTag; label: string }> = [
  { value: "main", label: "Main" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "flat_lay", label: "Flat lay" },
  { value: "proof_fabric", label: "Proof fabric" },
  { value: "proof_print", label: "Proof print" },
  { value: "proof_wash", label: "Proof wash" },
]

type ImageCardProps = {
  image: DropImage
  index: number
  canMoveUp: boolean
  canMoveDown: boolean
  onChange: (image: DropImage) => void
  onMove: (direction: -1 | 1) => void
  onDelete: () => void
  onDragStart?: () => void
  onDragEnd?: () => void
  onDropOn?: () => void
}

export function ImageCard({
  image,
  index,
  canMoveUp,
  canMoveDown,
  onChange,
  onMove,
  onDelete,
  onDragStart,
  onDragEnd,
  onDropOn,
}: ImageCardProps) {
  return (
    <div
      className="overflow-hidden rounded-md border border-ui-border-base bg-ui-bg-base"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        onDropOn?.()
      }}
    >
      <div className="aspect-[4/3] bg-ui-bg-subtle">
        <img src={image.url} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-start gap-2">
          <BarsThree className="mt-0.5 shrink-0 text-ui-fg-muted" />
          <div className="min-w-0 flex-1">
            <Text size="small" weight="plus" className="truncate">
              {image.filename || `Image ${index + 1}`}
            </Text>
            <Text size="xsmall" className="truncate text-ui-fg-muted">
              {image.url}
            </Text>
          </div>
        </div>
        <Select
          size="small"
          value={image.tag || "lifestyle"}
          onValueChange={(tag) => onChange({ ...image, tag: tag as DropImageTag })}
        >
          <Select.Trigger>
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            {tagOptions.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <div className="flex justify-between">
          <div className="flex gap-1">
            <IconButton
              type="button"
              size="small"
              variant="transparent"
              disabled={!canMoveUp}
              aria-label="Move image up"
              onClick={() => onMove(-1)}
            >
              <ArrowUpMini />
            </IconButton>
            <IconButton
              type="button"
              size="small"
              variant="transparent"
              disabled={!canMoveDown}
              aria-label="Move image down"
              onClick={() => onMove(1)}
            >
              <ArrowDownMini />
            </IconButton>
          </div>
          <IconButton
            type="button"
            size="small"
            variant="transparent"
            aria-label="Delete image"
            onClick={onDelete}
          >
            <Trash />
          </IconButton>
        </div>
      </div>
    </div>
  )
}
