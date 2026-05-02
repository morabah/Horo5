"use client";

import NextLink from "next/link";
import { useParams as useNextParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useRouterContext } from "./router-context";

export function matchPath(pattern: { path: string; end?: boolean }, pathname: string) {
  const paramNames: string[] = [];
  let regexStr = pattern.path.replace(/:([^\/]+)/g, (_, paramName) => {
    paramNames.push(paramName);
    return '([^/]+)';
  });
  if (pattern.end) {
    regexStr = `^${regexStr}$`;
  } else {
    regexStr = `^${regexStr}`;
  }
  const match = pathname.match(new RegExp(regexStr));
  if (!match) return null;
  const params: Record<string, string> = {};
  paramNames.forEach((name, i) => {
    params[name] = match[i + 1];
  });
  return { params };
}

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
    <NextLink href={to} className={resolvedClass} {...rest}>
      {children}
    </NextLink>
  );
}

type ToValue = string;

export function Link({
  to,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: ToValue }) {
  return (
    <NextLink href={to} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to: string | number) => {
      if (typeof to === "number") {
        if (to < 0) router.back();
        return;
      }
      router.push(to);
    },
    [router],
  );
}

export function useParams<T extends Record<string, string | undefined>>() {
  const nextParams = useNextParams();
  const ctx = useRouterContext();
  return { ...(nextParams as Record<string, string>), ...ctx.params } as T;
}

type SetSearchParamsNavigateOpts = {
  replace?: boolean;
  state?: unknown;
};

const SEARCH_PARAMS_CHANGE_EVENT = "horo-searchparams-change";

function getSearchSnapshot() {
  if (typeof window === "undefined") return "";
  return window.location.search;
}

export function useSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("popstate", onStoreChange);
      window.addEventListener(SEARCH_PARAMS_CHANGE_EVENT, onStoreChange);
      return () => {
        window.removeEventListener("popstate", onStoreChange);
        window.removeEventListener(SEARCH_PARAMS_CHANGE_EVENT, onStoreChange);
      };
    },
    getSearchSnapshot,
    () => "",
  );

  const setSearchParams = useCallback(
    (
      next:
        | URLSearchParams
        | string
        | Record<string, string>
        | ((prev: URLSearchParams) => URLSearchParams | string | Record<string, string>),
      navigateOpts?: SetSearchParamsNavigateOpts,
    ) => {
      const resolved = typeof next === "function" ? next(new URLSearchParams(search)) : next;
      const params =
        resolved instanceof URLSearchParams
          ? resolved
          : typeof resolved === "string"
            ? new URLSearchParams(resolved)
            : new URLSearchParams(Object.entries(resolved));
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (navigateOpts?.replace === true) {
        router.replace(url);
      } else {
        router.push(url);
      }
      window.setTimeout(() => {
        window.dispatchEvent(new Event(SEARCH_PARAMS_CHANGE_EVENT));
      }, 0);
    },
    [pathname, router, search],
  );

  return [new URLSearchParams(search), setSearchParams] as const;
}

export function useLocation() {
  const pathname = usePathname();
  const search = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("popstate", onStoreChange);
      return () => window.removeEventListener("popstate", onStoreChange);
    },
    () => window.location.search,
    () => "",
  );

  return {
    pathname,
    search,
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

export { usePathname };
