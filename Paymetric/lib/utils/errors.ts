import { NextResponse } from "next/server";

/**
 * Centralized API error handler for Next.js Route Handlers.
 * Catches known error types and returns structured JSON responses.
 */
export class ApiError {
  static handle(error: unknown): NextResponse {
    console.error("[API Error]", error);

    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    // Prisma known request errors (e.g. unique constraint violation)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code: unknown }).code === "string"
    ) {
      const code = (error as { code: string }).code;
      if (code === "P2002") {
        return NextResponse.json(
          { error: "A record with these details already exists." },
          { status: 409 }
        );
      }
      if (code === "P2025") {
        return NextResponse.json(
          { error: "Record not found." },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }

  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500
  ) {}

  static badRequest(message: string) {
    return new ApiError(message, 400);
  }

  static notFound(message: string) {
    return new ApiError(message, 404);
  }

  static unprocessable(message: string) {
    return new ApiError(message, 422);
  }
}
