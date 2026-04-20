import { PrismaClient } from "@/lib/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

type LibSqlConfig = { url: string; authToken?: string };

const resolveLibSqlConfig = (): LibSqlConfig => {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) return { url: tursoUrl, authToken: tursoToken };

  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (raw.startsWith("file:")) return { url: raw };

  try {
    const parsed = new URL(raw);
    const authToken = parsed.searchParams.get("authToken") ?? undefined;
    parsed.searchParams.delete("authToken");
    return { url: parsed.toString(), authToken };
  } catch {
    return { url: raw };
  }
};

const createPrisma = (): PrismaClient => {
  const adapter = new PrismaLibSql(resolveLibSqlConfig());
  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrisma();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
