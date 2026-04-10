"use client";

import { createContext, useContext } from "react";

type RouterContextValue = {
  params: Record<string, string | string[] | undefined>;
};

const RouterContext = createContext<RouterContextValue>({ params: {} });

export function RouterContextProvider({
  children,
  params,
}: {
  children: React.ReactNode;
  params?: Record<string, string | string[] | undefined>;
}) {
  return <RouterContext.Provider value={{ params: params || {} }}>{children}</RouterContext.Provider>;
}

export function useRouterContext() {
  return useContext(RouterContext);
}
