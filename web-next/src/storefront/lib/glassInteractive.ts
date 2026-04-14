/**
 * Shared frosted-glass interaction pattern: readable dark copy at rest, palette on hover.
 * Parent interactive element must include `group` (Link or article with overlay link).
 */
export const glassInteractive = {
  /** Bottom-heavy shadow — vibe photo cards */
  surfaceBottom:
    'transition-[box-shadow,border-color] duration-300 ease-out group-hover:border-deep-teal/35 group-hover:shadow-[0_-12px_40px_rgba(43,117,150,0.12)]',
  /** Card / row — search, occasions, product tiles */
  surfaceCard:
    'transition-[box-shadow,border-color] duration-300 ease-out group-hover:border-deep-teal/35 group-hover:shadow-[0_8px_32px_rgba(43,117,150,0.12)]',
  title: 'text-obsidian transition-colors duration-300 ease-out group-hover:text-deep-teal',
  body: 'text-warm-charcoal transition-colors duration-300 ease-out group-hover:text-deep-teal',
  cta: 'text-obsidian transition-colors duration-300 ease-out group-hover:text-primary',
  accentDot:
    'ring-2 ring-obsidian/15 transition-[box-shadow,ring-color] duration-300 ease-out group-hover:ring-deep-teal/50',
  /** Featured thumb on hero — dark frosted badge */
  surfaceDark:
    'transition-[box-shadow,border-color,ring-color] duration-300 ease-out group-hover:border-deep-teal/40 group-hover:ring-deep-teal/35 group-hover:shadow-[0_8px_32px_rgba(43,117,150,0.12)]',
  labelOnDark:
    'text-frost-blue transition-colors duration-300 ease-out group-hover:text-primary',
} as const;
