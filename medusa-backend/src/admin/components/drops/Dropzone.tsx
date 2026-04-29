import { ArrowUpTray, Link, Photo } from "@medusajs/icons"
import { Button, Input, Text } from "@medusajs/ui"
import { useRef, useState } from "react"

import { uploadDropFiles, uploadDropUrl } from "./api"
import type { DropImage } from "./types"
import { tagForFilename } from "./utils"

type DropzoneProps = {
  busy?: boolean
  existingCount?: number
  onUploaded: (images: DropImage[]) => void
  onError: (message: string) => void
}

function filesToImages(files: Array<{ url: string; filename: string }>, offset: number): DropImage[] {
  return files.map((file, index) => ({
    url: file.url,
    filename: file.filename,
    tag: tagForFilename(file.filename) || (offset === 0 && index === 0 ? "main" : "lifestyle"),
    order: offset + index,
  }))
}

export function Dropzone({ busy, existingCount = 0, onUploaded, onError }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [url, setUrl] = useState("")
  const [uploading, setUploading] = useState(false)

  const upload = async (files: File[]) => {
    if (!files.length) return
    setUploading(true)
    try {
      const result = await uploadDropFiles(files)
      onUploaded(filesToImages(result.files, existingCount))
    } catch (error) {
      onError(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const uploadUrl = async () => {
    if (!url.trim()) return
    setUploading(true)
    try {
      const result = await uploadDropUrl(url.trim())
      onUploaded(filesToImages(result.files, existingCount))
      setUrl("")
    } catch (error) {
      onError(error instanceof Error ? error.message : "URL upload failed")
    } finally {
      setUploading(false)
    }
  }

  const disabled = busy || uploading

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center ${
          dragging ? "border-ui-border-interactive bg-ui-bg-interactive/10" : "border-ui-border-base bg-ui-bg-subtle"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          upload(Array.from(event.dataTransfer.files))
        }}
        onPaste={(event) => {
          const files = Array.from(event.clipboardData.files)
          if (files.length) upload(files)
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click()
        }}
      >
        <Photo className="text-ui-fg-muted" />
        <div>
          <Text size="small" weight="plus">
            Drop images
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted">
            JPG, PNG, WebP, SVG
          </Text>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            size="small"
            variant="secondary"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation()
              inputRef.current?.click()
            }}
          >
            <ArrowUpTray />
            Files
          </Button>
          <Button
            type="button"
            size="small"
            variant="secondary"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation()
              folderInputRef.current?.click()
            }}
          >
            Folder
          </Button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(event) => upload(Array.from(event.target.files ?? []))}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
        onChange={(event) => upload(Array.from(event.target.files ?? []))}
      />
      <div className="flex gap-2">
        <Input
          size="small"
          value={url}
          disabled={disabled}
          placeholder="https://..."
          onChange={(event) => setUrl(event.target.value)}
        />
        <Button type="button" size="small" variant="secondary" disabled={disabled || !url.trim()} onClick={uploadUrl}>
          <Link />
          Fetch
        </Button>
      </div>
    </div>
  )
}
