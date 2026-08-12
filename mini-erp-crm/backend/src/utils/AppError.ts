export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: unknown;

  constructor(message: string, statusCode = 400, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404);
  }

  static badRequest(message = 'Bad request', errors?: unknown) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403);
  }

  static conflict(message = 'Conflict') {
    return new AppError(message, 409);
  }
}
