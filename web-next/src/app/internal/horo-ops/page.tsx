import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { HoroOpsDashboardClient } from "./horo-ops-dashboard-client";
import { HORO_OPS_SESSION_COOKIE } from "@/lib/horo-ops-constants";
import { verifyHoroOpsSessionValue } from "@/lib/horo-ops-session";

export const dynamic = "force-dynamic";

export default async function HoroOpsPage() {
  const jar = await cookies();
  const token = jar.get(HORO_OPS_SESSION_COOKIE)?.value;
  if (!verifyHoroOpsSessionValue(token)) {
    redirect("/internal/horo-ops/login");
  }

  return <HoroOpsDashboardClient />;
}
