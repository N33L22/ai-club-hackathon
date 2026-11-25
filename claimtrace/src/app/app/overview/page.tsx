import { OverviewView } from "@/components/overview/overview-view";

// The workspace reads data stored in this browser, so it renders after hydration
// and navigation into it is allowed to wait for that (see app/app/layout.tsx).
export const instant = false;

export default function OverviewPage() {
  return <OverviewView />;
}
