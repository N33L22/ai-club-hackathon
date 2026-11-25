"use client";

import { createContext, useContext } from "react";
import type { CitationStyleId } from "@/core/model";

export interface CitationContextValue {
  style: CitationStyleId;
  /** Citation numbers by source id, in order of first citation (numeric styles). */
  numbers: Map<string, number>;
  onOpenSource?: (id: string) => void;
}

export const CitationContext = createContext<CitationContextValue>({ style: "apa", numbers: new Map() });
export const useCitationContext = () => useContext(CitationContext);
