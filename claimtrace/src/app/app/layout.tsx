import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";

export const metadata: Metadata = { title: "Workspace" };

/**
 * The workspace keeps all research data in this browser (privacy by design), so
 * pages render after the saved data has loaded. Each page sets `instant = false`
 * to tell Next.js that navigation into it may wait for that.
 */
export default function WorkspaceLayout({ children }: LayoutProps<"/app">) {
  return <AppShell>{children}</AppShell>;
}
