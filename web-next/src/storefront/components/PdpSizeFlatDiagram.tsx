import { useId } from 'react';

import { fillPdpCopyTemplate, type PdpSizeTableRow } from '../data/domain-config';
import {
  maxParsedCmForRow,
  parsePdpSizeTableRowCm,
  relativeDiagramScale,
} from '../utils/pdpSizeMeasurements';

export type PdpSizeFlatDiagramProps = {
  row: PdpSizeTableRow | null;
  /** Shown when `row` is null (no size selected). */
  noSelectionMessage: string;
  sectionTitle: string;
  disclaimer: string;
  /** `{size}`, `{chest}`, `{shoulder}`, `{length}`, `{sleeve}` — used for SVG `aria-label` / `<title>`. */
  diagramAriaTemplate: string;
  className?: string;
};

/**
 * Illustrative tee sketch (back) with four callouts. Uses light **pseudo-3D**: CSS perspective tilt on the
 * whole board plus SVG gradients on the body — not a WebGL mesh (keeps bundle small and SSR simple).
 * chest = garment width at chest; shoulder = shoulder seam to seam; length = center-back length;
 * sleeve = sleeve length (one side). Arrow extents vary slightly with parsed cm; label strings are authoritative.
 */
export function PdpSizeFlatDiagram({
  row,
  noSelectionMessage,
  sectionTitle,
  disclaimer,
  diagramAriaTemplate,
  className = '',
}: PdpSizeFlatDiagramProps) {
  const uid = useId().replace(/:/g, '');

  if (!row) {
    return (
      <p className={`font-body text-[13px] leading-normal text-obsidian/75 ${className}`}>{noSelectionMessage}</p>
    );
  }

  const parsed = parsePdpSizeTableRowCm(row);
  const maxCm = maxParsedCmForRow(parsed);
  const chestS = relativeDiagramScale(parsed.chest, maxCm);
  const shoulderS = relativeDiagramScale(parsed.shoulder, maxCm);
  const lengthS = relativeDiagramScale(parsed.length, maxCm);
  const sleeveS = relativeDiagramScale(parsed.sleeve, maxCm);

  const chestHalfSpan = 78 + chestS * 28;
  const shoulderHalfSpan = 84 + shoulderS * 22;
  const lengthTop = 80 + (1 - lengthS) * 10;
  const lengthBottom = 278 - (1 - lengthS) * 6;
  const sleeveSpan = 54 + sleeveS * 38;

  const ariaLabel = fillPdpCopyTemplate(diagramAriaTemplate, {
    size: row.size,
    chest: row.chest,
    shoulder: row.shoulder,
    length: row.length,
    sleeve: row.sleeve,
  });

  const cx = 218;
  const gradBody = `pdp-tee-body-${uid}`;
  const arrowEnd = `pdp-dim-arrow-${uid}`;
  const arrowStart = `pdp-dim-arrow-start-${uid}`;

  return (
    <figure className={`space-y-2 ${className}`}>
      <p className="font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian/80">
        {sectionTitle}
      </p>
      <div className="rounded-xl border border-stone/50 bg-gradient-to-br from-stone-100 via-stone-100/95 to-stone-200/50 p-3 text-obsidian shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
        {/* Whole diagram as a slightly tilted “technical board” (CSS 3D, not WebGL). */}
        <div className="mx-auto max-w-md [perspective:880px]">
          <div className="origin-center [transform-style:preserve-3d] [transform:rotateX(10deg)_rotateY(-12deg)] will-change-transform">
            <svg
              viewBox="0 0 420 320"
              className="h-auto w-full max-w-md text-obsidian drop-shadow-[0_14px_28px_rgba(26,26,26,0.12)]"
              role="img"
              aria-label={ariaLabel}
            >
          <title>{ariaLabel}</title>

          <defs>
            <linearGradient id={gradBody} x1="60" y1="40" x2="380" y2="300" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.14} />
              <stop offset="45%" stopColor="currentColor" stopOpacity={0.26} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0.07} />
            </linearGradient>
            <marker
              id={arrowEnd}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-current" />
            </marker>
            {/* Same triangle, flipped so marker-start points opposite to line direction */}
            <marker
              id={arrowStart}
              viewBox="0 0 10 10"
              refX="1"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M 10 0 L 0 5 L 10 10 z" className="fill-current" />
            </marker>
          </defs>

          {/* Tee back: shaded fill suggests fold / lighting (2.5D inside SVG). */}
          <path
            fill={`url(#${gradBody})`}
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            aria-hidden
            d="
              M 218 84
              Q 188 66 152 74
              L 112 88
              C 92 96 76 112 70 132
              L 66 148
              L 84 158
              L 108 150
              L 118 172
              L 114 262
              L 132 288
              L 218 296
              L 304 288
              L 322 262
              L 318 172
              L 328 150
              L 352 158
              L 370 148
              L 366 132
              C 360 112 344 96 324 88
              L 284 74
              Q 248 66 218 84
              Z
            "
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.45"
            strokeLinejoin="round"
            aria-hidden
            d="
              M 218 84
              Q 188 66 152 74
              L 112 88
              C 92 96 76 112 70 132
              L 66 148
              L 84 158
              L 108 150
              L 118 172
              L 114 262
              L 132 288
              L 218 296
              L 304 288
              L 322 262
              L 318 172
              L 328 150
              L 352 158
              L 370 148
              L 366 132
              C 360 112 344 96 324 88
              L 284 74
              Q 248 66 218 84
              Z
            "
          />
          {/* Neck opening */}
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            aria-hidden
            d="M 172 86 Q 218 108 264 86"
          />

          {/* Shoulder: seam-to-seam with outward arrows */}
          <line
            x1={cx - shoulderHalfSpan}
            y1={36}
            x2={cx + shoulderHalfSpan}
            y2={36}
            stroke="currentColor"
            strokeWidth="1.15"
            markerStart={`url(#${arrowStart})`}
            markerEnd={`url(#${arrowEnd})`}
            className="opacity-90"
            aria-hidden
          />
          <text x={cx} y={26} textAnchor="middle" className="fill-current font-sans text-[9px] font-semibold">
            {`Shoulder · ${row.shoulder}`}
          </text>

          {/* Chest */}
          <line
            x1={cx - chestHalfSpan}
            y1={172}
            x2={cx + chestHalfSpan}
            y2={172}
            stroke="currentColor"
            strokeWidth="1.15"
            markerStart={`url(#${arrowStart})`}
            markerEnd={`url(#${arrowEnd})`}
            className="opacity-90"
            aria-hidden
          />
          <text x={cx} y={190} textAnchor="middle" className="fill-current font-sans text-[9px] font-semibold">
            {`Chest · ${row.chest}`}
          </text>

          {/* Length: CB (hem to neck) */}
          <line
            x1={52}
            y1={lengthBottom}
            x2={52}
            y2={lengthTop}
            stroke="currentColor"
            strokeWidth="1.15"
            markerStart={`url(#${arrowStart})`}
            markerEnd={`url(#${arrowEnd})`}
            className="opacity-90"
            aria-hidden
          />
          <text x={30} y={lengthTop + 8} textAnchor="start" className="fill-current font-sans text-[8px] font-semibold">
            Length
          </text>
          <text x={30} y={lengthTop + 20} textAnchor="start" className="fill-current font-sans text-[8px] font-semibold">
            {row.length}
          </text>

          {/* Sleeve: armhole to cuff */}
          <line
            x1={328}
            y1={122}
            x2={328 + sleeveSpan}
            y2={122}
            stroke="currentColor"
            strokeWidth="1.15"
            markerStart={`url(#${arrowStart})`}
            markerEnd={`url(#${arrowEnd})`}
            className="opacity-90"
            aria-hidden
          />
          <text
            x={328 + sleeveSpan / 2}
            y={110}
            textAnchor="middle"
            className="fill-current font-sans text-[9px] font-semibold"
          >
            {`Sleeve · ${row.sleeve}`}
          </text>
            </svg>
          </div>
        </div>
        <figcaption className="font-body text-[11px] leading-snug text-obsidian/70">{disclaimer}</figcaption>
      </div>
    </figure>
  );
}
