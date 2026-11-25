import { AuditView } from "@/components/audit/audit-view";

// Workspace data lives in this browser; see app/app/layout.tsx.
export const instant = false;

export default function Page() {
  return <AuditView />;
}
