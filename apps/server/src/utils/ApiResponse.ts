class ApiResponse<T = any> {
    statusCode: number;
    message: string;
    data: T | null;
    success: boolean;
  
    constructor(
      statusCode: number,
      message?: string,
      data: T | null = null
    ) {
      this.statusCode = statusCode;
      this.success = statusCode < 400;
      this.message = message ?? (this.success ? "Success" : "Error");
      this.data = data;
    }
  }
  
  export default ApiResponse;
  