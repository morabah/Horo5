import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function useAppSearchParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = useCallback(
    (
      nextInit:
        | URLSearchParams
        | string
        | Record<string, string>
        | ((prev: URLSearchParams) => URLSearchParams | string | Record<string, string>),
      navigateOpts?: { replace?: boolean }
    ) => {
      const current = new URLSearchParams(searchParams?.toString() || '');
      const resolved = typeof nextInit === 'function' ? nextInit(current) : nextInit;
      
      const newParams =
        resolved instanceof URLSearchParams
          ? resolved
          : typeof resolved === 'string'
            ? new URLSearchParams(resolved)
            : new URLSearchParams(Object.entries(resolved));
      
      const qs = newParams.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      
      if (navigateOpts?.replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [pathname, router, searchParams]
  );

  return [new URLSearchParams(searchParams?.toString() || ''), setSearchParams] as const;
}
