type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export function printConsoleError(
  error: unknown,
  httpMethod: HttpMethod,
  apiUrl: string,
) {
  console.error("API_ERROR", {
    route: `(${httpMethod} ${apiUrl})`,
    message: error instanceof Error ? error.message : String(error),
  });
}
