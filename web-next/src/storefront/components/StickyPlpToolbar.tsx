import type { ReactNode } from 'react';

type StickyPlpToolbarProps = {
  shortcuts?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

const STICKY_TOP =
  'top-[calc(var(--horo-chrome-top,3.6rem)+env(safe-area-inset-top,0px))]';

export function StickyPlpToolbar({ shortcuts, actions, className = '' }: StickyPlpToolbarProps) {
  return (
    <div
      className={`sticky z-20 mb-6 border-b border-stone/30 bg-papyrus/95 pb-3 pt-2 backdrop-blur-sm ${STICKY_TOP} ${className}`.trim()}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {shortcuts ? <div className="min-w-0 flex-1">{shortcuts}</div> : null}
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}

export const PLP_SCROLL_MARGIN =
  'scroll-mt-[calc(var(--horo-chrome-top,3.6rem)+env(safe-area-inset-top,0px))]';
