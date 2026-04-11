import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, AdminProduct } from "@medusajs/types"
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"

type ArtistOption = {
  name: string
  slug: string
}

type FormState = {
  artistSlug: string
  fitLabel: string
  merchandisingBadge: string
  stockNote: string
  story: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function buildFormState(product: AdminProduct): FormState {
  const metadata = asRecord(product.metadata)

  return {
    artistSlug: asString(metadata.artistSlug),
    fitLabel: asString(metadata.fitLabel),
    merchandisingBadge: asString(metadata.merchandisingBadge),
    stockNote: asString(metadata.stockNote),
    story: asString(metadata.story),
  }
}

function mergeEditorialMetadata(product: AdminProduct, form: FormState) {
  const metadata = { ...asRecord(product.metadata) }

  const writeField = (key: keyof FormState, value: string) => {
    const normalized = value.trim()

    if (normalized) {
      metadata[key] = normalized
      return
    }

    delete metadata[key]
  }

  writeField("story", form.story)
  writeField("fitLabel", form.fitLabel)
  writeField("stockNote", form.stockNote)
  writeField("merchandisingBadge", form.merchandisingBadge)

  if (form.artistSlug.trim()) {
    metadata.artistSlug = form.artistSlug.trim()
  } else {
    delete metadata.artistSlug
  }

  return metadata
}

const fieldClassName =
  "w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-2 text-sm text-ui-fg-base outline-none transition-colors focus:border-ui-border-interactive focus:ring-2 focus:ring-ui-border-interactive/20"

const labelClassName = "mb-1.5 block text-sm font-medium text-ui-fg-subtle"

const mutedClassName = "text-sm leading-6 text-ui-fg-subtle"

function ProductContentWidget({ data }: DetailWidgetProps<AdminProduct>) {
  const [artists, setArtists] = useState<ArtistOption[]>([])
  const [form, setForm] = useState<FormState>(() => buildFormState(data))
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(buildFormState(data))
    setNotice(null)
    setError(null)
  }, [data])

  useEffect(() => {
    const controller = new AbortController()

    void (async () => {
      try {
        const response = await fetch("/admin/custom/artists?limit=200", {
          credentials: "include",
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Failed to load artists (${response.status})`)
        }

        const payload = (await response.json()) as { artists?: ArtistOption[] }
        if (!controller.signal.aborted) {
          setArtists((payload.artists || []).sort((left, right) => left.name.localeCompare(right.name)))
        }
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load artists.")
        }
      }
    })()

    return () => controller.abort()
  }, [])

  const dirty = useMemo(() => {
    const initial = buildFormState(data)
    return JSON.stringify(initial) !== JSON.stringify(form)
  }, [data, form])

  const updateField =
    (field: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const nextValue = event.target.value
      setForm((current) => ({ ...current, [field]: nextValue }))
      setNotice(null)
      setError(null)
    }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSaving(true)
    setNotice(null)
    setError(null)

    try {
      const response = await fetch(`/admin/products/${data.id}`, {
        body: JSON.stringify({
          metadata: mergeEditorialMetadata(data, form),
        }),
        credentials: "include",
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      })

      if (!response.ok) {
        const message = await response.text()
        throw new Error(message || `Failed to save editorial content (${response.status})`)
      }

      setNotice("Saved. Storefront cache invalidation will refresh the live content.")
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save editorial content.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-xl border border-ui-border-base bg-ui-bg-base p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-ui-fg-base">HORO Editorial Content</h2>
        <p className={mutedClassName}>
          Manage the PDP story copy and artist attribution here. Product images stay native to Medusa:
          the first uploaded image becomes the storefront hero/card image, and the remaining images become
          the gallery in order.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className={labelClassName} htmlFor="horo-product-artist">
            Artist
          </label>
          <select
            id="horo-product-artist"
            className={fieldClassName}
            value={form.artistSlug}
            onChange={updateField("artistSlug")}
          >
            <option value="">Unassigned</option>
            {artists.map((artist) => (
              <option key={artist.slug} value={artist.slug}>
                {artist.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClassName} htmlFor="horo-product-badge">
            Merchandising badge
          </label>
          <input
            id="horo-product-badge"
            className={fieldClassName}
            type="text"
            value={form.merchandisingBadge}
            onChange={updateField("merchandisingBadge")}
            placeholder="Bestseller, New, Staff Pick..."
          />
        </div>

        <div>
          <label className={labelClassName} htmlFor="horo-product-fit">
            Fit label
          </label>
          <input
            id="horo-product-fit"
            className={fieldClassName}
            type="text"
            value={form.fitLabel}
            onChange={updateField("fitLabel")}
            placeholder="Oversized, Regular..."
          />
        </div>

        <div>
          <label className={labelClassName} htmlFor="horo-product-stock-note">
            Stock note
          </label>
          <input
            id="horo-product-stock-note"
            className={fieldClassName}
            type="text"
            value={form.stockNote}
            onChange={updateField("stockNote")}
            placeholder="Almost gone, restock soon..."
          />
        </div>

        <div>
          <label className={labelClassName} htmlFor="horo-product-story">
            Story
          </label>
          <textarea
            id="horo-product-story"
            className={fieldClassName}
            rows={6}
            value={form.story}
            onChange={updateField("story")}
            placeholder="For the one who..."
          />
        </div>

        {error ? <p className="text-sm text-ui-fg-error">{error}</p> : null}
        {notice ? <p className="text-sm text-ui-fg-interactive">{notice}</p> : null}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-ui-button-neutral px-4 py-2 text-sm font-medium text-ui-button-neutral-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving || !dirty}
          >
            {isSaving ? "Saving..." : "Save editorial content"}
          </button>
          <span className={mutedClassName}>Changes update product metadata only. Price, variants, and images stay native to Medusa.</span>
        </div>
      </form>
    </section>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductContentWidget
