"use client";

import { useParams as useNextParams, usePathname, useRouter, useSearchParams as useNextSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useRouterContext } from "./router-context";

/** Used by `web/src/seo/routeMeta.ts` via `react-router-dom` import map. */
export { matchPath } from "react-router";

function pathIsActive(linkTo: string, pathname: string, end: boolean): boolean {
  const p = pathname.split("?")[0] || "/";
  const t = linkTo.split("?")[0] || "/";
  const norm = (s: string) => (s !== "/" && s.endsWith("/") ? s.slice(0, -1) : s);
  const pn = norm(p);
  const tn = norm(t);
  if (tn === "/") return pn === "/";
  if (end) return pn === tn;
  return pn === tn || pn.startsWith(`${tn}/`);
}

type NavLinkClass = string | ((args: { isActive: boolean }) => string);

export function NavLink({
  to,
  end,
  className,
  children,
  ...rest
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className"> & {
  to: string;
  end?: boolean;
  className?: NavLinkClass;
}) {
  const pathname = usePathname() ?? "/";
  const isActive = pathIsActive(to, pathname, Boolean(end));
  const cn = className as NavLinkClass | undefined;
  const resolvedClass = typeof cn === "function" ? cn({ isActive }) : cn;
  return (
    <a href={to} className={resolvedClass} {...rest}>
      {children}
    </a>
  );
}

type ToValue = string;

export function Link({
  to,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: ToValue }) {
  return (
    <a href={to} {...props}>
      {children}
    </a>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (to: string | number) => {
    if (typeof to === "number") {
      if (to < 0) router.back();
      return;
    }
    router.push(to);
  };
}

export function useParams<T extends Record<string, string | undefined>>() {
  const nextParams = useNextParams();
  const ctx = useRouterContext();
  return { ...(nextParams as Record<string, string>), ...ctx.params } as T;
}

export function useSearchParams() {
  const nextParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = useCallback(
    (
      next:
        | URLSearchParams
        | string
        | Record<string, string>
        | ((prev: URLSearchParams) => URLSearchParams | string | Record<string, string>),
      _options?: { replace?: boolean; state?: unknown },
    ) => {
      const resolved = typeof next === "function" ? next(new URLSearchParams(nextParams.toString())) : next;
      const params =
        resolved instanceof URLSearchParams
          ? resolved
          : typeof resolved === "string"
            ? new URLSearchParams(resolved)
            : new URLSearchParams(Object.entries(resolved));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router],
  );

  return [new URLSearchParams(nextParams.toString()), setSearchParams] as const;
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  return {
    pathname,
    search: searchParams.toString() ? `?${searchParams.toString()}` : "",
    hash: "",
  };
}

export function Navigate({ to }: { to: string }) {
  const router = useRouter();
  router.replace(to);
  return null;
}

export function BrowserRouter({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Routes({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function Route() {
  return null;
}

export { usePathname };
