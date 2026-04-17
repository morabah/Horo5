import { QUICK_VIEW_SCHEMA } from '../data/domain-config';

type QuickViewVisibilityMode = 'desktop-hover' | 'mobile-inline' | 'plp-bar';

type QuickViewTriggerProps = {
  productName: string;
  onClick: () => void;
  className?: string;

  visibilityMode?: QuickViewVisibilityMode;
};

export function QuickViewTrigger({
  productName,
  onClick,
  className = '',

  visibilityMode = 'desktop-hover',
}: QuickViewTriggerProps) {
  const triggerClassName = (() => {
    const base = [
      'font-label',
      'uppercase',
      'transition-all duration-300 ease-out',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal',
    ];

    if (visibilityMode === 'mobile-inline') {
      return [
        ...base,
        'relative inline-flex items-center text-[10px] tracking-[0.18em] font-medium text-obsidian underline decoration-stone/50 hover:decoration-obsidian w-fit md:hidden mt-1',
        className,
      ]
        .filter(Boolean)
        .join(' ');
    }

    if (visibilityMode === 'plp-bar') {
      /** In-flow control for PLP cards: same chrome as Sizes / Quick add — no overlap with siblings. */
      return [
        ...base,
        'inline-flex shrink-0 min-h-11 items-center justify-center rounded-full border border-stone/55 bg-white/95 px-3 text-[10px] font-medium tracking-[0.16em] text-obsidian shadow-sm backdrop-blur-sm hover:border-obsidian hover:bg-white',
        className,
      ]
        .filter(Boolean)
        .join(' ');
    }

    /** desktop-hover — absolute overlay; used by cross-sell / PDP related rows when not using plp-bar */
    return [
      ...base,
      'absolute z-10 hidden items-center justify-center bottom-3 left-3 text-[10px] tracking-[0.18em] font-medium text-obsidian bg-transparent border-b border-transparent hover:border-obsidian md:inline-flex opacity-0 group-hover:opacity-100',
      className,
    ]
      .filter(Boolean)
      .join(' ');
  })();

  return (
    <button
      type="button"
      className={triggerClassName}
      onClick={onClick}
      aria-label={QUICK_VIEW_SCHEMA.copy.openAriaTemplate.replace('{name}', productName)}
    >
      + {QUICK_VIEW_SCHEMA.copy.openCta}
    </button>
  );
}
