import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { HoroOpsDashboardClient } from "./horo-ops-dashboard-client";
import { HoroOpsToastProvider } from "./horo-ops-toast";
import { HORO_OPS_SESSION_COOKIE } from "@/lib/horo-ops-constants";
import { verifyHoroOpsSessionValue } from "@/lib/horo-ops-session";

export const dynamic = "force-dynamic";

export default async function HoroOpsPage() {
  const jar = await cookies();
  const token = jar.get(HORO_OPS_SESSION_COOKIE)?.value;
  if (!verifyHoroOpsSessionValue(token)) {
    redirect("/internal/horo-ops/login");
  }

  return (
    <HoroOpsToastProvider>
      <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-16 text-center text-neutral-600 dark:text-neutral-400">Loading…</div>}>
        <HoroOpsDashboardClient />
      </Suspense>
    </HoroOpsToastProvider>
  );
}
