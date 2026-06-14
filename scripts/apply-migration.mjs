import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PROJECT_REF = "vthefxwlwecyjsrznchr";
const MIGRATION_NAME = process.argv[2] ?? "002_posts_and_admin";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(__dirname, "..", "supabase", "migrations", `${MIGRATION_NAME}.sql`);

async function main() {
  if (!existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    console.error("Usage: npm run db:apply-migration -- 020_community_pool");
    process.exit(1);
  }

  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error(
      "Missing SUPABASE_ACCESS_TOKEN.\n" +
        "Create one at https://supabase.com/dashboard/account/tokens then run:\n" +
        '  $env:SUPABASE_ACCESS_TOKEN="your-token"; npm run db:apply-migration -- 020_community_pool',
    );
    process.exit(1);
  }

  const query = readFileSync(migrationPath, "utf8");

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/migrations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: MIGRATION_NAME,
        query,
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Migration failed (${res.status}): ${text}`);
  }

  const result = await res.json();
  console.log("Migration applied successfully:", MIGRATION_NAME);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
