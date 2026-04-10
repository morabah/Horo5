type LogContext = Record<string, unknown>;

export function logApiError(scope: string, error: unknown, context?: LogContext): void {
  const message = error instanceof Error ? error.message : "Unknown error";
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(
    JSON.stringify({
      level: "error",
      scope,
      message,
      context: context ?? {},
      stack,
      timestamp: new Date().toISOString(),
    })
  );
}
