import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  compensationQuerySchema,
  createCompensationSchema,
} from "@/lib/validations/compensation";
import { ApiError } from "@/lib/utils/errors";
import { normalizeCompanyName } from "@/lib/utils/format";
import { listCompensation } from "@/lib/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = compensationQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!parsed.success) {
      return NextResponse.json({ issues: parsed.error.issues }, { status: 422 });
    }

    const result = await listCompensation(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return ApiError.handle(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createCompensationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ issues: parsed.error.issues }, { status: 422 });
    }

    const input = parsed.data;
    const nameCanonical = normalizeCompanyName(input.companyName);

    const company = await prisma.company.upsert({
      where: { nameCanonical },
      update: {},
      create: {
        name: input.companyName.trim(),
        nameCanonical,
      },
    });

    const mapping = await prisma.companyLevelMapping.findUnique({
      where: {
        companyId_nativeLevel: {
          companyId: company.id,
          nativeLevel: input.nativeLevel,
        },
      },
    });

    if (!mapping) {
      return NextResponse.json(
        {
          error: `No level mapping exists for native level "${input.nativeLevel}" at ${company.name}. Unmapped levels are rejected; they are not inferred.`,
        },
        { status: 400 }
      );
    }

    const bonus = input.bonus ?? 0;
    const stock = input.stock ?? 0;
    const totalComp = input.baseSalary + bonus + stock;

    const role = await prisma.role.upsert({
      where: { name: input.role },
      update: {},
      create: { name: input.role },
    });

    const duplicate = await prisma.compensationEntry.findFirst({
      where: {
        companyId: company.id,
        roleId: role.id,
        standardLevel: mapping.standardLevel,
        location: input.location,
        baseSalary: input.baseSalary,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Duplicate compensation entry already exists." },
        { status: 409 }
      );
    }

    const entry = await prisma.compensationEntry.create({
      data: {
        companyId: company.id,
        roleId: role.id,
        nativeLevel: input.nativeLevel,
        standardLevel: mapping.standardLevel,
        levelScore: mapping.levelScore,
        location: input.location,
        baseSalary: input.baseSalary,
        bonus,
        stock,
        totalComp,
        source: input.source,
      },
      include: { company: true, role: true },
    });

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    return ApiError.handle(error);
  }
}
