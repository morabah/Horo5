import { QUICK_VIEW_SCHEMA } from '../data/domain-config';

type QuickViewTriggerProps = {
  productName: string;
  onClick: () => void;
  className?: string;

  visibilityMode?: 'desktop-hover' | 'mobile-inline';
};

export function QuickViewTrigger({
  productName,
  onClick,
  className = '',

  visibilityMode = 'desktop-hover',
}: QuickViewTriggerProps) {
  const desktopHover = visibilityMode === 'desktop-hover';
  const triggerClassName = [
    'font-label',
    'uppercase',
    'transition-all duration-300 ease-out',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal',
    desktopHover ? 'absolute z-10 hidden items-center justify-center bottom-3 left-3 text-[10px] tracking-[0.18em] font-medium text-obsidian bg-transparent border-b border-transparent hover:border-obsidian md:inline-flex opacity-0 group-hover:opacity-100' : 'relative inline-flex items-center text-[10px] tracking-[0.18em] font-medium text-obsidian underline decoration-stone/50 hover:decoration-obsidian w-fit md:hidden mt-1',
    className,
  ]
    .filter(Boolean)
    .join(' ');

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
