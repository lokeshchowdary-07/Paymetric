/**
 * Formats a numeric compensation value as a localized currency string.
 * @example formatCurrency(150000, 'USD') → '$150,000'
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Normalizes a company name for consistent storage and comparison.
 * Lowercases, trims, and removes common suffixes.
 */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\b(inc|llc|ltd|corp|co)\b\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates total annual compensation.
 */
export function calculateTotalComp(params: {
  baseSalary: number;
  stockCompensation: number;
  bonus: number;
}): number {
  return params.baseSalary + params.stockCompensation + params.bonus;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Linear normalize of `value` into [0, 1] given bounds, then clamp. */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp01((value - min) / (max - min));
}

export function midpoint(min: number, max: number): number {
  return (min + max) / 2;
}

/**
 * Composite levelScore (1–100), computed only at seed time for CompanyLevelMapping.
 * yoeComponent     = normalize(midpoint(yoeMin, yoeMax), 0, 15) * 100
 * scopeComponent   = (scopeWeight / 5) * 100
 * positionComponent = (levelIndex / totalLevels) ** 1.5 * 100
 * levelScore = round(0.4 * yoe + 0.4 * scope + 0.2 * position)
 */
export function calculateLevelScore(input: {
  yoeMin: number;
  yoeMax: number;
  scopeWeight: number;
  levelIndex: number;
  totalLevels: number;
}): number {
  const yoeComponent =
    normalize(midpoint(input.yoeMin, input.yoeMax), 0, 15) * 100;
  const scopeComponent = (input.scopeWeight / 5) * 100;
  const positionComponent =
    Math.pow(input.levelIndex / input.totalLevels, 1.5) * 100;
  return Math.round(
    0.4 * yoeComponent + 0.4 * scopeComponent + 0.2 * positionComponent
  );
}
