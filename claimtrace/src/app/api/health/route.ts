import { connection } from "next/server";
import { aiInfo } from "@/server/ai/client";

/** Lets the UI show whether live AI checks are available. Never exposes the key. */
export async function GET() {
  await connection();
  return Response.json({ ok: true, ai: aiInfo(), version: "1.0.0" }, { headers: { "Cache-Control": "no-store" } });
}
