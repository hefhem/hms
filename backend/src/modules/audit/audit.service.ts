import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async logEvent(params: {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    action: string;
    entityName: string;
    entityId?: string;
    previousState?: any;
    newState?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const entry = this.auditRepository.create(params);
    return await this.auditRepository.save(entry);
  }

  async findAll(query?: { entityName?: string; action?: string; userId?: string }): Promise<AuditLog[]> {
    const qb = this.auditRepository.createQueryBuilder('audit').orderBy('audit.timestamp', 'DESC');

    if (query?.entityName) {
      qb.andWhere('audit.entityName = :entityName', { entityName: query.entityName });
    }
    if (query?.action) {
      qb.andWhere('audit.action = :action', { action: query.action });
    }
    if (query?.userId) {
      qb.andWhere('audit.userId = :userId', { userId: query.userId });
    }

    return await qb.take(200).getMany();
  }

  async findByEntity(entityName: string, entityId: string): Promise<AuditLog[]> {
    return await this.auditRepository.find({
      where: { entityName, entityId },
      order: { timestamp: 'DESC' },
    });
  }
}
