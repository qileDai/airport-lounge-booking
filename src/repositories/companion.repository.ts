import { getDatabase, saveDatabase } from '../db/database';
import { ICompanion } from '../models/entities';

export class CompanionRepository {
  async findAll(page = 1, limit = 10): Promise<{ data: ICompanion[]; total: number }> {
    const db = await getDatabase();
    const offset = (page - 1) * limit;
    
    const countResult = db.exec('SELECT COUNT(*) as total FROM companions');
    const total = countResult[0]?.values[0][0] as number || 0;
    
    const result = db.exec(
      `SELECT * FROM companions ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    return { data: this.mapResults(result), total };
  }

  async findById(id: string): Promise<ICompanion | null> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM companions WHERE id = ?', [id]);
    const data = this.mapResults(result);
    return data[0] || null;
  }

  async findByBookingId(bookingId: string): Promise<ICompanion[]> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM companions WHERE booking_id = ?', [bookingId]);
    return this.mapResults(result);
  }

  async create(data: Omit<ICompanion, 'id' | 'created_at' | 'updated_at'>): Promise<ICompanion> {
    const db = await getDatabase();
    const id = `CP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO companions (id, code, name, booking_id, id_type, id_number, relationship, status, is_verified, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.code, data.name, data.booking_id, data.id_type, data.id_number,
       data.relationship, data.status || 'pending', data.is_verified ? 1 : 0, 
       data.owner_name, data.batch_id, data.remark, now, now]
    );
    
    await saveDatabase();
    return this.findById(id) as Promise<ICompanion>;
  }

  async update(id: string, data: Partial<ICompanion>): Promise<ICompanion | null> {
    const db = await getDatabase();
    const existing = await this.findById(id);
    if (!existing) return null;
    
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && key !== 'created_at') {
        if (key === 'is_verified') {
          fields.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    }
    
    if (fields.length === 0) return existing;
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    db.run(`UPDATE companions SET ${fields.join(', ')} WHERE id = ?`, values);
    await saveDatabase();
    
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    db.run('DELETE FROM companions WHERE id = ?', [id]);
    await saveDatabase();
    return true;
  }

  private mapResults(result: any[]): ICompanion[] {
    if (!result.length) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        if (col === 'is_verified') {
          obj[col] = row[i] === 1;
        } else {
          obj[col] = row[i];
        }
      });
      return obj as ICompanion;
    });
  }
}
