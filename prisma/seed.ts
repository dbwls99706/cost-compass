import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const rawUrl = process.env.DATABASE_URL ?? "file:./dev.db";

const buildLibSqlConfig = (raw: string): { url: string; authToken?: string } => {
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

const adapter = new PrismaLibSql(buildLibSqlConfig(rawUrl));
const prisma = new PrismaClient({ adapter });

type ProjectStatus = "PLANNING" | "ACTIVE" | "CLOSED";
type CostCategory = "LABOR" | "OUTSOURCE" | "OPERATING" | "COMMON";

type DivisionSeed = {
  name: string;
  headcount: number;
};

type ProjectSeed = {
  code: string;
  name: string;
  divisionName: string;
  status: ProjectStatus;
  description: string;
};

const DIVISIONS: DivisionSeed[] = [
  { name: "IT본부", headcount: 40 },
  { name: "영업본부", headcount: 80 },
  { name: "전략본부", headcount: 20 },
  { name: "리스크본부", headcount: 25 },
  { name: "지원본부", headcount: 35 },
];

const PROJECTS: ProjectSeed[] = [
  { code: "PRJ-001", name: "차세대 코어뱅킹 프로젝트", divisionName: "IT본부", status: "ACTIVE", description: "코어뱅킹 시스템 전면 재구축" },
  { code: "PRJ-002", name: "데이터 플랫폼 고도화", divisionName: "IT본부", status: "ACTIVE", description: "전사 데이터레이크 및 분석 환경 구축" },
  { code: "PRJ-003", name: "보안 시스템 개편", divisionName: "IT본부", status: "ACTIVE", description: "제로트러스트 보안 아키텍처 도입" },
  { code: "PRJ-004", name: "API Gateway 구축", divisionName: "IT본부", status: "PLANNING", description: "대외 오픈뱅킹 API 통합 관리" },
  { code: "PRJ-005", name: "클라우드 마이그레이션", divisionName: "IT본부", status: "ACTIVE", description: "온프레미스 워크로드 클라우드 이전" },
  { code: "PRJ-006", name: "모바일뱅킹 UX 개선", divisionName: "IT본부", status: "CLOSED", description: "모바일 앱 사용자 경험 전면 리뉴얼" },

  { code: "PRJ-007", name: "신상품 A 출시", divisionName: "영업본부", status: "ACTIVE", description: "MZ세대 타겟 신규 수신상품 론칭" },
  { code: "PRJ-008", name: "디지털 채널 확대", divisionName: "영업본부", status: "ACTIVE", description: "비대면 채널 고객 접점 확장" },
  { code: "PRJ-009", name: "제휴사 파트너십 강화", divisionName: "영업본부", status: "PLANNING", description: "전략적 파트너사 제휴 확대" },
  { code: "PRJ-010", name: "VIP 고객 리텐션 프로그램", divisionName: "영업본부", status: "ACTIVE", description: "PB 고객 이탈 방지 및 로열티 강화" },
  { code: "PRJ-011", name: "지점 리모델링", divisionName: "영업본부", status: "CLOSED", description: "주요 거점 지점 공간 재설계" },

  { code: "PRJ-012", name: "2026 경영계획 수립", divisionName: "전략본부", status: "CLOSED", description: "차년도 전사 경영계획 및 KPI 수립" },
  { code: "PRJ-013", name: "ESG 리포팅 체계 구축", divisionName: "전략본부", status: "ACTIVE", description: "지속가능경영 보고서 자동화" },
  { code: "PRJ-014", name: "M&A 타당성 검토", divisionName: "전략본부", status: "PLANNING", description: "해외 핀테크 인수 타당성 분석" },

  { code: "PRJ-015", name: "신용리스크 모델 고도화", divisionName: "리스크본부", status: "ACTIVE", description: "머신러닝 기반 PD/LGD 모델 재구축" },
  { code: "PRJ-016", name: "운영리스크 대응 체계", divisionName: "리스크본부", status: "ACTIVE", description: "전사 운영리스크 관리 프레임워크 정비" },
  { code: "PRJ-017", name: "스트레스 테스트 자동화", divisionName: "리스크본부", status: "PLANNING", description: "감독당국 스트레스 테스트 자동화" },
  { code: "PRJ-018", name: "규제 대응 플랫폼", divisionName: "리스크본부", status: "ACTIVE", description: "금융규제 변화 모니터링 및 대응" },

  { code: "PRJ-019", name: "HR 시스템 개선", divisionName: "지원본부", status: "ACTIVE", description: "인사평가 및 보상 시스템 개편" },
  { code: "PRJ-020", name: "총무 시스템 현대화", divisionName: "지원본부", status: "CLOSED", description: "자산관리 및 전자결재 시스템 교체" },
  { code: "PRJ-021", name: "법무 자문 데이터베이스", divisionName: "지원본부", status: "ACTIVE", description: "사내 법무 자문 사례 지식화" },
  { code: "PRJ-022", name: "감사 업무 디지털화", divisionName: "지원본부", status: "PLANNING", description: "내부감사 업무 전자화 및 자동화" },
];

const PERIODS = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04"] as const;

const CATEGORY_RANGE: Record<CostCategory, { min: number; max: number }> = {
  LABOR: { min: 50_000_000, max: 300_000_000 },
  OUTSOURCE: { min: 10_000_000, max: 200_000_000 },
  OPERATING: { min: 5_000_000, max: 50_000_000 },
  COMMON: { min: 3_000_000, max: 30_000_000 },
};

let rngState = 0x13579bdf;
const rand = (): number => {
  rngState = (rngState * 1664525 + 1013904223) >>> 0;
  return rngState / 0x100000000;
};

const pickInt = (min: number, max: number): number =>
  Math.floor(min + rand() * (max - min + 1));

const pickAmount = (category: CostCategory): number => {
  const { min, max } = CATEGORY_RANGE[category];
  return Math.round(pickInt(min, max) / 10_000) * 10_000;
};

const periodsForStatus = (status: ProjectStatus): readonly string[] => {
  if (status === "ACTIVE") return PERIODS;
  if (status === "PLANNING") return PERIODS.slice(-2);
  return PERIODS.slice(0, 4);
};

const CATEGORY_PROB: Record<CostCategory, number> = {
  LABOR: 1.0,
  OUTSOURCE: 0.7,
  OPERATING: 0.85,
  COMMON: 0.6,
};

const CATEGORIES: CostCategory[] = ["LABOR", "OUTSOURCE", "OPERATING", "COMMON"];

const formatKrw = (amount: number): string =>
  new Intl.NumberFormat("ko-KR").format(amount) + "원";

async function main() {
  console.log("🌱 Seeding Cost Compass...");

  const divisionMap = new Map<string, string>();
  for (const div of DIVISIONS) {
    const record = await prisma.division.upsert({
      where: { name: div.name },
      update: { headcount: div.headcount },
      create: { name: div.name, headcount: div.headcount },
    });
    divisionMap.set(div.name, record.id);
  }

  const projectIds: string[] = [];
  const projectDivisionMap = new Map<string, string>();
  for (const proj of PROJECTS) {
    const divisionId = divisionMap.get(proj.divisionName);
    if (!divisionId) throw new Error(`Unknown division: ${proj.divisionName}`);

    const record = await prisma.project.upsert({
      where: { code: proj.code },
      update: {
        name: proj.name,
        divisionId,
        status: proj.status,
        description: proj.description,
      },
      create: {
        code: proj.code,
        name: proj.name,
        divisionId,
        status: proj.status,
        description: proj.description,
        startedAt: new Date("2025-09-01"),
        endedAt: proj.status === "CLOSED" ? new Date("2026-03-31") : null,
      },
    });
    projectIds.push(record.id);
    projectDivisionMap.set(record.id, divisionId);
  }

  await prisma.costItem.deleteMany({
    where: { projectId: { in: projectIds } },
  });

  const allDivisionIds = Array.from(divisionMap.values());
  const costItems: Array<{
    projectId: string;
    divisionId: string;
    sourceDivisionId: string | null;
    category: string;
    period: string;
    standardAmount: number;
    actualAmount: number;
    isInterUnit: boolean;
    notes: string | null;
  }> = [];

  for (const proj of PROJECTS) {
    const projectRecord = await prisma.project.findUniqueOrThrow({
      where: { code: proj.code },
    });
    const chargedDivisionId = projectDivisionMap.get(projectRecord.id)!;
    const activePeriods = periodsForStatus(proj.status);

    for (const period of activePeriods) {
      for (const category of CATEGORIES) {
        if (rand() > CATEGORY_PROB[category]) continue;

        const standardAmount = pickAmount(category);
        const variance = (rand() * 0.4) - 0.2;
        const actualAmount =
          Math.round((standardAmount * (1 + variance)) / 10_000) * 10_000;

        const isInterUnit = rand() < 0.15;
        let sourceDivisionId: string | null = null;
        if (isInterUnit) {
          const others = allDivisionIds.filter((id) => id !== chargedDivisionId);
          sourceDivisionId = others[pickInt(0, others.length - 1)];
        }

        costItems.push({
          projectId: projectRecord.id,
          divisionId: chargedDivisionId,
          sourceDivisionId,
          category,
          period,
          standardAmount,
          actualAmount,
          isInterUnit,
          notes: isInterUnit ? "내부대체 집계" : null,
        });
      }
    }
  }

  const CHUNK = 100;
  for (let i = 0; i < costItems.length; i += CHUNK) {
    await prisma.costItem.createMany({
      data: costItems.slice(i, i + CHUNK),
    });
  }

  const totalActual = costItems.reduce((sum, item) => sum + item.actualAmount, 0);

  console.log(
    `🌱 Seeded ${DIVISIONS.length} divisions, ${PROJECTS.length} projects, ${costItems.length} cost items (총 ${formatKrw(totalActual)})`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
