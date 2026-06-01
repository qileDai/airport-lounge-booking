import { getDatabase, saveDatabase } from '../db/database';
import { IExceptionEvent } from '../models/entities';

export class ExceptionEventRepository {
  async findAll(page = 1, limit = 10, status?: string): Promise<{ data: IExceptionEvent[]; total: number }> {
    const db = await getDatabase();
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const params: any[] = [];
    
    if (status) {
      whereClause = ' WHERE status = ?';
      params.push(status);
    }
    
    const countResult = db.exec(`SELECT COUNT(*) as total FROM exception_events${whereClause}`, params);
    const total = countResult[0]?.values[0][0] as number || 0;
    
    params.push(limit, offset);
    const result = db.exec(
      `SELECT * FROM exception_events${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      params
    );
    
    return { data: this.mapResults(result), total };
  }

  async findById(id: string): Promise<IExceptionEvent | null> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM exception_events WHERE id = ?', [id]);
    const data = this.mapResults(result);
    return data[0] || null;
  }

  async findByStatus(status: string): Promise<IExceptionEvent[]> {
    const db = await getDatabase();
    const result = db.exec(
      `SELECT * FROM exception_events WHERE status = ? ORDER BY severity DESC, created_at DESC`,
      [status]
    );
    return this.mapResults(result);
  }

  async findOpenExceptions(): Promise<IExceptionEvent[]> {
    const db = await getDatabase();
    const result = db.exec(
      "SELECT * FROM exception_events WHERE status IN ('open', 'in_progress') ORDER BY severity DESC, deadline ASC"
    );
    return this.mapResults(result);
  }

  async create(data: Omit<IExceptionEvent, 'id' | 'created_at' | 'updated_at'>): Promise<IExceptionEvent> {
    const db = await getDatabase();
    const id = `EE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO exception_events (id, code, name, exception_type, severity, source_entity_type, source_entity_id, trigger_field, threshold_value, actual_value, handler_name, deadline, status, resolution, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.code, data.name, data.exception_type, data.severity || 'medium',
       data.source_entity_type, data.source_entity_id, data.trigger_field,
       data.threshold_value, data.actual_value, data.handler_name, data.deadline,
       data.status || 'open', data.resolution, data.owner_name, data.batch_id,
       data.remark, now, now]
    );
    
    await saveDatabase();
    return this.findById(id) as Promise<IExceptionEvent>;
  }

  async update(id: string, data: Partial<IExceptionEvent>): Promise<IExceptionEvent | null> {
    const db = await getDatabase();
    const existing = await this.findById(id);
    if (!existing) return null;
    
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) return existing;
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    db.run(`UPDATE exception_events SET ${fields.join(', ')} WHERE id = ?`, values);
    await saveDatabase();
    
    return this.findById(id);
  }

  async getStatistics(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number
  }> {
    const db = await getDatabase();
    
    const totalResult = db.exec('SELECT COUNT(*) as count FROM exception_events');
    const openResult = db.exec("SELECT COUNT(*) as count FROM exception_events WHERE status = 'open'");
    const inProgressResult = db.exec("SELECT COUNT(*) as count FROM exception_events WHERE status = 'in_progress'");
    const resolvedResult = db.exec("SELECT COUNT(*) as count FROM exception_events WHERE status = 'resolved'");
    const closedResult = db.exec("SELECT COUNT(*) as count FROM exception_events WHERE status = 'closed'");
    
    return {
      total: totalResult[0]?.values[0][0] as number || 0,
      open: openResult[0]?.values[0][0] as number || 0,
      inProgress: inProgressResult[0]?.values[0][0] as number || 0,
      resolved: resolvedResult[0]?.values[0][0] as number || 0,
      closed: closedResult[0]?.values[0][0] as number || 0
    };
  }

  private mapResults(result: any[]): IExceptionEvent[] {
    if (!result.length) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj as IExceptionEvent;
    });
  }
}
