import { Prisma, StandardLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CompensationQuery } from "@/lib/validations/compensation";

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

export async function listCompaniesWithStats() {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { compensationEntries: true } },
    },
  });

  const averages = await prisma.compensationEntry.groupBy({
    by: ["companyId"],
    _avg: { totalComp: true },
  });
  const avgByCompany = new Map(
    averages.map((row) => [row.companyId, Math.round(row._avg.totalComp ?? 0)])
  );

  return companies.map((company) => ({
    id: company.id,
    name: company.name,
    nameCanonical: company.nameCanonical,
    createdAt: company.createdAt,
    entryCount: company._count.compensationEntries,
    avgTotalComp: avgByCompany.get(company.id) ?? null,
  }));
}

const STANDARD_LEVELS: StandardLevel[] = [
  "L1",
  "L2",
  "L3",
  "L4",
  "L5",
  "L6",
];

export async function getCompanyDetail(id: string) {
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      levelMappings: { orderBy: { levelIndex: "asc" } },
    },
  });
  if (!company) return null;

  const entries = await prisma.compensationEntry.findMany({
    where: { companyId: id },
    select: { standardLevel: true, totalComp: true },
  });

  const byLevel = new Map<StandardLevel, number[]>();
  for (const level of STANDARD_LEVELS) byLevel.set(level, []);
  for (const entry of entries) {
    byLevel.get(entry.standardLevel)?.push(entry.totalComp);
  }

  const statsByLevel = STANDARD_LEVELS.map((standardLevel) => {
    const comps = byLevel.get(standardLevel) ?? [];
    const avgTotalComp =
      comps.length === 0
        ? null
        : Math.round(comps.reduce((sum, n) => sum + n, 0) / comps.length);
    return {
      standardLevel,
      entryCount: comps.length,
      avgTotalComp,
      medianTotalComp: median(comps),
    };
  });

  return {
    id: company.id,
    name: company.name,
    nameCanonical: company.nameCanonical,
    createdAt: company.createdAt,
    entryCount: entries.length,
    levelMappings: company.levelMappings,
    statsByLevel,
  };
}

export async function listCompensation(query: CompensationQuery) {
  const { page, limit, companyId, standardLevel, location, role, sortBy, sortOrder } =
    query;
  const skip = (page - 1) * limit;

  const where: Prisma.CompensationEntryWhereInput = {};
  if (companyId) where.companyId = companyId;
  if (standardLevel) where.standardLevel = standardLevel;
  if (location) where.location = location;
  if (role) where.role = { name: role };

  const [records, total] = await prisma.$transaction([
    prisma.compensationEntry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { company: true, role: true },
    }),
    prisma.compensationEntry.count({ where }),
  ]);

  return { data: records, total, page, limit };
}

export async function listComparePresets() {
  const [representatives, counts] = await Promise.all([
    prisma.compensationEntry.findMany({
      distinct: ["companyId", "roleId", "standardLevel"],
      orderBy: [
        { companyId: "asc" },
        { roleId: "asc" },
        { standardLevel: "asc" },
        { totalComp: "asc" },
      ],
      include: { company: true, role: true },
    }),
    prisma.compensationEntry.groupBy({
      by: ["companyId", "roleId", "standardLevel"],
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map(
    counts.map((c) => [
      `${c.companyId}|${c.roleId}|${c.standardLevel}`,
      c._count._all,
    ])
  );

  return representatives.map((entry) => {
    const key = `${entry.companyId}|${entry.roleId}|${entry.standardLevel}`;
    return {
      id: entry.id,
      label: `${entry.company.name} · ${entry.role.name} · ${entry.standardLevel}`,
      companyName: entry.company.name,
      roleName: entry.role.name,
      standardLevel: entry.standardLevel,
      sampleCount: countMap.get(key) ?? 1,
    };
  });
}

export async function compareEntries(ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  const entries = await prisma.compensationEntry.findMany({
    where: { id: { in: uniqueIds } },
    include: { company: true, role: true },
  });

  if (entries.length !== uniqueIds.length) {
    const found = new Set(entries.map((e) => e.id));
    const missing = uniqueIds.filter((id) => !found.has(id));
    return { error: `Unknown entry id(s): ${missing.join(", ")}`, status: 404 as const };
  }

  const results = await Promise.all(
    entries.map(async (entry) => {
      const sameLevelCount = await prisma.compensationEntry.count({
        where: { standardLevel: entry.standardLevel },
      });
      const lowerCount = await prisma.compensationEntry.count({
        where: {
          standardLevel: entry.standardLevel,
          totalComp: { lt: entry.totalComp },
        },
      });
      const compPercentile =
        sameLevelCount === 0 ? 0 : (lowerCount / sameLevelCount) * 100;
      const levelScoreNormalized = entry.levelScore;
      const stabilityScore =
        entry.totalComp === 0 ? 0 : (entry.baseSalary / entry.totalComp) * 100;
      const comparisonScore = Math.round(
        0.5 * compPercentile +
          0.3 * levelScoreNormalized +
          0.2 * stabilityScore
      );

      return {
        ...entry,
        comparisonScore,
        scoreBreakdown: {
          compPercentile: Math.round(compPercentile * 10) / 10,
          levelScoreNormalized,
          stabilityScore: Math.round(stabilityScore * 10) / 10,
        },
      };
    })
  );

  return { data: results, status: 200 as const };
}
