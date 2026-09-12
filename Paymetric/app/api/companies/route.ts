import { NextResponse } from "next/server";
import { ApiError } from "@/lib/utils/errors";
import { listCompaniesWithStats } from "@/lib/queries";

export async function GET() {
  try {
    const companies = await listCompaniesWithStats();
    return NextResponse.json({ data: companies });
  } catch (error) {
    return ApiError.handle(error);
  }
}
