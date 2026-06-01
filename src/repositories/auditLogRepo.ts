import { getDatabase } from '../db/database';
import { AuditLog, AuditLogCreate } from '../models/auditLog';

export class AuditLogRepo {
  private get db() {
    return getDatabase();
  }

  findAll(limit: number = 100, offset: number = 0): AuditLog[] {
    return this.db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ? OFFSET ?').all(limit, offset) as AuditLog[];
  }

  findById(id: number): AuditLog | undefined {
    return this.db.prepare('SELECT * FROM audit_log WHERE id = ?').get(id) as AuditLog | undefined;
  }

  create(data: AuditLogCreate): AuditLog {
    const stmt = this.db.prepare(`
      INSERT INTO audit_log (code, action, entity_type, entity_id, operator, detail)
      VALUES (@code, @action, @entity_type, @entity_id, @operator, @detail)
    `);
    const result = stmt.run(data);
    return this.findById(result.lastInsertRowid as number)!;
  }

  findByEntityType(entityType: string): AuditLog[] {
    return this.db.prepare('SELECT * FROM audit_log WHERE entity_type = ? ORDER BY id DESC').all(entityType) as AuditLog[];
  }

  findByEntityId(entityType: string, entityId: number): AuditLog[] {
    return this.db.prepare('SELECT * FROM audit_log WHERE entity_type = ? AND entity_id = ? ORDER BY id DESC').all(entityType, entityId) as AuditLog[];
  }

  findByOperator(operator: string): AuditLog[] {
    return this.db.prepare('SELECT * FROM audit_log WHERE operator = ? ORDER BY id DESC').all(operator) as AuditLog[];
  }

  findByDateRange(startDate: string, endDate: string): AuditLog[] {
    return this.db.prepare(
      'SELECT * FROM audit_log WHERE created_at >= ? AND created_at <= ? ORDER BY id DESC'
    ).all(startDate, endDate) as AuditLog[];
  }

  count(): number {
    const row = this.db.prepare('SELECT COUNT(*) as cnt FROM audit_log').get() as any;
    return row.cnt;
  }
}
