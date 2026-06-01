import { getDatabase } from '../db/database';
import { StatusFlowRecord, StatusFlowRecordCreate } from '../models/statusFlowRecord';

export class StatusFlowRecordRepo {
  private get db() {
    return getDatabase();
  }

  findAll(): StatusFlowRecord[] {
    return this.db.prepare('SELECT * FROM status_flow_record ORDER BY id DESC').all() as StatusFlowRecord[];
  }

  findById(id: number): StatusFlowRecord | undefined {
    return this.db.prepare('SELECT * FROM status_flow_record WHERE id = ?').get(id) as StatusFlowRecord | undefined;
  }

  create(data: StatusFlowRecordCreate): StatusFlowRecord {
    const stmt = this.db.prepare(`
      INSERT INTO status_flow_record (code, name, status, responsible_person, entity_type, entity_id, from_status, to_status, action, reject_reason, batch_no, remark)
      VALUES (@code, @name, @status, @responsible_person, @entity_type, @entity_id, @from_status, @to_status, @action, @reject_reason, @batch_no, @remark)
    `);
    const result = stmt.run(data);
    return this.findById(result.lastInsertRowid as number)!;
  }

  findByEntity(entityType: string, entityId: number): StatusFlowRecord[] {
    return this.db.prepare(
      'SELECT * FROM status_flow_record WHERE entity_type = ? AND entity_id = ? ORDER BY id ASC'
    ).all(entityType, entityId) as StatusFlowRecord[];
  }

  findByEntityType(entityType: string): StatusFlowRecord[] {
    return this.db.prepare(
      'SELECT * FROM status_flow_record WHERE entity_type = ? ORDER BY id DESC'
    ).all(entityType) as StatusFlowRecord[];
  }
}
