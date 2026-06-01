import { AuditLogRepo } from '../repositories/auditLogRepo';
import { AuditLog } from '../models/auditLog';

const auditLogRepo = new AuditLogRepo();

export class AuditLogService {
  getAll(limit: number = 100, offset: number = 0): AuditLog[] {
    return auditLogRepo.findAll(limit, offset);
  }

  getByEntityType(entityType: string): AuditLog[] {
    return auditLogRepo.findByEntityType(entityType);
  }

  getByEntityId(entityType: string, entityId: number): AuditLog[] {
    return auditLogRepo.findByEntityId(entityType, entityId);
  }

  getByOperator(operator: string): AuditLog[] {
    return auditLogRepo.findByOperator(operator);
  }

  getByDateRange(startDate: string, endDate: string): AuditLog[] {
    return auditLogRepo.findByDateRange(startDate, endDate);
  }

  count(): number {
    return auditLogRepo.count();
  }
}
