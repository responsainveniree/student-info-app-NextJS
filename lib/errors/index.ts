import AppError from "./AppError";

export { default as AppError } from "./AppError";
export { handleError } from "./handleError";

// Quick helpers
export const notFound = (msg = "Not found") => new AppError(msg, 404);
export const badRequest = (msg: string) => new AppError(msg, 400);
export const unauthorized = (msg = "Unauthorized") => new AppError(msg, 401);
