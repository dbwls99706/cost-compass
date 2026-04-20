export const ProjectStatus = {
  PLANNING: "PLANNING",
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const CostCategory = {
  LABOR: "LABOR",
  OUTSOURCE: "OUTSOURCE",
  OPERATING: "OPERATING",
  COMMON: "COMMON",
} as const;
export type CostCategory = (typeof CostCategory)[keyof typeof CostCategory];

export const CATEGORY_LABELS: Record<CostCategory, string> = {
  LABOR: "인건비",
  OUTSOURCE: "외주비",
  OPERATING: "운영비",
  COMMON: "공통배부",
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: "계획",
  ACTIVE: "진행",
  CLOSED: "종료",
};

export const formatKrw = (amount: number): string =>
  new Intl.NumberFormat("ko-KR").format(amount) + "원";

export const formatKrwShort = (amount: number): string => {
  if (amount >= 100_000_000) {
    return `${(amount / 100_000_000).toFixed(1)}억`;
  }
  if (amount >= 10_000_000) {
    return `${Math.round(amount / 10_000)}만`;
  }
  if (amount >= 10_000) {
    return `${(amount / 10_000).toFixed(1)}만`;
  }
  return amount.toLocaleString("ko-KR");
};

export const calcVariance = (standard: number, actual: number) => ({
  amount: actual - standard,
  ratio: standard === 0 ? 0 : (actual - standard) / standard,
});
