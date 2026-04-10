export class AppError extends Error {
  readonly statusCode?: number;
  readonly cause?: unknown;

  constructor(message: string, options?: { statusCode?: number; cause?: unknown }) {
    super(message);
    this.name = "AppError";
    this.statusCode = options?.statusCode;
    this.cause = options?.cause;
  }
}

export class ExternalServiceError extends AppError {
  readonly service: string;

  constructor(service: string, message: string, options?: { statusCode?: number; cause?: unknown }) {
    super(message, options);
    this.name = "ExternalServiceError";
    this.service = service;
  }
}

export function toUserSafeMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
