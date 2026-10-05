import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { pool?: Pool };

function getPool(): Pool {
  if (!globalForDb.pool) {
    globalForDb.pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  }
  return globalForDb.pool;
}

export const pgDb = drizzle({ client: getPool(), schema });
export const db: Db = pgDb;
export { schema };
