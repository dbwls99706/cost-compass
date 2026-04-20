# Cost Compass

5개 본부 × 22개 프로젝트의 원가를 집계·비교·드릴다운하는 관리회계 대시보드.
노아에이티에스 채용 과제 주제 2. Interface Hub(주제 1)의 자매 프로젝트.

## Tech Stack

- Next.js 16 App Router (TypeScript, strict)
- Tailwind CSS + shadcn/ui
- Prisma 7 + libSQL driver adapter (SQLite 로컬 / Turso 프로덕션)
- Zod (schema validation)
- Recharts (charts)
- Vercel (deploy)

## Architecture Principles

- Server Component 우선, 차트와 인터랙션만 Client
- 집계 쿼리는 SSR에서 완료, 클라이언트는 표시만
- URL searchParams로 필터 상태 관리 (공유 가능한 링크)
- CSV 내보내기는 Server Action으로 (Blob 생성 후 클라이언트에서 다운로드)

## Folder Structure

app/
  (dashboard)/page.tsx            # 메인 대시보드
  projects/                       # 프로젝트별 드릴다운
    page.tsx
    [id]/page.tsx
  divisions/                      # 본부별 드릴다운
    [id]/page.tsx
lib/
  actions/                        # Server Actions
    cost-query.ts                 # 집계 쿼리 모음
    export.ts                     # CSV 내보내기
  prisma.ts
  types/db.ts
  schemas/
components/
  charts/                         # Recharts 래퍼
  dashboard/
    PivotTable.tsx
    FilterBar.tsx
    KpiCard.tsx

## Prisma Import Paths (⚠️ Prisma 7 주의)

- Client import: `@/lib/generated/prisma/client` (⚠️ NOT @prisma/client)
- Model types: `@/lib/generated/prisma/models`
- schema.prisma에는 datasource.url 적지 말 것 (Prisma 7에서 deprecated)
- schema.prisma의 datasource 블록은 provider만:
  datasource db { provider = "sqlite" }
- lib/prisma.ts에서 PrismaLibSql adapter 필수 (아니면 런타임 에러)
- prisma.config.ts에 import "dotenv/config" 필수

## Coding Rules

- TypeScript strict, any 금지 (unknown 사용)
- 함수형 컴포넌트, 화살표 함수
- 폼 검증 Zod + react-hook-form
- 날짜 date-fns
- 금액 표시: Intl.NumberFormat('ko-KR') + '₩' prefix
- 모든 금액은 정수(원 단위)로 저장. 소수점 없음.
- Recharts ResponsiveContainer에는 minWidth={0} minHeight={0} 필수 (측정 race 방지)
- shadcn Select + RHF은 Controller로 감쌀 것 (register 금지)
- Server Component에서 params는 Promise 타입, const { id } = await params

## Commit Rules (엄격)

- Conventional Commits: feat/fix/refactor/chore/docs/style/test
- 제목 영어, 본문 한국어 OK
- Co-authored-by, Generated with, 🤖 이모지, Claude/AI 관련 언급 절대 금지
- 한 커밋 = 한 논리 단위

## Style Rules (user preference)

- em dash(—) 사용 절대 금지
- 한글 모음 ㅡ 사용 금지
- 하이픈(-)만 사용