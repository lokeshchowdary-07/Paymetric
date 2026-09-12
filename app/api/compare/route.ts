import { NextResponse } from "next/server";
import { ApiError } from "@/lib/utils/errors";
import { compareEntries } from "@/lib/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("entryIds") ?? "";
    const ids = raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length < 2 || ids.length > 4) {
      return NextResponse.json(
        { error: "Provide 2 to 4 CompensationEntry ids via entryIds." },
        { status: 400 }
      );
    }

    const result = await compareEntries(ids);
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ data: result.data });
  } catch (error) {
    return ApiError.handle(error);
  }
}
