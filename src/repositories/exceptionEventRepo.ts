import { getDatabase } from '../db/database';
import { ExceptionEvent, ExceptionEventCreate, ExceptionEventUpdate } from '../models/exceptionEvent';

export class ExceptionEventRepo {
  private get db() {
    return getDatabase();
  }

  findAll(): ExceptionEvent[] {
    return this.db.prepare('SELECT * FROM exception_event ORDER BY id DESC').all() as ExceptionEvent[];
  }

  findById(id: number): ExceptionEvent | undefined {
    return this.db.prepare('SELECT * FROM exception_event WHERE id = ?').get(id) as ExceptionEvent | undefined;
  }

  findByCode(code: string): ExceptionEvent | undefined {
    return this.db.prepare('SELECT * FROM exception_event WHERE code = ?').get(code) as ExceptionEvent | undefined;
  }

  create(data: ExceptionEventCreate): ExceptionEvent {
    const stmt = this.db.prepare(`
      INSERT INTO exception_event (code, name, status, responsible_person, entity_type, entity_id, trigger_field, threshold_value, handler, handling_deadline, batch_no, remark)
      VALUES (@code, @name, @status, @responsible_person, @entity_type, @entity_id, @trigger_field, @threshold_value, @handler, @handling_deadline, @batch_no, @remark)
    `);
    const result = stmt.run(data);
    return this.findById(result.lastInsertRowid as number)!;
  }

  update(id: number, data: ExceptionEventUpdate): ExceptionEvent {
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return this.findById(id)!;
    fields.push("updated_at = datetime('now', 'localtime')");
    values.push(id);
    this.db.prepare(`UPDATE exception_event SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id)!;
  }

  findByEntity(entityType: string, entityId: number): ExceptionEvent[] {
    return this.db.prepare(
      'SELECT * FROM exception_event WHERE entity_type = ? AND entity_id = ? ORDER BY id DESC'
    ).all(entityType, entityId) as ExceptionEvent[];
  }

  findByStatus(status: string): ExceptionEvent[] {
    return this.db.prepare('SELECT * FROM exception_event WHERE status = ? ORDER BY id DESC').all(status) as ExceptionEvent[];
  }

  findPending(): ExceptionEvent[] {
    return this.db.prepare("SELECT * FROM exception_event WHERE status IN ('pending', 'handling') ORDER BY handling_deadline ASC").all() as ExceptionEvent[];
  }
}
