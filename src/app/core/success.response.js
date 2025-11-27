class SuccessResponse {
  constructor({ message = 'Success', metadata = {}, statusCode = 200 } = {}) {
    this.message = message;
    this.metadata = metadata;
    this.statusCode = statusCode;
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: true,
      message: this.message,
      data: this.metadata,
    });
  }
}

class OK extends SuccessResponse {
  constructor(payload = {}) {
    super({ ...payload, statusCode: 200 });
  }
}

class Created extends SuccessResponse {
  constructor(payload = {}) {
    super({ ...payload, statusCode: 201 });
  }
}

module.exports = {
  SuccessResponse,
  OK,
  Created,
};


