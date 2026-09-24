class ApiError extends Error {
    statusCode: number;
    success: boolean;
    errors: any[];
    data: string;
  
    constructor(
      statusCode: number,
      message = "Internal server error",
      errors: any[] = [],
      stack = ""
    ) {
      super(message);
  
      this.statusCode = statusCode;
      this.success = false;
      this.data = message;
      this.errors = errors;
  
      if (stack) {
        this.stack = stack;
      } else {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }

export default ApiError;