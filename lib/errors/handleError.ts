import AppError from "./AppError";
import { ZodError } from "zod";

export function handleError(error: unknown) {
  console.error(error); // Simple logging

  if (error instanceof ZodError) {
    const messages = error.errors.map((err) => err.message).join(", ");
    return Response.json({ message: messages }, { status: 400 });
  }

  if (error instanceof AppError) {
    return Response.json(
      { message: error.message },
      { status: error.statusCode }
    );
  }

  return Response.json({ message: "Something went wrong" }, { status: 500 });
}
