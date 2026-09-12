/**
 * Seed: 7 companies (large ladders + short ladders), curated mappings, and
 * ~20 compensation rows each. Mapping comments cite public ladder/scope notes.
 *
 * Run: npm run db:seed
 */

import { PrismaClient, StandardLevel } from "@prisma/client";
import "dotenv/config";
import {
  calculateLevelScore,
  calculateTotalComp,
  normalizeCompanyName,
} from "../lib/utils/format";

const prisma = new PrismaClient();

type MappingDef = {
  nativeLevel: string;
  standardLevel: StandardLevel;
  yoeMin: number;
  yoeMax: number;
  scopeWeight: number;
  levelIndex: number;
  totalLevels: number;
  comment: string;
};

type CompDef = {
  companyName: string;
  role: string;
  nativeLevel: string;
  location: string;
  baseSalary: number;
  bonus?: number;
  stock?: number;
  source?: string;
  note?: string;
};

function mapping(def: MappingDef) {
  return {
    ...def,
    levelScore: calculateLevelScore(def),
  };
}

function vary(base: number, i: number): number {
  const factors = [0.9, 0.95, 1, 1.05, 1.1, 0.88, 1.12];
  return Math.round((base * factors[i % factors.length]) / 1000) * 1000;
}

async function resolveCompany(displayName: string) {
  const nameCanonical = normalizeCompanyName(displayName);
  return prisma.company.upsert({
    where: { nameCanonical },
    update: {},
    create: {
      name: displayName.replace(/\b(inc\.?|llc\.?|ltd\.?)\b/gi, "").trim() || displayName,
      nameCanonical,
    },
  });
}

async function resolveRole(name: string) {
  return prisma.role.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function ingest(entry: CompDef) {
  const company = await resolveCompany(entry.companyName);
  const role = await resolveRole(entry.role);
  const mappingRow = await prisma.companyLevelMapping.findUnique({
    where: {
      companyId_nativeLevel: {
        companyId: company.id,
        nativeLevel: entry.nativeLevel,
      },
    },
  });
  if (!mappingRow) {
    throw new Error(
      `Seed mapping missing for ${entry.companyName} / ${entry.nativeLevel}`
    );
  }

  const bonus = entry.bonus ?? 0;
  const stock = entry.stock ?? 0;
  const totalComp = calculateTotalComp({
    baseSalary: entry.baseSalary,
    bonus,
    stockCompensation: stock,
  });

  if (entry.note) {
    console.log(`  • ${entry.note}`);
  }

  await prisma.compensationEntry.create({
    data: {
      companyId: company.id,
      roleId: role.id,
      nativeLevel: entry.nativeLevel,
      standardLevel: mappingRow.standardLevel,
      levelScore: mappingRow.levelScore,
      location: entry.location,
      baseSalary: entry.baseSalary,
      bonus,
      stock,
      totalComp,
      source: entry.source,
    },
  });
}

const GOOGLE_MAPPINGS: MappingDef[] = [
  // Google "L3" ≈ new-grad / SWE II, executes tickets on a team, 0-2 YoE
  mapping({
    nativeLevel: "L3",
    standardLevel: "L1",
    yoeMin: 0,
    yoeMax: 2,
    scopeWeight: 1,
    levelIndex: 1,
    totalLevels: 6,
    comment: 'Google "L3" ≈ new-grad SWE II, executes scoped tasks, 0-2 YoE',
  }),
  // Google "L4" ≈ SWE III, owns features independently, 2-5 YoE
  mapping({
    nativeLevel: "L4",
    standardLevel: "L2",
    yoeMin: 2,
    yoeMax: 5,
    scopeWeight: 2,
    levelIndex: 2,
    totalLevels: 6,
    comment: 'Google "L4" ≈ independent feature owner, 2-5 YoE',
  }),
  // Google "L5" ≈ Senior SWE, owns a system/area, mentors, 5-8 YoE
  mapping({
    nativeLevel: "L5",
    standardLevel: "L3",
    yoeMin: 5,
    yoeMax: 8,
    scopeWeight: 3,
    levelIndex: 3,
    totalLevels: 6,
    comment: 'Google "L5" ≈ Senior SWE, owns a system, mentors, 5-8 YoE',
  }),
  // Google "L6" ≈ Staff SWE, cross-team technical lead, 8-12 YoE
  mapping({
    nativeLevel: "L6",
    standardLevel: "L4",
    yoeMin: 8,
    yoeMax: 12,
    scopeWeight: 4,
    levelIndex: 4,
    totalLevels: 6,
    comment: 'Google "L6" ≈ Staff, cross-team technical lead, 8-12 YoE',
  }),
  // Google "L7" ≈ Senior Staff, org-level direction, 11-16 YoE
  mapping({
    nativeLevel: "L7",
    standardLevel: "L5",
    yoeMin: 11,
    yoeMax: 16,
    scopeWeight: 5,
    levelIndex: 5,
    totalLevels: 6,
    comment: 'Google "L7" ≈ Senior Staff, org-level direction, 11-16 YoE',
  }),
  // Google "L8" ≈ Principal, company-wide technical authority, 14+ YoE
  mapping({
    nativeLevel: "L8",
    standardLevel: "L6",
    yoeMin: 14,
    yoeMax: 20,
    scopeWeight: 5,
    levelIndex: 6,
    totalLevels: 6,
    comment: 'Google "L8" ≈ Principal, company-wide technical authority, 14+ YoE',
  }),
];

const AMAZON_MAPPINGS: MappingDef[] = [
  // Amazon "SDE I" ≈ L4 internally, new-grad, tightly scoped tasks, 0-2 YoE
  mapping({
    nativeLevel: "SDE I",
    standardLevel: "L1",
    yoeMin: 0,
    yoeMax: 2,
    scopeWeight: 1,
    levelIndex: 1,
    totalLevels: 6,
    comment: 'Amazon "SDE I" ≈ new-grad, tightly scoped tasks, 0-2 YoE',
  }),
  // Amazon "SDE II" ≈ L5, owns features, 2-5 YoE
  mapping({
    nativeLevel: "SDE II",
    standardLevel: "L2",
    yoeMin: 2,
    yoeMax: 5,
    scopeWeight: 2,
    levelIndex: 2,
    totalLevels: 6,
    comment: 'Amazon "SDE II" ≈ owns features end-to-end, 2-5 YoE',
  }),
  // Amazon "SDE III" ≈ L6 Senior, owns a service, 5-9 YoE
  mapping({
    nativeLevel: "SDE III",
    standardLevel: "L3",
    yoeMin: 5,
    yoeMax: 9,
    scopeWeight: 3,
    levelIndex: 3,
    totalLevels: 6,
    comment: 'Amazon "SDE III" ≈ Senior, owns a service, 5-9 YoE',
  }),
  // Amazon "Principal SDE" ≈ L7, multi-team architecture, 8-13 YoE
  mapping({
    nativeLevel: "Principal SDE",
    standardLevel: "L4",
    yoeMin: 8,
    yoeMax: 13,
    scopeWeight: 4,
    levelIndex: 4,
    totalLevels: 6,
    comment: 'Amazon "Principal SDE" ≈ multi-team architecture, 8-13 YoE',
  }),
  // Amazon "Senior Principal SDE" ≈ L8, org-wide influence, 12-16 YoE
  mapping({
    nativeLevel: "Senior Principal SDE",
    standardLevel: "L5",
    yoeMin: 12,
    yoeMax: 16,
    scopeWeight: 5,
    levelIndex: 5,
    totalLevels: 6,
    comment: 'Amazon "Senior Principal SDE" ≈ org-wide influence, 12-16 YoE',
  }),
  // Amazon "Distinguished Engineer" ≈ L10, company-level technical bar, 15+ YoE
  mapping({
    nativeLevel: "Distinguished Engineer",
    standardLevel: "L6",
    yoeMin: 15,
    yoeMax: 22,
    scopeWeight: 5,
    levelIndex: 6,
    totalLevels: 6,
    comment: 'Amazon "Distinguished Engineer" ≈ company-level technical bar, 15+ YoE',
  }),
];

const MICROSOFT_MAPPINGS: MappingDef[] = [
  // Microsoft "Software Engineer" (59-60) ≈ early career, 0-2 YoE
  mapping({
    nativeLevel: "Software Engineer",
    standardLevel: "L1",
    yoeMin: 0,
    yoeMax: 2,
    scopeWeight: 1,
    levelIndex: 1,
    totalLevels: 6,
    comment: 'Microsoft "Software Engineer" (59-60) ≈ early career, 0-2 YoE',
  }),
  // Microsoft "Software Engineer II" (61-62) ≈ independent contributor, 2-5 YoE
  mapping({
    nativeLevel: "Software Engineer II",
    standardLevel: "L2",
    yoeMin: 2,
    yoeMax: 5,
    scopeWeight: 2,
    levelIndex: 2,
    totalLevels: 6,
    comment: 'Microsoft "Software Engineer II" (61-62) ≈ independent IC, 2-5 YoE',
  }),
  // Microsoft "Senior SDE" (63-64) ≈ owns a full service, mentors juniors, 5-8 YoE
  mapping({
    nativeLevel: "Senior SDE",
    standardLevel: "L3",
    yoeMin: 5,
    yoeMax: 8,
    scopeWeight: 3,
    levelIndex: 3,
    totalLevels: 6,
    comment: 'Microsoft "Senior SDE" (63-64) ≈ owns a full service, mentors juniors, 5-8 YoE',
  }),
  // Microsoft "Principal SDE" (65) ≈ multi-team technical owner, 8-12 YoE
  mapping({
    nativeLevel: "Principal SDE",
    standardLevel: "L4",
    yoeMin: 8,
    yoeMax: 12,
    scopeWeight: 4,
    levelIndex: 4,
    totalLevels: 6,
    comment: 'Microsoft "Principal SDE" (65) ≈ multi-team technical owner, 8-12 YoE',
  }),
  // Microsoft "Partner" (67) ≈ org-level partner engineer, 12-16 YoE
  mapping({
    nativeLevel: "Partner",
    standardLevel: "L5",
    yoeMin: 12,
    yoeMax: 16,
    scopeWeight: 5,
    levelIndex: 5,
    totalLevels: 6,
    comment: 'Microsoft "Partner" (67) ≈ org-level partner engineer, 12-16 YoE',
  }),
  // Microsoft "Distinguished Engineer" ≈ company-wide technical authority, 15+ YoE
  mapping({
    nativeLevel: "Distinguished Engineer",
    standardLevel: "L6",
    yoeMin: 15,
    yoeMax: 22,
    scopeWeight: 5,
    levelIndex: 6,
    totalLevels: 6,
    comment: 'Microsoft "Distinguished Engineer" ≈ company-wide technical authority, 15+ YoE',
  }),
];

const META_MAPPINGS: MappingDef[] = [
  // Meta "E3" ≈ new-grad production contributor, 0-2 YoE
  mapping({
    nativeLevel: "E3",
    standardLevel: "L1",
    yoeMin: 0,
    yoeMax: 2,
    scopeWeight: 1,
    levelIndex: 1,
    totalLevels: 6,
    comment: 'Meta "E3" ≈ new-grad production contributor, 0-2 YoE',
  }),
  // Meta "E4" ≈ mid-level, owns features, 2-5 YoE
  mapping({
    nativeLevel: "E4",
    standardLevel: "L2",
    yoeMin: 2,
    yoeMax: 5,
    scopeWeight: 2,
    levelIndex: 2,
    totalLevels: 6,
    comment: 'Meta "E4" ≈ mid-level, owns features, 2-5 YoE',
  }),
  // Meta "E5" ≈ Senior, team-level technical owner, 5-8 YoE
  mapping({
    nativeLevel: "E5",
    standardLevel: "L3",
    yoeMin: 5,
    yoeMax: 8,
    scopeWeight: 3,
    levelIndex: 3,
    totalLevels: 6,
    comment: 'Meta "E5" ≈ Senior, team-level technical owner, 5-8 YoE',
  }),
  // Meta "E6" ≈ Staff, cross-team impact, 8-12 YoE
  mapping({
    nativeLevel: "E6",
    standardLevel: "L4",
    yoeMin: 8,
    yoeMax: 12,
    scopeWeight: 4,
    levelIndex: 4,
    totalLevels: 6,
    comment: 'Meta "E6" ≈ Staff, cross-team impact, 8-12 YoE',
  }),
  // Meta "E7" ≈ Senior Staff / Director-equivalent IC, 11-16 YoE
  mapping({
    nativeLevel: "E7",
    standardLevel: "L5",
    yoeMin: 11,
    yoeMax: 16,
    scopeWeight: 5,
    levelIndex: 5,
    totalLevels: 6,
    comment: 'Meta "E7" ≈ Senior Staff IC, org-level impact, 11-16 YoE',
  }),
  // Meta "E8" ≈ Principal / VP-equivalent IC, 14+ YoE
  mapping({
    nativeLevel: "E8",
    standardLevel: "L6",
    yoeMin: 14,
    yoeMax: 20,
    scopeWeight: 5,
    levelIndex: 6,
    totalLevels: 6,
    comment: 'Meta "E8" ≈ Principal IC, company-wide impact, 14+ YoE',
  }),
];

const STRIPE_MAPPINGS: MappingDef[] = [
  // Stripe "L2" / Software Engineer ≈ early-career on a pod, 0-3 YoE (4-rung ladder)
  mapping({
    nativeLevel: "Software Engineer",
    standardLevel: "L1",
    yoeMin: 0,
    yoeMax: 3,
    scopeWeight: 2,
    levelIndex: 1,
    totalLevels: 4,
    comment: 'Stripe "Software Engineer" ≈ early-career on a pod, 0-3 YoE (4-rung ladder)',
  }),
  // Stripe "L3" / Senior ≈ owns a product surface, 3-7 YoE
  mapping({
    nativeLevel: "Senior Software Engineer",
    standardLevel: "L3",
    yoeMin: 3,
    yoeMax: 7,
    scopeWeight: 3,
    levelIndex: 2,
    totalLevels: 4,
    comment: 'Stripe "Senior Software Engineer" ≈ owns a product surface, 3-7 YoE',
  }),
  // Stripe "L4" / Staff ≈ multi-team payments/infra owner, 7-12 YoE
  mapping({
    nativeLevel: "Staff Software Engineer",
    standardLevel: "L4",
    yoeMin: 7,
    yoeMax: 12,
    scopeWeight: 4,
    levelIndex: 3,
    totalLevels: 4,
    comment: 'Stripe "Staff Software Engineer" ≈ multi-team payments/infra owner, 7-12 YoE',
  }),
  // Stripe "L5" / Principal ≈ company-wide technical direction, 10+ YoE
  mapping({
    nativeLevel: "Principal Software Engineer",
    standardLevel: "L5",
    yoeMin: 10,
    yoeMax: 16,
    scopeWeight: 5,
    levelIndex: 4,
    totalLevels: 4,
    comment: 'Stripe "Principal Software Engineer" ≈ company-wide technical direction, 10+ YoE',
  }),
];

const CLOUDFLARE_MAPPINGS: MappingDef[] = [
  // Cloudflare "L3" ≈ software engineer, 0-3 YoE (short 4-rung ladder)
  mapping({
    nativeLevel: "L3",
    standardLevel: "L1",
    yoeMin: 0,
    yoeMax: 3,
    scopeWeight: 2,
    levelIndex: 1,
    totalLevels: 4,
    comment: 'Cloudflare "L3" ≈ software engineer on a team, 0-3 YoE (4-rung ladder)',
  }),
  // Cloudflare "L4" ≈ senior, owns a service in the edge stack, 3-7 YoE
  mapping({
    nativeLevel: "L4",
    standardLevel: "L3",
    yoeMin: 3,
    yoeMax: 7,
    scopeWeight: 3,
    levelIndex: 2,
    totalLevels: 4,
    comment: 'Cloudflare "L4" ≈ senior, owns a service in the edge stack, 3-7 YoE',
  }),
  // Cloudflare "L5" ≈ staff, cross-team protocol/edge owner, 7-11 YoE
  mapping({
    nativeLevel: "L5",
    standardLevel: "L4",
    yoeMin: 7,
    yoeMax: 11,
    scopeWeight: 4,
    levelIndex: 3,
    totalLevels: 4,
    comment: 'Cloudflare "L5" ≈ staff, cross-team protocol/edge owner, 7-11 YoE',
  }),
  // Cloudflare "L6" ≈ principal, org-level systems owner, 10+ YoE
  mapping({
    nativeLevel: "L6",
    standardLevel: "L5",
    yoeMin: 10,
    yoeMax: 16,
    scopeWeight: 5,
    levelIndex: 4,
    totalLevels: 4,
    comment: 'Cloudflare "L6" ≈ principal, org-level systems owner, 10+ YoE',
  }),
];

const SHOPIFY_MAPPINGS: MappingDef[] = [
  // Shopify "L3" / Developer ≈ early IC, 0-2 YoE (5-rung ladder)
  mapping({
    nativeLevel: "Developer",
    standardLevel: "L1",
    yoeMin: 0,
    yoeMax: 2,
    scopeWeight: 1,
    levelIndex: 1,
    totalLevels: 5,
    comment: 'Shopify "Developer" ≈ early IC, 0-2 YoE (5-rung ladder)',
  }),
  // Shopify "L4" / Senior Developer ≈ independent owner, 2-5 YoE
  mapping({
    nativeLevel: "Senior Developer",
    standardLevel: "L2",
    yoeMin: 2,
    yoeMax: 5,
    scopeWeight: 2,
    levelIndex: 2,
    totalLevels: 5,
    comment: 'Shopify "Senior Developer" ≈ independent owner, 2-5 YoE',
  }),
  // Shopify "L5" / Lead ≈ team technical lead, 5-8 YoE
  mapping({
    nativeLevel: "Lead Developer",
    standardLevel: "L3",
    yoeMin: 5,
    yoeMax: 8,
    scopeWeight: 3,
    levelIndex: 3,
    totalLevels: 5,
    comment: 'Shopify "Lead Developer" ≈ team technical lead, 5-8 YoE',
  }),
  // Shopify "L6" / Staff ≈ cross-team commerce platform owner, 8-12 YoE
  mapping({
    nativeLevel: "Staff Developer",
    standardLevel: "L4",
    yoeMin: 8,
    yoeMax: 12,
    scopeWeight: 4,
    levelIndex: 4,
    totalLevels: 5,
    comment: 'Shopify "Staff Developer" ≈ cross-team commerce platform owner, 8-12 YoE',
  }),
  // Shopify "L7" / Senior Staff ≈ org-level merchant-platform owner, 11+ YoE
  mapping({
    nativeLevel: "Senior Staff Developer",
    standardLevel: "L5",
    yoeMin: 11,
    yoeMax: 16,
    scopeWeight: 5,
    levelIndex: 5,
    totalLevels: 5,
    comment: 'Shopify "Senior Staff Developer" ≈ org-level merchant-platform owner, 11+ YoE',
  }),
];

const COMPANIES: {
  seedName: string;
  mappings: MappingDef[];
}[] = [
  { seedName: "Google LLC", mappings: GOOGLE_MAPPINGS },
  { seedName: "Amazon", mappings: AMAZON_MAPPINGS },
  { seedName: "Microsoft", mappings: MICROSOFT_MAPPINGS },
  { seedName: "Meta", mappings: META_MAPPINGS },
  { seedName: "Stripe", mappings: STRIPE_MAPPINGS },
  { seedName: "Cloudflare", mappings: CLOUDFLARE_MAPPINGS },
  { seedName: "Shopify", mappings: SHOPIFY_MAPPINGS },
];

function buildEntries(): CompDef[] {
  const entries: CompDef[] = [];

  const googleBands: Record<string, [number, number, number]> = {
    L3: [145000, 22000, 25000],
    L4: [175000, 32000, 85000],
    L5: [210000, 42000, 165000],
    L6: [250000, 55000, 280000],
    L7: [300000, 70000, 420000],
    L8: [350000, 90000, 620000],
  };
  const googleLevels = Object.keys(googleBands);
  const googleLocs = ["Bay Area", "Seattle", "New York"];
  googleLevels.forEach((level, li) => {
    const [base, bonus, stock] = googleBands[level];
    googleLocs.forEach((location, locI) => {
      entries.push({
        companyName: locI === 0 && li === 0 ? "Google LLC" : locI === 1 && li === 1 ? "google inc." : "Google",
        role: locI === 2 ? "Product Manager" : "Software Engineer",
        nativeLevel: level,
        location,
        baseSalary: vary(base, li + locI),
        bonus: vary(bonus, locI),
        stock: vary(stock, li),
        source: "seed: levels.fyi-style public bands",
        note:
          locI === 1 && li === 1
            ? 'TEST dedup/canonical: "google inc." must resolve to the same Company as "Google LLC"'
            : locI === 0 && li === 0
              ? 'TEST canonical: first Google row ingested as "Google LLC"'
              : undefined,
      });
    });
  });
  // Missing bonus/stock → pipeline defaults to 0
  entries.push({
    companyName: "Google",
    role: "Software Engineer",
    nativeLevel: "L4",
    location: "Austin",
    baseSalary: 165000,
    source: "seed: missing bonus/stock",
    note: "TEST validation: bonus and stock omitted; must default to 0",
  });
  entries.push({
    companyName: "Google",
    role: "Data Scientist",
    nativeLevel: "L5",
    location: "Remote",
    baseSalary: 195000,
    bonus: 25000,
    source: "seed: missing stock",
    note: "TEST validation: stock omitted; must default to 0",
  });

  const amazonBands: Record<string, [number, number, number]> = {
    "SDE I": [130000, 18000, 35000],
    "SDE II": [160000, 28000, 90000],
    "SDE III": [185000, 40000, 175000],
    "Principal SDE": [220000, 55000, 280000],
    "Senior Principal SDE": [260000, 70000, 400000],
    "Distinguished Engineer": [320000, 90000, 550000],
  };
  const amazonLocs = ["Seattle", "Bay Area", "Austin"];
  Object.entries(amazonBands).forEach(([level, band], li) => {
    amazonLocs.forEach((location, locI) => {
      entries.push({
        companyName: "Amazon",
        role: locI === 2 ? "Product Manager" : "Software Engineer",
        nativeLevel: level,
        location,
        baseSalary: vary(band[0], li + locI),
        bonus: vary(band[1], locI),
        stock: vary(band[2], li),
        source: "seed",
      });
    });
  });
  entries.push({
        companyName: "Amazon Inc.",
        role: "Software Engineer",
        nativeLevel: "SDE II",
        location: "New York",
        baseSalary: 155000,
        source: "seed: Inc suffix",
        note: 'TEST canonical: "Amazon Inc." must collapse to the Amazon company',
  });

  const msBands: Record<string, [number, number, number]> = {
    "Software Engineer": [125000, 15000, 20000],
    "Software Engineer II": [150000, 25000, 55000],
    "Senior SDE": [180000, 35000, 110000],
    "Principal SDE": [210000, 50000, 200000],
    Partner: [250000, 70000, 320000],
    "Distinguished Engineer": [310000, 90000, 480000],
  };
  const msLocs = ["Seattle", "Bay Area", "New York"];
  Object.entries(msBands).forEach(([level, band], li) => {
    msLocs.forEach((location, locI) => {
      entries.push({
        companyName: "Microsoft",
        role: locI === 2 ? "Product Manager" : "Software Engineer",
        nativeLevel: level,
        location,
        baseSalary: vary(band[0], li + locI),
        bonus: vary(band[1], locI),
        stock: vary(band[2], li),
        source: "seed",
      });
    });
  });
  entries.push({
    companyName: "Microsoft",
    role: "Software Engineer",
    nativeLevel: "Senior SDE",
    location: "Remote",
    baseSalary: 175000,
    note: "TEST validation: Microsoft Senior SDE with omitted bonus/stock defaults to 0",
  });

  const metaBands: Record<string, [number, number, number]> = {
    E3: [140000, 20000, 40000],
    E4: [170000, 30000, 95000],
    E5: [210000, 45000, 200000],
    E6: [240000, 60000, 330000],
    E7: [290000, 80000, 480000],
    E8: [340000, 100000, 650000],
  };
  const metaLocs = ["Bay Area", "New York", "Seattle"];
  Object.entries(metaBands).forEach(([level, band], li) => {
    metaLocs.forEach((location, locI) => {
      entries.push({
        companyName: "Meta",
        role: locI === 1 ? "Data Scientist" : "Software Engineer",
        nativeLevel: level,
        location,
        baseSalary: vary(band[0], li + locI),
        bonus: vary(band[1], locI),
        stock: vary(band[2], li),
        source: "seed",
      });
    });
  });

  const stripeBands: Record<string, [number, number, number]> = {
    "Software Engineer": [155000, 15000, 60000],
    "Senior Software Engineer": [195000, 25000, 140000],
    "Staff Software Engineer": [235000, 35000, 250000],
    "Principal Software Engineer": [280000, 50000, 380000],
  };
  const stripeLocs = ["Bay Area", "Seattle", "Remote", "New York"];
  Object.entries(stripeBands).forEach(([level, band], li) => {
    stripeLocs.forEach((location, locI) => {
      entries.push({
        companyName: "Stripe",
        role: locI === 3 ? "Product Manager" : "Software Engineer",
        nativeLevel: level,
        location,
        baseSalary: vary(band[0], li + locI),
        bonus: locI === 2 && li === 0 ? undefined : vary(band[1], locI),
        stock: locI === 2 && li === 0 ? undefined : vary(band[2], li),
        source: "seed",
        note:
          locI === 2 && li === 0
            ? "TEST validation: Stripe Remote SWE missing bonus/stock defaults to 0"
            : undefined,
      });
    });
  });

  const cfBands: Record<string, [number, number, number]> = {
    L3: [140000, 12000, 35000],
    L4: [175000, 20000, 90000],
    L5: [210000, 30000, 170000],
    L6: [250000, 40000, 260000],
  };
  const cfLocs = ["Bay Area", "Austin", "Remote", "New York"];
  Object.entries(cfBands).forEach(([level, band], li) => {
    cfLocs.forEach((location, locI) => {
      entries.push({
        companyName: "Cloudflare",
        role: locI === 1 ? "Product Manager" : "Software Engineer",
        nativeLevel: level,
        location,
        baseSalary: vary(band[0], li + locI),
        bonus: vary(band[1], locI),
        stock: vary(band[2], li),
        source: "seed",
      });
    });
  });

  const shopifyBands: Record<string, [number, number, number]> = {
    Developer: [120000, 10000, 25000],
    "Senior Developer": [155000, 18000, 70000],
    "Lead Developer": [185000, 25000, 120000],
    "Staff Developer": [215000, 35000, 190000],
    "Senior Staff Developer": [250000, 45000, 280000],
  };
  const shopifyLocs = ["Remote", "New York", "Bay Area"];
  Object.entries(shopifyBands).forEach(([level, band], li) => {
    shopifyLocs.forEach((location, locI) => {
      entries.push({
        companyName: "Shopify",
        role: locI === 2 ? "Data Scientist" : "Software Engineer",
        nativeLevel: level,
        location,
        baseSalary: vary(band[0], li + locI),
        bonus: vary(band[1], locI),
        stock: vary(band[2], li),
        source: "seed",
      });
    });
  });
  entries.push({
    companyName: "Shopify Ltd",
    role: "Software Engineer",
    nativeLevel: "Senior Developer",
    location: "Austin",
    baseSalary: 150000,
    bonus: 15000,
    stock: 60000,
    source: "seed: Ltd suffix",
    note: 'TEST canonical: "Shopify Ltd" must resolve to Shopify',
  });

  return entries;
}

async function main() {
  console.log("🌱 Starting database seed...");

  await prisma.compensationEntry.deleteMany();
  await prisma.companyLevelMapping.deleteMany();
  await prisma.company.deleteMany();
  await prisma.role.deleteMany();

  for (const company of COMPANIES) {
    const created = await resolveCompany(company.seedName);
    console.log(`✅ Company ${created.name} (${created.nameCanonical})`);
    for (const m of company.mappings) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { comment, ...fields } = m;
      console.log(
        `   mapping ${m.nativeLevel} → ${m.standardLevel} score=${calculateLevelScore(fields)} // ${comment}`
      );
      await prisma.companyLevelMapping.create({
        data: {
          companyId: created.id,
          nativeLevel: fields.nativeLevel,
          standardLevel: fields.standardLevel,
          yoeMin: fields.yoeMin,
          yoeMax: fields.yoeMax,
          scopeWeight: fields.scopeWeight,
          levelIndex: fields.levelIndex,
          totalLevels: fields.totalLevels,
          levelScore: calculateLevelScore(fields),
        },
      });
    }
  }

  const entries = buildEntries();
  for (const entry of entries) {
    await ingest(entry);
  }

  const count = await prisma.compensationEntry.count();
  const companies = await prisma.company.count();
  console.log(`✅ Seed complete: ${companies} companies, ${count} compensation entries.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
