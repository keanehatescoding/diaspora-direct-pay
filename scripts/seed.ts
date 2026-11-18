import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run the seed script.");
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  try {
    // Add project-specific seed data here once the schema is migrated.
    void db;
    console.log("Seed complete (no default data).");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
