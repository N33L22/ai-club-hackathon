/** Derives the trust label shown on a reference or a claim. */
import type { TrustLabel } from "../labels";
import type { ClaimCheck, ClaimVerdict, SourceVerification } from "../types";

export function sourceLabel(v: SourceVerification | undefined): TrustLabel {
  if (!v) return "pending";
  switch (v.status) {
    case "verified":
      return "verified";
    case "close_match":
      return v.confirmedByStudent ? "verified" : "close_match";
    case "not_found":
      return v.mismatch ? "mismatch" : "not_found";
    case "retracted":
      return "retracted";
    case "student_added":
      return "student_added";
    case "unavailable":
      return "unavailable";
    default:
      return "pending";
  }
}

const VERDICT_SEVERITY: Record<ClaimVerdict, number> = { not_supported: 3, overreach: 2, unchecked: 1, supported: 0 };

/**
 * The most severe verdict across all sources cited by the claim. A claim that
 * cites two sources is only as strong as its weakest link: if one source
 * supports it and the other does not, the claim shows "Not supported".
 */
export function worstVerdict(checks: Array<ClaimCheck | undefined>): ClaimVerdict | undefined {
  if (!checks.length || checks.some((c) => !c)) return undefined;
  return (checks as ClaimCheck[]).map((c) => c.verdict).sort((a, b) => VERDICT_SEVERITY[b] - VERDICT_SEVERITY[a])[0];
}

/**
 * Precedence: a problem with the reference itself outranks what the text says.
 * not found > retracted > pending > close match > not supported > overreach
 * > couldn't check > student-added > unchecked > supported (your text) > supported.
 */
export function claimLabel(
  sources: Array<{ verification?: SourceVerification } | undefined>,
  checks: Array<ClaimCheck | undefined>,
): TrustLabel {
  if (!sources.length || sources.some((s) => !s)) return "not_found";
  const labels = sources.map((s) => sourceLabel(s!.verification));
  if (labels.includes("not_found")) return "not_found";
  if (labels.includes("mismatch")) return "mismatch";
  if (labels.includes("retracted")) return "retracted";
  if (labels.includes("pending")) return "pending";
  if (labels.includes("close_match")) return "close_match";
  const verdict = worstVerdict(checks);
  if (!verdict) return "pending";
  if (verdict === "not_supported") return "not_supported";
  if (verdict === "overreach") return "overreach";
  if (labels.includes("unavailable")) return "unavailable";
  if (labels.includes("student_added")) return "student_added";
  if (verdict === "unchecked") return "unchecked";
  // every cited source supports the claim: say so differently when the evidence is text the student pasted
  if (checks.some((c) => c?.textOrigin === "student_text")) return "supported_own_text";
  return "supported";
}
