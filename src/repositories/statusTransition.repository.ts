import { getDatabase, saveDatabase } from '../db/database';
import { IStatusTransition } from '../models/entities';

export class StatusTransitionRepository {
  async findAll(page = 1, limit = 50, entityType?: string, entityId?: string): Promise<{ data: IStatusTransition[]; total: number }> {
    const db = await getDatabase();
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const params: any[] = [];
    
    if (entityType) {
      whereClause += ' WHERE entity_type = ?';
      params.push(entityType);
    }
    
    if (entityId) {
      whereClause += entityType ? ' AND entity_id = ?' : ' WHERE entity_id = ?';
      params.push(entityId);
    }
    
    const countResult = db.exec(`SELECT COUNT(*) as total FROM status_transitions${whereClause}`, params);
    const total = countResult[0]?.values[0][0] as number || 0;
    
    params.push(limit, offset);
    const result = db.exec(
      `SELECT * FROM status_transitions${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      params
    );
    
    return { data: this.mapResults(result), total };
  }

  async create(data: Omit<IStatusTransition, 'id' | 'created_at'>): Promise<IStatusTransition> {
    const db = await getDatabase();
    const id = `ST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO status_transitions (id, entity_type, entity_id, from_status, to_status, action, reason, operator_name, owner_name, batch_id, remark, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.entity_type, data.entity_id, data.from_status, data.to_status,
       data.action, data.reason, data.operator_name, data.owner_name,
       data.batch_id, data.remark, now]
    );
    
    await saveDatabase();
    
    const result = db.exec('SELECT * FROM status_transitions WHERE id = ?', [id]);
    return this.mapResults(result)[0];
  }

  async getEntityHistory(entityType: string, entityId: string): Promise<IStatusTransition[]> {
    const db = await getDatabase();
    const result = db.exec(
      `SELECT * FROM status_transitions WHERE entity_type = ? AND entity_id = ? ORDER BY created_at ASC`,
      [entityType, entityId]
    );
    return this.mapResults(result);
  }

  private mapResults(result: any[]): IStatusTransition[] {
    if (!result.length) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj as IStatusTransition;
    });
  }
}
