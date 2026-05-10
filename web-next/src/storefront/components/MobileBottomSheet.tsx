'use client';

import { useEffect } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';

export type MobileBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function MobileBottomSheet({ open, onClose, title, children }: MobileBottomSheetProps) {
  const ref = useFocusTrap(open);

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-obsidian/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={ref}
        className="w-full max-w-lg self-center rounded-t-[1.25rem] bg-white p-5 shadow-2xl motion-safe:animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-headline text-lg font-semibold text-obsidian">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-warm-charcoal transition-colors hover:bg-stone/10"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
