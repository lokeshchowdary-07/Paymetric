import { z } from "zod";

// Schema for submitting a new compensation record.
// Field names/types mirror prisma/schema.prisma CompensationEntry exactly —
// keep these two in sync any time the schema changes.
export const createCompensationSchema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200),
  role: z.string().min(1, "Role is required").max(200),
  nativeLevel: z.string().min(1, "Native level is required").max(50), // e.g. "SDE II" — resolved to standardLevel via CompanyLevelMapping at ingestion
  location: z.string().min(1).max(100),
  baseSalary: z.number().positive("Base salary must be positive"),
  stock: z.number().min(0).default(0),
  bonus: z.number().min(0).default(0),
  source: z.string().max(200).optional(),
});

export type CreateCompensationInput = z.infer<typeof createCompensationSchema>;

// Schema for query parameters when listing compensation records.
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null || value === undefined ? undefined : value;

export const compensationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  companyId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
  role: z.preprocess(emptyToUndefined, z.string().optional()),
  standardLevel: z.preprocess(
    emptyToUndefined,
    z.enum(["L1", "L2", "L3", "L4", "L5", "L6"]).optional()
  ),
  location: z.preprocess(emptyToUndefined, z.string().optional()),
  sortBy: z.enum(["totalComp", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CompensationQuery = z.infer<typeof compensationQuerySchema>;
