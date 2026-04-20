# Cost Compass

5개 본부, 22개 프로젝트 규모의 관리회계 원가를 단일 화면에서 집계, 비교, 드릴다운하는 대시보드.

> 노아에이티에스 2025년 상반기 연구소 인력 채용 포트폴리오 주제 2
> 자매 프로젝트: [Interface Hub](https://github.com/dbwls99706/interface-hub)

## 라이브 데모

- 데모: https://cost-compass.vercel.app
- 저장소: https://github.com/dbwls99706/cost-compass

## 문제 정의와 해결

은행의 관리회계는 본부별, 프로젝트별, 카테고리별로 표준원가와 실제원가를 동시에 관리한다. 데이터가 여러 스프레드시트와 시스템에 분산되면 "이번 달 어느 본부가 예산을 초과했는지", "어느 프로젝트의 외주비가 급증했는지", "내부대체 비중이 얼마나 되는지" 같은 질문에 답하는 비용이 커진다.

Cost Compass는 전사 원가 데이터를 하나의 구조로 정규화하고 대시보드, 프로젝트 목록, 프로젝트 상세 세 흐름으로 드릴다운한다. 필터는 URL 쿼리스트링에 붙여 공유 가능한 링크로 저장되고, 차트에서 막대를 클릭하면 해당 프로젝트 상세로 이동한다.

## 핵심 기능

- 전사 KPI 카드 (전체 실제 원가, 진행 프로젝트 수, Variance 비율, 내부대체 비중)
- 월별 표준 vs 실제 원가 추이 (LineChart)
- 카테고리별 비중 (PieChart, 인건비/외주비/운영비/공통배부)
- 본부별 원가 스택 (Stacked BarChart, 카테고리별 내역 포함)
- 프로젝트 Top 10 (Horizontal BarChart, 클릭 시 상세로 이동, Variance 초과분 라벨)
- 최근 집행 원가 10건 (30% 초과 Variance 행은 배경 강조)
- 프로젝트 목록 (본부/상태 필터, 표준/실제/Variance/항목 수)
- 프로젝트 상세 (카테고리 비중, 월별 추이, 원가 항목 표, 내부대체 출처 표시)
- CSV 내보내기 (UTF-8 BOM, 엑셀 한글 호환)
- 로컬 SQLite와 프로덕션 Turso libSQL을 코드 변경 없이 환경변수로 전환

## 기술 스택

| 영역 | 기술 | 선택 이유 |
| --- | --- | --- |
| 프레임워크 | Next.js 16 App Router, React 19 | Server Component로 집계 쿼리를 서버에서 완결하고 클라이언트는 표시만 담당 |
| 언어 | TypeScript strict | any 금지 정책과 Prisma 생성 타입을 조합해 런타임 버그 차단 |
| UI | Tailwind CSS, shadcn/ui (Base UI), Recharts | 디자인 시스템 일관성과 차트 표현력 |
| ORM | Prisma 7 + libSQL driver adapter | 단일 스키마와 마이그레이션으로 SQLite/libSQL 전환 |
| DB | SQLite(로컬), Turso libSQL(프로덕션) | 저비용 로컬 개발과 HTTP 기반 서버리스 배포 양립 |
| 폼 검증 | Zod | 스키마를 타입과 런타임 검증의 단일 출처로 |
| 배포 | Vercel | App Router와 Server Action 친화, 무중단 배포 |

## 아키텍처 개요

```
Browser
  fetch / Link navigation
    ↓
Next.js (Server Component, Server Action)
  prisma.* 호출, JS 집계
    ↓
Prisma Client (PrismaLibSql adapter)
    ↓
  로컬: file:./dev.db (SQLite)
  프로덕션: libsql://...turso.io (Turso)
```

요청 흐름

```
GET /?period=2026-04&divisionId=...&status=ACTIVE
  → getDashboardStats(filters) in Server Component
      → prisma.division.findMany
      → prisma.project.findMany
      → prisma.costItem.findMany
      → JS 집계 (KPI, 본부/카테고리/월/Top10)
  → RSC 응답에 차트 데이터 직렬화
  → Client Component(Recharts)는 표시만 담당
```

## 데이터 모델

3개 모델로 전사 원가를 정규화했다.

```
Division       본부 (id, name, headcount)
   1:N
Project        프로젝트 (id, code, name, divisionId, status)
   1:N
CostItem       원가 항목 (projectId, divisionId, sourceDivisionId?, category, period, standardAmount, actualAmount, isInterUnit)
```

- `Division.name`은 unique, `Project.code`는 unique (PRJ-001 형식)
- `CostItem.divisionId`는 비용을 부담하는 본부, `sourceDivisionId`는 내부대체 시 출처 본부
- `category`는 `LABOR | OUTSOURCE | OPERATING | COMMON` 4종
- `period`는 `YYYY-MM` 문자열로 저장해 문자열 정렬이 곧 시간 정렬이 되도록 단순화
- 금액은 전부 정수(원 단위)로 저장, 소수점 없음
- 인덱스는 `(projectId, period)`, `(divisionId, period)`, `category`, `period`에 배치

## 집계 쿼리 설계

Prisma `groupBy`를 쓰지 않고 JS에서 집계하는 이유.

- SQLite + libSQL driver adapter 환경의 호환성 확보 (일부 집계 함수와 JOIN 조합에서 드라이버별 동작 차이가 있음)
- 320여 건 규모에서 메모리와 CPU 부담이 무시 가능한 수준
- 집계 로직이 타입스크립트 함수 한 곳에 모여 테스트와 디버깅, 수정이 단순
- 추후 데이터가 커지면 `prisma.costItem.aggregate`나 raw SQL로 교체할 수 있는 경계가 `lib/actions/cost-query.ts`에 이미 그어져 있음

집계 흐름은 `Promise.all`로 division, project, costItem을 병렬 조회한 뒤 필터, 버킷 합산, 정렬 순서로 처리한다. 대시보드 1 요청이 DB 3회 호출로 끝난다.

## 확장 로드맵

- 원가 직접 입력 폼 (현재는 조회 전용)
- 표준원가 배분 규칙 엔진 (ABC 기반)
- 월 마감 / 확정 워크플로
- 본부 단위 권한 분리 (Row Level Security)
- Excel 정식 템플릿 내보내기 (xlsx, 셀 서식 포함)

## 개발 프로세스

### Claude Code와 협업한 바이브코딩

Interface Hub에서 정립한 바이브코딩 프로세스를 그대로 적용했다. 작업은 Phase 0부터 Phase 3까지 단계별로 쪼개고 각 Phase의 범위와 검증 기준을 먼저 글로 못박은 뒤 구현으로 들어갔다.

| Phase | 범위 | 핵심 결과물 |
| --- | --- | --- |
| 0 | 프로젝트 부트스트랩 | Next.js 16 + Tailwind + shadcn 초기화 |
| 1 | DB 스키마와 Prisma 셋업 | Division/Project/CostItem 모델, 시드 326건, 집계 헬퍼 |
| 2 | 대시보드와 프로젝트 화면 | KPI 4종, 차트 4종, 프로젝트 목록/상세, CSV 내보내기 |
| 3 | README와 Vercel 배포 준비 | Turso 연동, prebuild 훅, serverExternalPackages |

루프는 Interface Hub 때와 동일하다.

1. 요구 정의: 데이터 모델과 화면 구성을 먼저 글로 정의
2. 프롬프트: 타입 시그니처, 폴더 구조, 검증 기준을 구체적으로 지시
3. 생성: Claude Code가 파일을 생성하고 수정
4. 검증: `npx tsc --noEmit` 0 + 실제 화면 동작 점검
5. 커밋: Conventional Commits 규칙으로 단일 논리 단위 커밋

`CLAUDE.md`에는 Interface Hub 개발 중 겪은 이슈를 선제 반영해 같은 시행착오를 두 번 겪지 않도록 했다.

- Prisma 7 모델 타입명이 `Division`이 아니라 `DivisionModel`인 점
- `schema.prisma`의 `datasource.url` 제약 (Prisma 7에서 deprecated, `prisma.config.ts`로 이동)
- Recharts `ResponsiveContainer`에 `minWidth={0} minHeight={0}`을 붙여 측정 race 방지
- shadcn `Select`는 react-hook-form과 쓸 때 `Controller`로 감싸야 함
- `file:./dev.db`와 `libsql://...?authToken=...` 양쪽을 단일 함수로 파싱

Interface Hub에서 쌓은 레슨 덕분에 Phase 1 DB 셋업부터 Phase 2 대시보드까지 3~4시간 내 완료 가능한 속도를 확보했다.

## 로컬 실행

```bash
git clone https://github.com/dbwls99706/cost-compass.git
cd cost-compass
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

브라우저에서 http://localhost:3000 접속.

`.env`에 `DATABASE_URL="file:./dev.db"`만 있으면 동작한다.

## 프로덕션 배포

1. Turso 데이터베이스 생성: `turso db create cost-compass`
2. URL과 토큰 조회: `turso db show cost-compass --url`, `turso db tokens create cost-compass`
3. 마이그레이션 적용: `DATABASE_URL='libsql://...?authToken=...' npm run db:deploy`
4. 시드 적용(선택): `DATABASE_URL='libsql://...?authToken=...' npm run db:seed:remote`
5. Vercel 프로젝트 import 후 환경변수 등록
   - `TURSO_DATABASE_URL` = `libsql://...turso.io`
   - `TURSO_AUTH_TOKEN` = `eyJ...`
6. Deploy 클릭

`prebuild`에 `prisma generate`가 걸려 있어 Vercel 빌드 시 자동으로 클라이언트가 생성된다. `next.config.ts`의 `serverExternalPackages`에 `@prisma/client`, `@prisma/adapter-libsql`, `@libsql/client`를 등록해 서버리스 번들 문제를 차단했다.

## 프로젝트 구조

```
app/                       Next.js App Router 페이지
  page.tsx                 대시보드 (KPI, 차트, Top 10, 최근 항목)
  projects/
    page.tsx               프로젝트 목록
    [id]/page.tsx          프로젝트 상세
    [id]/not-found.tsx
components/
  dashboard/               KpiCard, FilterBar, 차트, Badge, ExportCsvButton
  ui/                      shadcn/ui 컴포넌트
lib/
  actions/
    cost-query.ts          대시보드, 목록, 상세 집계 Server Actions
    export.ts              CSV 내보내기 Server Action
  prisma.ts                PrismaLibSql adapter + 환경 자동 감지
  types/db.ts              enum, 라벨, 포맷터, Variance 계산
prisma/
  schema.prisma            Division, Project, CostItem
  seed.ts                  5본부, 22프로젝트, 326 원가 항목
  migrations/
scripts/
  turso-deploy.ts          Turso 원격 마이그레이션 적용 스크립트
```
