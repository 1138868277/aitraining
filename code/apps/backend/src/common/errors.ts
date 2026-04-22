import { ErrorCode, ErrorMessage } from '@cec/contracts';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly httpStatus: number;

  constructor(
    code: ErrorCode,
    message?: string,
    details?: Record<string, unknown>,
    httpStatus = 400,
  ) {
    super(message || ErrorMessage[code]);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.httpStatus = httpStatus;
  }
}
