import { useEffect, useState } from 'react';

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function calcParts(targetMs: number): CountdownParts {
  const diff = targetMs - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, expired: false };
}

/**
 * SSR-safe countdown hook. Returns null on the server and during hydration;
 * updates every second on the client via useEffect.
 */
export function useCountdown(isoDeadline: string | null | undefined): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    if (!isoDeadline) return;
    const targetMs = Date.parse(isoDeadline);
    if (!Number.isFinite(targetMs)) return;

    setParts(calcParts(targetMs));

    const id = setInterval(() => {
      const next = calcParts(targetMs);
      setParts(next);
      if (next.expired) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [isoDeadline]);

  return parts;
}
