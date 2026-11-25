import { existsSync } from "node:fs";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const migrationsFolder = "./drizzle";

async function main() {
  if (!existsSync(migrationsFolder)) {
    console.log(`No migrations folder found at ${migrationsFolder}; nothing to apply.`);
    return;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run migrations.");
  }

  const pool = new Pool({ connectionTimeoutMillis: 5_000, connectionString  });
  const db = drizzle(pool);

  try {
    await migrate(db, { migrationsFolder });
    console.log("Migrations applied.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
