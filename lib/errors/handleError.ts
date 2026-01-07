import AppError from "./AppError";
import { ZodError } from "zod";

export function handleError(error: unknown) {
  console.error("[API_ERROR]", {
    type: error instanceof Error ? error.name : "Unknown",
    message: error instanceof Error ? error.message : String(error),
  });

  if (error instanceof ZodError) {
    return Response.json(
      {
        message: "Validation failed",
        errors: error.errors.map((e) => ({
          field: e.path.join(", "),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  // 2. Custom AppError
  if (error instanceof AppError) {
    return Response.json(
      { message: error.message },
      { status: error.statusCode }
    );
  }

  // 3. Unknown error
  return Response.json(
    {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
    },
    { status: 500 }
  );
}
