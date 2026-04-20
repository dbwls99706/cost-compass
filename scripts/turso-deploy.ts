import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) {
  console.error("DATABASE_URL 환경변수가 필요합니다.");
  process.exit(1);
}

const parsed = new URL(rawUrl);
const authToken = parsed.searchParams.get("authToken") ?? undefined;
parsed.searchParams.delete("authToken");
const dbUrl = parsed.toString();

const client = createClient({ url: dbUrl, authToken });

const ensureMigrationsTable = async (): Promise<void> => {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _applied_migrations (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const getAppliedMigrations = async (): Promise<Set<string>> => {
  const result = await client.execute("SELECT name FROM _applied_migrations");
  return new Set(result.rows.map((r) => r.name as string));
};

const stripComments = (sql: string): string =>
  sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

const splitStatements = (sql: string): string[] =>
  stripComments(sql)
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const applyMigrations = async (): Promise<void> => {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const migrationsDir = join(process.cwd(), "prisma", "migrations");
  const dirs = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  let applyCount = 0;
  for (const dir of dirs) {
    if (applied.has(dir)) {
      console.log(`skip: ${dir}`);
      continue;
    }
    const sqlPath = join(migrationsDir, dir, "migration.sql");
    const sql = readFileSync(sqlPath, "utf-8");
    const statements = splitStatements(sql);

    for (const stmt of statements) {
      await client.execute(stmt);
    }
    await client.execute({
      sql: "INSERT INTO _applied_migrations (name) VALUES (?)",
      args: [dir],
    });
    console.log(`applied: ${dir}`);
    applyCount += 1;
  }
  console.log(`${applyCount}개 마이그레이션 적용 완료.`);
};

const main = async (): Promise<void> => {
  console.log("Turso 연결:", dbUrl);
  await applyMigrations();
  await client.close();
};

main().catch((e) => {
  console.error("실패:", e);
  process.exit(1);
});
