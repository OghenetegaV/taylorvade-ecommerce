// src/lib/launch.ts
// Pre-launch switch. Until LAUNCH_AT the public site is private: every store
// page redirects to /launch (see src/proxy.ts). From LAUNCH_AT onwards the
// redirect stops by itself, /launch forwards to the homepage, and the site
// runs normally — no deploy needed on launch day.
//
// Default: 11 December 2026, 00:00 Lagos time (WAT, UTC+1).
// LAUNCH_AT can be overridden with an ISO date in the env var of the same
// name (e.g. to move the date, or to test the post-launch site locally).

const DEFAULT_LAUNCH_AT = "2026-12-11T00:00:00+01:00";

export function getLaunchAt(): Date {
  const fromEnv = process.env.LAUNCH_AT ? new Date(process.env.LAUNCH_AT) : null;
  return fromEnv && !Number.isNaN(fromEnv.getTime()) ? fromEnv : new Date(DEFAULT_LAUNCH_AT);
}

export function isPreLaunch(now: number = Date.now()): boolean {
  return now < getLaunchAt().getTime();
}

/** e.g. "11 December" — shown on the launch page. */
export function launchLabel(): string {
  return getLaunchAt().toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "Africa/Lagos" });
}
