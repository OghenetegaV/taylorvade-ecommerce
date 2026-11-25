// src/app/launch/page.tsx
// Pre-launch holding page. While the site is private (src/lib/launch.ts) every
// store page redirects here; after launch src/proxy.ts sends /launch to "/".

import type { Metadata } from "next";
import LaunchSignup from "./LaunchSignup";
import { launchLabel } from "@/lib/launch";

export const metadata: Metadata = {
  title: "Something Worth Waiting For",
  description: "Taylor Vade launches 11 December. Join the early access list for 30% off your first order.",
};

export default function LaunchPage() {
  return <LaunchSignup launchLabel={launchLabel()} />;
}
