export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly metadata?: Record<string, any>;

  constructor(message: string, statusCode: number, metadata?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.metadata = metadata;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 409, metadata);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 400, metadata);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403);
  }
}