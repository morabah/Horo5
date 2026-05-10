'use client';

import { useCountdown } from '../hooks/useCountdown';

export function LaunchCountdownBanner({ launchAt }: { launchAt: string }) {
  const countdown = useCountdown(launchAt);

  if (!countdown || countdown.expired) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="relative z-[200] bg-obsidian text-[#f5f0e6]">
      <div className="mx-auto flex max-w-[1320px] items-center justify-center gap-2 px-4 py-2.5 text-center md:gap-4">
        <span className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-[#f5f0e6]/80 md:text-[11px]">
          Launching in
        </span>
        <div className="flex items-center gap-1.5 font-headline text-sm font-semibold tabular-nums md:text-base">
          {countdown.days > 0 ? (
            <>
              <span>{countdown.days}d</span>
              <span className="text-[#f5f0e6]/40">·</span>
            </>
          ) : null}
          <span>{pad(countdown.hours)}</span>
          <span className="text-[#f5f0e6]/40">:</span>
          <span>{pad(countdown.minutes)}</span>
          <span className="text-[#f5f0e6]/40">:</span>
          <span>{pad(countdown.seconds)}</span>
        </div>
      </div>
    </div>
  );
}
