/**
 * Custom API error class with status code
 */
export class AppError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number = 500, data?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.data = data;
  }
}
