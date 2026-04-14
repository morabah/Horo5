import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

const RenderTimeContext = createContext<Date | null>(null);

function parseRenderedAt(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function RenderTimeProvider({
  children,
  renderedAt,
}: PropsWithChildren<{ renderedAt?: string | null }>) {
  const renderTime = useMemo(() => parseRenderedAt(renderedAt) ?? new Date(), [renderedAt]);

  return <RenderTimeContext.Provider value={renderTime}>{children}</RenderTimeContext.Provider>;
}

export function useRenderTime(): Date {
  return useContext(RenderTimeContext) ?? new Date();
}

/**
 * Keep SSR and the first client paint aligned, then refresh to the actual client time after mount.
 */
export function useStableNow(): Date {
  const renderTime = useRenderTime();
  const [now, setNow] = useState(renderTime);

  useEffect(() => {
    setNow(new Date());
  }, []);

  return now;
}
