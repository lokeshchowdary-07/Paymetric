import { NextResponse } from "next/server";
import { ApiError } from "@/lib/utils/errors";
import { listCompaniesWithStats } from "@/lib/queries";

export async function GET(request: Request) {
  try {
    const search = new URL(request.url).searchParams.get("search") ?? undefined;
    const companies = await listCompaniesWithStats(search || undefined);
    return NextResponse.json({ data: companies });
  } catch (error) {
    return ApiError.handle(error);
  }
}
