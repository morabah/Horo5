import type { MedusaContainer } from "@medusajs/framework/types"
import { uploadFilesWorkflow } from "@medusajs/core-flows"

import type { DropUploadFileInput, DropUploadedFile } from "./types"

export function dropMimeType(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".gif")) return "image/gif"
  if (lower.endsWith(".svg")) return "image/svg+xml"
  return "application/octet-stream"
}

export async function uploadDropFiles(
  container: MedusaContainer,
  files: DropUploadFileInput[],
): Promise<DropUploadedFile[]> {
  if (!files.length) {
    return []
  }

  const { result } = await uploadFilesWorkflow(container).run({
    input: {
      files: files.map((file) => ({
        filename: file.filename,
        mimeType: file.mimeType || dropMimeType(file.filename),
        content: file.content,
        access: "public",
      })),
    },
  })

  return result.map((file, index) => ({
    url: file.url,
    filename: files[index]?.filename ?? file.id,
  }))
}
