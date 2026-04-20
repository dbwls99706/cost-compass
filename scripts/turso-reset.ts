import "dotenv/config";
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

const main = async (): Promise<void> => {
  console.log("Turso 연결:", dbUrl);
  await client.execute("DROP TABLE IF EXISTS _applied_migrations");
  console.log("_applied_migrations 테이블 삭제 완료. db:deploy로 재적용하세요.");
  await client.close();
};

main().catch((e) => {
  console.error("실패:", e);
  process.exit(1);
});
