import { StandardLevel } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/utils/errors";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const step = searchParams.get("step");
    const companyId = searchParams.get("companyId");
    const roleId = searchParams.get("roleId");
    const standardLevel = searchParams.get("standardLevel");

    if (!companyId || (step !== "role" && !roleId) || (step === "location" && !standardLevel)) {
      return NextResponse.json({ error: "Missing compare option parameters." }, { status: 400 });
    }
    const requiredRoleId = roleId ?? "";

    if (step === "role") {
      const rows = await prisma.compensationEntry.findMany({
        where: { companyId },
        distinct: ["roleId"],
        select: { roleId: true, role: { select: { name: true } } },
        orderBy: { roleId: "asc" },
      });
      return NextResponse.json({
        data: rows.map((row) => ({ id: row.roleId, name: row.role.name })),
      });
    }

    if (step === "level") {
      const rows = await prisma.compensationEntry.findMany({
        where: { companyId, roleId: requiredRoleId },
        distinct: ["standardLevel"],
        select: { standardLevel: true },
        orderBy: { standardLevel: "asc" },
      });
      return NextResponse.json({ data: rows.map((row) => row.standardLevel) });
    }

    if (step === "location") {
      const rows = await prisma.compensationEntry.findMany({
        where: {
          companyId,
          roleId: requiredRoleId,
          standardLevel: standardLevel as StandardLevel,
        },
        distinct: ["location"],
        select: { location: true },
        orderBy: { location: "asc" },
      });
      const data = await Promise.all(
        rows.map(async (row) => {
          const entry = await prisma.compensationEntry.findFirst({
            where: {
              companyId,
              roleId: requiredRoleId,
              standardLevel: standardLevel as StandardLevel,
              location: row.location,
            },
            orderBy: { id: "asc" },
            select: { id: true },
          });
          return { location: row.location, entryId: entry?.id };
        })
      );
      return NextResponse.json({
        data: data.filter((row): row is { location: string; entryId: string } => Boolean(row.entryId)),
      });
    }

    return NextResponse.json({ error: "Unknown compare option step." }, { status: 400 });
  } catch (error) {
    return ApiError.handle(error);
  }
}
