import { UsageVoucher, UsageVoucherCreate, UsageVoucherUpdate } from '../models/usageVoucher';
import { queryAll, queryOne, insertAndGetId, runChanges } from '../utils/dbHelper';

export class UsageVoucherRepo {
  findAll(): UsageVoucher[] {
    return queryAll<UsageVoucher>('SELECT * FROM usage_voucher ORDER BY id DESC');
  }

  findById(id: number): UsageVoucher | undefined {
    return queryOne<UsageVoucher>('SELECT * FROM usage_voucher WHERE id = ?', [id]);
  }

  findByCode(code: string): UsageVoucher | undefined {
    return queryOne<UsageVoucher>('SELECT * FROM usage_voucher WHERE code = ?', [code]);
  }

  create(data: UsageVoucherCreate): UsageVoucher {
    const id = insertAndGetId(
      `INSERT INTO usage_voucher (code, name, status, responsible_person, reservation_id, voucher_type, issued_at, used_at, batch_no, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.code, data.name, data.status, data.responsible_person, data.reservation_id, data.voucher_type, data.issued_at, data.used_at, data.batch_no, data.remark]
    );
    return this.findById(id)!;
  }

  update(id: number, data: UsageVoucherUpdate): UsageVoucher {
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
    runChanges(`UPDATE usage_voucher SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id)!;
  }

  delete(id: number): boolean {
    return runChanges('DELETE FROM usage_voucher WHERE id = ?', [id]) > 0;
  }

  findByReservationId(reservationId: number): UsageVoucher[] {
    return queryAll<UsageVoucher>('SELECT * FROM usage_voucher WHERE reservation_id = ?', [reservationId]);
  }

  countUsed(): number {
    const row = queryOne<any>("SELECT COUNT(*) as cnt FROM usage_voucher WHERE status = 'used'");
    return row ? row.cnt : 0;
  }

  countIssued(): number {
    const row = queryOne<any>("SELECT COUNT(*) as cnt FROM usage_voucher WHERE status = 'issued'");
    return row ? row.cnt : 0;
  }

  countTotal(): number {
    const row = queryOne<any>('SELECT COUNT(*) as cnt FROM usage_voucher');
    return row ? row.cnt : 0;
  }
}
