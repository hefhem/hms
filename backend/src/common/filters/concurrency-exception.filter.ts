import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { OptimisticLockVersionMismatchError } from 'typeorm';

export class ConcurrencyConflictException extends Error {
  constructor(public entityName: string, public entityId: string, public currentVersion: number) {
    super(`Concurrency Conflict: ${entityName} (ID: ${entityId}) has been modified by another transaction. Expected version ${currentVersion}.`);
    this.name = 'ConcurrencyConflictException';
  }
}

@Catch(OptimisticLockVersionMismatchError, ConcurrencyConflictException)
export class ConcurrencyExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = HttpStatus.CONFLICT; // 409 Conflict

    response.status(status).json({
      statusCode: status,
      error: 'Concurrency Conflict (409)',
      message:
        exception.message ||
        'The record was updated by another user while you were editing. Please refresh to load the latest state before saving changes.',
      timestamp: new Date().toISOString(),
    });
  }
}
