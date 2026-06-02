export const HOMEPAGE_LAYOUTS = [
  "image_overlay",
  "split",
  "rail",
  "tiles",
  "compact",
] as const

export type HomepageLayout = (typeof HOMEPAGE_LAYOUTS)[number]

export const HOMEPAGE_TEXT_PLACEMENTS = [
  "bottom-left",
  "bottom-center",
  "center",
  "below",
] as const

export type HomepageTextPlacement = (typeof HOMEPAGE_TEXT_PLACEMENTS)[number]

export const HOMEPAGE_MAX_TEXT_WIDTHS = ["sm", "md", "lg"] as const

export type HomepageMaxTextWidth = (typeof HOMEPAGE_MAX_TEXT_WIDTHS)[number]

export const HOMEPAGE_MOBILE_TEXT_MODES = ["overlay", "below"] as const

export type HomepageMobileTextMode = (typeof HOMEPAGE_MOBILE_TEXT_MODES)[number]

export type HomepagePresentation = {
  layout?: HomepageLayout
  textPlacement?: HomepageTextPlacement
  overlayOpacity?: number
  maxTextWidth?: HomepageMaxTextWidth
  showBody?: boolean
  showEyebrow?: boolean
  showPillars?: boolean
  mobileTextMode?: HomepageMobileTextMode
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0.35
  return Math.min(1, Math.max(0, value))
}

function parseLayout(value: unknown): HomepageLayout | undefined {
  if (typeof value !== "string") return undefined
  return (HOMEPAGE_LAYOUTS as readonly string[]).includes(value)
    ? (value as HomepageLayout)
    : undefined
}

function parseTextPlacement(value: unknown): HomepageTextPlacement | undefined {
  if (typeof value !== "string") return undefined
  return (HOMEPAGE_TEXT_PLACEMENTS as readonly string[]).includes(value)
    ? (value as HomepageTextPlacement)
    : undefined
}

function parseMaxTextWidth(value: unknown): HomepageMaxTextWidth | undefined {
  if (typeof value !== "string") return undefined
  return (HOMEPAGE_MAX_TEXT_WIDTHS as readonly string[]).includes(value)
    ? (value as HomepageMaxTextWidth)
    : undefined
}

function parseMobileTextMode(value: unknown): HomepageMobileTextMode | undefined {
  if (typeof value !== "string") return undefined
  return (HOMEPAGE_MOBILE_TEXT_MODES as readonly string[]).includes(value)
    ? (value as HomepageMobileTextMode)
    : undefined
}

function parsePresentationObject(raw: unknown): HomepagePresentation | null {
  if (!isRecord(raw)) return null
  const layout = parseLayout(raw.layout)
  const textPlacement = parseTextPlacement(raw.textPlacement)
  const maxTextWidth = parseMaxTextWidth(raw.maxTextWidth)
  const mobileTextMode = parseMobileTextMode(raw.mobileTextMode)
  const overlayOpacity =
    typeof raw.overlayOpacity === "number" ? clamp01(raw.overlayOpacity) : undefined

  const presentation: HomepagePresentation = {}
  if (layout) presentation.layout = layout
  if (textPlacement) presentation.textPlacement = textPlacement
  if (overlayOpacity !== undefined) presentation.overlayOpacity = overlayOpacity
  if (maxTextWidth) presentation.maxTextWidth = maxTextWidth
  if (typeof raw.showBody === "boolean") presentation.showBody = raw.showBody
  if (typeof raw.showEyebrow === "boolean") presentation.showEyebrow = raw.showEyebrow
  if (typeof raw.showPillars === "boolean") presentation.showPillars = raw.showPillars
  if (mobileTextMode) presentation.mobileTextMode = mobileTextMode

  return Object.keys(presentation).length > 0 ? presentation : null
}

/** Legacy hero payload.layout === "editorial" maps to image_overlay. */
export function parseHomepagePresentation(
  payload: Record<string, unknown> | null | undefined,
): HomepagePresentation {
  const base = parsePresentationObject(payload?.presentation) ?? {}
  const legacyLayout = typeof payload?.layout === "string" ? payload.layout.trim() : ""
  if (!base.layout && legacyLayout === "editorial") {
    base.layout = "image_overlay"
  }
  if (!base.layout && legacyLayout === "split") {
    base.layout = "split"
  }
  return base
}

export function mergePresentationIntoPayload(
  payload: Record<string, unknown> | null | undefined,
  presentation: HomepagePresentation,
): Record<string, unknown> {
  const next = { ...(payload ?? {}) }
  next.presentation = presentation
  return next
}

export const DEFAULT_PRESENTATION_BY_SECTION_KEY: Partial<
  Record<string, HomepagePresentation>
> = {
  hero: {
    layout: "split",
    textPlacement: "bottom-left",
    showEyebrow: false,
    showBody: true,
    mobileTextMode: "overlay",
  },
  trust_ribbon: { layout: "compact" },
  founding_drop: {
    layout: "image_overlay",
    textPlacement: "bottom-left",
    showBody: false,
    showEyebrow: true,
    overlayOpacity: 0.45,
    mobileTextMode: "below",
  },
  feeling_grid: {
    layout: "tiles",
    showBody: false,
    showEyebrow: false,
  },
  editorial_feature: {
    layout: "image_overlay",
    textPlacement: "bottom-left",
    showEyebrow: true,
    showBody: true,
    overlayOpacity: 0.5,
    mobileTextMode: "below",
  },
  gift_block: {
    layout: "image_overlay",
    textPlacement: "bottom-left",
    showEyebrow: true,
    showBody: true,
    overlayOpacity: 0.45,
    mobileTextMode: "below",
  },
  why_horo: {
    layout: "image_overlay",
    textPlacement: "bottom-left",
    showBody: false,
    showEyebrow: true,
    showPillars: false,
    overlayOpacity: 0.5,
    mobileTextMode: "below",
  },
}

export function withDefaultPresentation(
  key: string,
  payload: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const defaults = DEFAULT_PRESENTATION_BY_SECTION_KEY[key]
  if (!defaults) return { ...(payload ?? {}) }
  const existing = parsePresentationObject(
    isRecord(payload) ? payload.presentation : undefined,
  )
  return mergePresentationIntoPayload(payload, { ...defaults, ...existing })
}
