import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip } = request;
    const userAgent = request.get('user-agent') || '';

    // Only audit mutating HTTP methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const previousState = request.body ? { ...request.body } : null;

    return next.handle().pipe(
      tap(async (responseBody) => {
        try {
          let action = method;
          if (method === 'POST') action = 'CREATE';
          if (method === 'PUT' || method === 'PATCH') action = 'UPDATE';
          if (method === 'DELETE') action = 'DELETE';

          // Extract entity name from URL path
          const urlSegments = url.split('?')[0].split('/').filter(Boolean);
          const entityName = urlSegments[0] ? urlSegments[0].toUpperCase() : 'UNKNOWN';
          const entityId = responseBody?.id || request.params?.id || null;

          await this.auditService.logEvent({
            userId: user?.id,
            userEmail: user?.email,
            userRole: user?.role,
            action,
            entityName,
            entityId,
            previousState,
            newState: responseBody,
            ipAddress: ip,
            userAgent,
          });
        } catch (err) {
          console.error('Audit interceptor error:', err);
        }
      }),
    );
  }
}
