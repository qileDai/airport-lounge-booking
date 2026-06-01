import { getDatabase, saveDatabase } from '../db/database';
import { IMemberRights } from '../models/entities';

export class MemberRightsRepository {
  async findAll(page = 1, limit = 10): Promise<{ data: IMemberRights[]; total: number }> {
    const db = await getDatabase();
    const offset = (page - 1) * limit;
    
    const countResult = db.exec('SELECT COUNT(*) as total FROM member_rights');
    const total = countResult[0]?.values[0][0] as number || 0;
    
    const result = db.exec(
      `SELECT * FROM member_rights ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const data = this.mapResults(result);
    return { data, total };
  }

  async findById(id: string): Promise<IMemberRights | null> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM member_rights WHERE id = ?', [id]);
    const data = this.mapResults(result);
    return data[0] || null;
  }

  async findByCode(code: string): Promise<IMemberRights | null> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM member_rights WHERE code = ?', [code]);
    const data = this.mapResults(result);
    return data[0] || null;
  }

  async create(data: Omit<IMemberRights, 'id' | 'created_at' | 'updated_at'>): Promise<IMemberRights> {
    const db = await getDatabase();
    const id = `MR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO member_rights (id, code, name, member_level, status, remaining_quota, total_quota, valid_from, valid_to, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.code, data.name, data.member_level, data.status || 'active', data.remaining_quota || 0, 
       data.total_quota || 0, data.valid_from, data.valid_to, data.owner_name, data.batch_id, 
       data.remark, now, now]
    );
    
    await saveDatabase();
    return this.findById(id) as Promise<IMemberRights>;
  }

  async update(id: string, data: Partial<IMemberRights>): Promise<IMemberRights | null> {
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
    
    db.run(`UPDATE member_rights SET ${fields.join(', ')} WHERE id = ?`, values);
    await saveDatabase();
    
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    db.run('DELETE FROM member_rights WHERE id = ?', [id]);
    await saveDatabase();
    return true;
  }

  async findByStatus(status: string): Promise<IMemberRights[]> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM member_rights WHERE status = ?', [status]);
    return this.mapResults(result);
  }

  async findByMemberLevel(level: string): Promise<IMemberRights[]> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM member_rights WHERE member_level = ?', [level]);
    return this.mapResults(result);
  }

  private mapResults(result: any[]): IMemberRights[] {
    if (!result.length) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj as IMemberRights;
    });
  }
}
