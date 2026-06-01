import { getDatabase, saveDatabase } from '../db/database';
import { IUsageVoucher } from '../models/entities';

export class UsageVoucherRepository {
  async findAll(page = 1, limit = 10): Promise<{ data: IUsageVoucher[]; total: number }> {
    const db = await getDatabase();
    const offset = (page - 1) * limit;
    
    const countResult = db.exec('SELECT COUNT(*) as total FROM usage_vouchers');
    const total = countResult[0]?.values[0][0] as number || 0;
    
    const result = db.exec(
      `SELECT * FROM usage_vouchers ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    return { data: this.mapResults(result), total };
  }

  async findById(id: string): Promise<IUsageVoucher | null> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM usage_vouchers WHERE id = ?', [id]);
    const data = this.mapResults(result);
    return data[0] || null;
  }

  async findByBookingId(bookingId: string): Promise<IUsageVoucher[]> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM usage_vouchers WHERE booking_id = ?', [bookingId]);
    return this.mapResults(result);
  }

  async create(data: Omit<IUsageVoucher, 'id' | 'created_at' | 'updated_at'>): Promise<IUsageVoucher> {
    const db = await getDatabase();
    const id = `UV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO usage_vouchers (id, code, name, voucher_type, booking_id, member_id, status, issued_at, used_at, expire_at, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.code, data.name, data.voucher_type, data.booking_id, data.member_id,
       data.status || 'valid', data.issued_at, data.used_at, data.expire_at,
       data.owner_name, data.batch_id, data.remark, now, now]
    );
    
    await saveDatabase();
    return this.findById(id) as Promise<IUsageVoucher>;
  }

  async update(id: string, data: Partial<IUsageVoucher>): Promise<IUsageVoucher | null> {
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
    
    db.run(`UPDATE usage_vouchers SET ${fields.join(', ')} WHERE id = ?`, values);
    await saveDatabase();
    
    return this.findById(id);
  }

  private mapResults(result: any[]): IUsageVoucher[] {
    if (!result.length) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj as IUsageVoucher;
    });
  }
}
