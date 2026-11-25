/**
 * Export gate (checkpoints 2 and 3): export stays locked until every claim is
 * checked, every flag has a decision, and the student signs off.
 */
import { LABELS, type TrustLabel } from "../labels";

export type DecisionAction = "accept_anyway" | "acknowledge";

export interface ClaimDecision {
  action: DecisionAction;
  reason?: string;
  label: TrustLabel; // the label the decision was made against
  at: string;
}

export interface GateClaim {
  key: string;
  label: TrustLabel;
  decision?: ClaimDecision;
  /** A direct quotation without the page (or paragraph) it came from. */
  missingPage?: boolean;
}

export type GateItemState = "ok" | "needs_decision" | "needs_ack" | "pending" | "resolved";

export interface GateResult {
  ready: boolean;
  signedOff: boolean;
  total: number;
  pending: number;
  needDecision: number;
  needAck: number;
  missingPages: number;
  resolved: number;
  items: Array<{ key: string; label: TrustLabel; state: GateItemState }>;
}

/** A decision only counts while the claim still carries the label it was made against. */
export function decisionApplies(label: TrustLabel, d: ClaimDecision | undefined): boolean {
  if (!d || d.label !== label) return false;
  const gate = LABELS[label].gate;
  if (gate === "decide") return d.action === "accept_anyway" && !!d.reason?.trim();
  if (gate === "acknowledge") return d.action === "acknowledge" || d.action === "accept_anyway";
  return false;
}

export function evaluateGate(claims: GateClaim[], signedOff: boolean): GateResult {
  const items = claims.map((c) => {
    const gate = LABELS[c.label].gate;
    let state: GateItemState = "ok";
    if (gate === "pending") state = "pending";
    else if (gate === "decide") state = decisionApplies(c.label, c.decision) ? "resolved" : "needs_decision";
    else if (gate === "acknowledge") state = decisionApplies(c.label, c.decision) ? "resolved" : "needs_ack";
    // a direct quote needs its page whatever the label: a decision cannot waive it
    if (c.missingPage && state !== "pending") state = "needs_decision";
    return { key: c.key, label: c.label, state };
  });
  const count = (s: GateItemState) => items.filter((i) => i.state === s).length;
  const pending = count("pending");
  const needDecision = count("needs_decision");
  const needAck = count("needs_ack");
  return {
    ready: pending === 0 && needDecision === 0 && needAck === 0 && signedOff,
    signedOff,
    total: items.length,
    pending,
    needDecision,
    needAck,
    missingPages: claims.filter((c) => c.missingPage).length,
    resolved: count("resolved"),
    items,
  };
}
