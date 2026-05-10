/**
 * Server-read only; never call from a browser-dependent initial render path
 * (hydration rule from `web-next/AGENTS.md`).
 */
export type PreLaunchPhase = "tease" | "reveal" | "launch" | "live";

export function getPreLaunchPhase(): PreLaunchPhase {
  const v = process.env.NEXT_PUBLIC_PRELAUNCH_PHASE;
  if (v === "tease" || v === "reveal" || v === "launch" || v === "live") return v;
  return "live";
}

export function getLaunchAt(): Date | null {
  const raw = process.env.NEXT_PUBLIC_LAUNCH_AT?.trim();
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d;
}

export function getDaysToLaunch(launchAt: Date | null): number | null {
  if (!launchAt) return null;
  const now = new Date();
  const diffMs = launchAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}
