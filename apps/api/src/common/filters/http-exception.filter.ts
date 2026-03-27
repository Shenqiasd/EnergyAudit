import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

import type { FastifyReply } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const error =
      exception instanceof HttpException
        ? exception.name
        : 'InternalServerError';

    if (statusCode >= 500) {
      this.logger.error(
        `${statusCode} ${error}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    void response.status(statusCode).send({
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
