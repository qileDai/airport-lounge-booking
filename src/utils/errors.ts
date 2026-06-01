export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: number | string) {
    super(404, `${entity} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    this.name = 'ValidationError';
  }
}

export class StatusTransitionError extends AppError {
  constructor(fromStatus: string, toStatus: string) {
    super(400, `Invalid status transition from '${fromStatus}' to '${toStatus}'`);
    this.name = 'StatusTransitionError';
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string) {
    super(422, message);
    this.name = 'BusinessRuleError';
  }
}
