import { NextResponse } from "next/server";
import { ApiError } from "@/lib/utils/errors";
import { getCompanyDetail } from "@/lib/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await getCompanyDetail(id);
    if (!company) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }
    return NextResponse.json({ data: company });
  } catch (error) {
    return ApiError.handle(error);
  }
}
