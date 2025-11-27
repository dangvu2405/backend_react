class BaseError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class NotFoundError extends BaseError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class BadRequestError extends BaseError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

module.exports = {
  BaseError,
  NotFoundError,
  BadRequestError,
};


