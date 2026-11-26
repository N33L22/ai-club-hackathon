import { connection } from "next/server";
import { aiInfo } from "@/server/ai/client";
import { config } from "@/server/env";
import { blockedServices } from "@/server/http";

/**
 * Lets the UI show whether live AI checks are available and whether the
 * scholarly databases are configured or refusing requests. Never exposes a key.
 */
export async function GET() {
  await connection();
  return Response.json(
    {
      ok: true,
      ai: aiInfo(),
      sources: {
        openalexKey: Boolean(config.openalexKey),
        contactEmail: Boolean(config.contactEmail),
        blocked: blockedServices(),
      },
      version: "1.1.0",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
