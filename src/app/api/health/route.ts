import type { PoolClient } from "pg";
import { pool } from "@/db";

// The platform's health check (`.railway/railway.ts` -> healthcheck) calls this.
// It asks Postgres as well, so a bad or unreachable DATABASE_URL fails the
// deploy rather than going live and then 500ing on every request.
export const dynamic = "force-dynamic";

export async function GET() {
  let client: PoolClient | undefined;
  try {
    client = await pool.connect();
    // connectionTimeoutMillis only covers connection setup. Bound query
    // execution on this checked-out session too; the client is discarded in
    // finally, so the setting cannot leak into other requests.
    await client.query("SET statement_timeout = 5000");
    await client.query("select 1");
    return Response.json({ ok: true });
  } catch (err) {
    // Log the cause but keep the response minimal: the platform only needs to
    // know whether the database answered.
    console.error("Health check failed: the database didn't answer", err);
    return Response.json({ ok: false }, { status: 503 });
  } finally {
    // A timed-out query may still be in flight on the server. Discard this
    // client rather than returning a possibly-stalled session to the pool.
    client?.release(true);
  }
}
