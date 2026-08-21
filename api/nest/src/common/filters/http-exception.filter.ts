import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import type { ApiResponse } from '@smart-campus/shared';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Hệ thống đang bận. Vui lòng thử lại sau.';

    let code: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const body = exceptionResponse as {
          message?: string | string[];
          code?: string;
        };
        const rawMessage = body.message;
        message = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage || message;
        code = typeof body.code === 'string' ? body.code : undefined;
      }
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      data: null,
      message: Array.isArray(message) ? message.join(', ') : message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      ...(code ? { code } : {}),
    };

    response.status(status).json(errorResponse);
  }
}
