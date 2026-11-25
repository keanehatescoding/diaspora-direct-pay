import { sql } from "drizzle-orm";
import { db } from "@/db";

// The platform's health check (`.railway/railway.ts` -> healthcheck) calls this.
// It asks Postgres as well, so a bad or unreachable DATABASE_URL fails the
// deploy rather than going live and then 500ing on every request.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (err) {
    // Log the cause but keep the response minimal: the platform only needs to
    // know whether the database answered.
    console.error("Health check failed: the database didn't answer", err);
    return Response.json({ ok: false }, { status: 503 });
  }
}
