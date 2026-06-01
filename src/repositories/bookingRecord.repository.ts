import { getDatabase, saveDatabase } from '../db/database';
import { IBookingRecord } from '../models/entities';

export class BookingRecordRepository {
  async findAll(page = 1, limit = 10): Promise<{ data: IBookingRecord[]; total: number }> {
    const db = await getDatabase();
    const offset = (page - 1) * limit;
    
    const countResult = db.exec('SELECT COUNT(*) as total FROM booking_records');
    const total = countResult[0]?.values[0][0] as number || 0;
    
    const result = db.exec(
      `SELECT * FROM booking_records ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    return { data: this.mapResults(result), total };
  }

  async findById(id: string): Promise<IBookingRecord | null> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM booking_records WHERE id = ?', [id]);
    const data = this.mapResults(result);
    return data[0] || null;
  }

  async findByCode(code: string): Promise<IBookingRecord | null> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM booking_records WHERE code = ?', [code]);
    const data = this.mapResults(result);
    return data[0] || null;
  }

  async findByMemberId(memberId: string): Promise<IBookingRecord[]> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM booking_records WHERE member_id = ?', [memberId]);
    return this.mapResults(result);
  }

  async create(data: Omit<IBookingRecord, 'id' | 'created_at' | 'updated_at'>): Promise<IBookingRecord> {
    const db = await getDatabase();
    const id = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO booking_records (id, code, name, member_id, flight_number, flight_date, lounge_id, status, companion_count, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.code, data.name, data.member_id, data.flight_number, data.flight_date, data.lounge_id,
       data.status || 'draft', data.companion_count || 0, data.owner_name, data.batch_id, 
       data.remark, now, now]
    );
    
    await saveDatabase();
    return this.findById(id) as Promise<IBookingRecord>;
  }

  async update(id: string, data: Partial<IBookingRecord>): Promise<IBookingRecord | null> {
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
    
    db.run(`UPDATE booking_records SET ${fields.join(', ')} WHERE id = ?`, values);
    await saveDatabase();
    
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    db.run('DELETE FROM booking_records WHERE id = ?', [id]);
    await saveDatabase();
    return true;
  }

  private mapResults(result: any[]): IBookingRecord[] {
    if (!result.length) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj as IBookingRecord;
    });
  }
}
