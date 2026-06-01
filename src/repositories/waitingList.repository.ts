import { getDatabase, saveDatabase } from '../db/database';
import { IWaitingList } from '../models/entities';

export class WaitingListRepository {
  async findAll(page = 1, limit = 10): Promise<{ data: IWaitingList[]; total: number }> {
    const db = await getDatabase();
    const offset = (page - 1) * limit;
    
    const countResult = db.exec('SELECT COUNT(*) as total FROM waiting_list');
    const total = countResult[0]?.values[0][0] as number || 0;
    
    const result = db.exec(
      `SELECT * FROM waiting_list ORDER BY priority_score DESC, wait_start_time ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    return { data: this.mapResults(result), total };
  }

  async findById(id: string): Promise<IWaitingList | null> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM waiting_list WHERE id = ?', [id]);
    const data = this.mapResults(result);
    return data[0] || null;
  }

  async findByStatus(status: string): Promise<IWaitingList[]> {
    const db = await getDatabase();
    const result = db.exec(
      `SELECT * FROM waiting_list WHERE status = ? ORDER BY priority_score DESC, position ASC`,
      [status]
    );
    return this.mapResults(result);
  }

  async create(data: Omit<IWaitingList, 'id' | 'created_at' | 'updated_at'>): Promise<IWaitingList> {
    const db = await getDatabase();
    const id = `WL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO waiting_list (id, code, name, member_id, booking_id, priority_score, wait_start_time, estimated_wait_minutes, status, position, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.code, data.name, data.member_id, data.booking_id, data.priority_score || 0,
       data.wait_start_time, data.estimated_wait_minutes || 0, data.status || 'waiting',
       data.position || 0, data.owner_name, data.batch_id, data.remark, now, now]
    );
    
    await saveDatabase();
    return this.findById(id) as Promise<IWaitingList>;
  }

  async updatePositions(): Promise<void> {
    const db = await getDatabase();
    const waitingItems = this.findByStatus('waiting');
    
    let position = 1;
    for (const item of await waitingItems) {
      db.run('UPDATE waiting_list SET position = ? WHERE id = ?', [position++, item.id]);
    }
    
    await saveDatabase();
  }

  async update(id: string, data: Partial<IWaitingList>): Promise<IWaitingList | null> {
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
    
    db.run(`UPDATE waiting_list SET ${fields.join(', ')} WHERE id = ?`, values);
    await saveDatabase();
    
    return this.findById(id);
  }

  private mapResults(result: any[]): IWaitingList[] {
    if (!result.length) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj as IWaitingList;
    });
  }
}
