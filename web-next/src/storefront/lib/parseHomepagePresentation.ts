export const HOMEPAGE_LAYOUTS = [
  'image_overlay',
  'split',
  'rail',
  'tiles',
  'compact',
] as const;

export type HomepageLayout = (typeof HOMEPAGE_LAYOUTS)[number];

export const HOMEPAGE_TEXT_PLACEMENTS = [
  'bottom-left',
  'bottom-center',
  'center',
  'below',
] as const;

export type HomepageTextPlacement = (typeof HOMEPAGE_TEXT_PLACEMENTS)[number];

export const HOMEPAGE_MAX_TEXT_WIDTHS = ['sm', 'md', 'lg'] as const;

export type HomepageMaxTextWidth = (typeof HOMEPAGE_MAX_TEXT_WIDTHS)[number];

export const HOMEPAGE_MOBILE_TEXT_MODES = ['overlay', 'below'] as const;

export type HomepageMobileTextMode = (typeof HOMEPAGE_MOBILE_TEXT_MODES)[number];

export type HomepagePresentation = {
  layout?: HomepageLayout;
  textPlacement?: HomepageTextPlacement;
  overlayOpacity?: number;
  maxTextWidth?: HomepageMaxTextWidth;
  showBody?: boolean;
  showEyebrow?: boolean;
  showPillars?: boolean;
  mobileTextMode?: HomepageMobileTextMode;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0.35;
  return Math.min(1, Math.max(0, value));
}

function parsePresentationObject(raw: unknown): HomepagePresentation | null {
  if (!isRecord(raw)) return null;
  const presentation: HomepagePresentation = {};
  const layout = raw.layout;
  if (typeof layout === 'string' && (HOMEPAGE_LAYOUTS as readonly string[]).includes(layout)) {
    presentation.layout = layout as HomepageLayout;
  }
  const textPlacement = raw.textPlacement;
  if (
    typeof textPlacement === 'string' &&
    (HOMEPAGE_TEXT_PLACEMENTS as readonly string[]).includes(textPlacement)
  ) {
    presentation.textPlacement = textPlacement as HomepageTextPlacement;
  }
  if (typeof raw.overlayOpacity === 'number') {
    presentation.overlayOpacity = clamp01(raw.overlayOpacity);
  }
  const maxTextWidth = raw.maxTextWidth;
  if (
    typeof maxTextWidth === 'string' &&
    (HOMEPAGE_MAX_TEXT_WIDTHS as readonly string[]).includes(maxTextWidth)
  ) {
    presentation.maxTextWidth = maxTextWidth as HomepageMaxTextWidth;
  }
  if (typeof raw.showBody === 'boolean') presentation.showBody = raw.showBody;
  if (typeof raw.showEyebrow === 'boolean') presentation.showEyebrow = raw.showEyebrow;
  if (typeof raw.showPillars === 'boolean') presentation.showPillars = raw.showPillars;
  const mobileTextMode = raw.mobileTextMode;
  if (
    typeof mobileTextMode === 'string' &&
    (HOMEPAGE_MOBILE_TEXT_MODES as readonly string[]).includes(mobileTextMode)
  ) {
    presentation.mobileTextMode = mobileTextMode as HomepageMobileTextMode;
  }
  return Object.keys(presentation).length > 0 ? presentation : null;
}

/** Legacy hero payload.layout === "editorial" maps to image_overlay. */
export function parseHomepagePresentation(
  payload: Record<string, unknown> | null | undefined,
): HomepagePresentation {
  const base = parsePresentationObject(isRecord(payload) ? payload.presentation : undefined) ?? {};
  const legacyLayout = typeof payload?.layout === 'string' ? payload.layout.trim() : '';
  if (!base.layout && legacyLayout === 'editorial') {
    base.layout = 'image_overlay';
  }
  if (!base.layout && legacyLayout === 'split') {
    base.layout = 'split';
  }
  return base;
}

export function isImageOverlayPresentation(
  payload: Record<string, unknown> | null | undefined,
): boolean {
  return parseHomepagePresentation(payload).layout === 'image_overlay';
}
