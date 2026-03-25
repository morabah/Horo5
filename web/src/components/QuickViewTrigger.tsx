import { QUICK_VIEW_SCHEMA } from '../data/domain-config';

type QuickViewTriggerProps = {
  productName: string;
  onClick: () => void;
  className?: string;
  compact?: boolean;
};

export function QuickViewTrigger({
  productName,
  onClick,
  className = '',
  compact = false,
}: QuickViewTriggerProps) {
  const triggerClassName = [
    'quick-view-pill',
    'quick-view-pill--hover',
    compact ? 'quick-view-pill--compact' : '',
    'font-label',
    'absolute',
    'z-10',
    'hidden',
    'items-center',
    'justify-center',
    'rounded-full',
    'text-center',
    'font-medium',
    'uppercase',
    'text-obsidian',
    'transition-shadow',
    'hover:shadow-lg',
    'focus-visible:outline-2',
    'focus-visible:outline-offset-2',
    'focus-visible:outline-deep-teal',
    'md:inline-flex',
    compact ? 'min-h-11 px-4 py-3 text-[11px] tracking-[0.2em]' : 'min-h-12 px-4 py-3 text-xs tracking-[0.2em]',
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
      {QUICK_VIEW_SCHEMA.copy.openCta}
    </button>
  );
}
