/**
 * types/index.ts
 *
 * Shared TypeScript types for the Paymetric application.
 * These are application-level types, not Prisma model types.
 * For Prisma models/enums (Company, CompanyLevelMapping, Role,
 * CompensationEntry, StandardLevel), import directly from '@prisma/client'.
 */

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiErrorResponse {
  error: string;
  issues?: Record<string, string[]>;
}

// ─── Compensation ─────────────────────────────────────────────────────────────
// NOTE: level taxonomy lives in prisma/schema.prisma as the StandardLevel enum
// (L1-L6), resolved via CompanyLevelMapping. Do not redefine it as a string
// union here — import { StandardLevel } from '@prisma/client' instead.

export interface CompensationSummary {
  companyName: string;
  role: string;
  standardLevel: string; // StandardLevel enum value, e.g. "L4"
  levelScore: number;    // 1-100 composite score, see CompanyLevelMapping
  totalCompensation: number;
  location: string;
}
