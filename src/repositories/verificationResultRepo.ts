import { VerificationResult, VerificationResultCreate, VerificationResultUpdate } from '../models/verificationResult';
import { queryAll, queryOne, insertAndGetId, runChanges } from '../utils/dbHelper';

export class VerificationResultRepo {
  findAll(): VerificationResult[] {
    return queryAll<VerificationResult>('SELECT * FROM verification_result ORDER BY id DESC');
  }

  findById(id: number): VerificationResult | undefined {
    return queryOne<VerificationResult>('SELECT * FROM verification_result WHERE id = ?', [id]);
  }

  findByCode(code: string): VerificationResult | undefined {
    return queryOne<VerificationResult>('SELECT * FROM verification_result WHERE code = ?', [code]);
  }

  create(data: VerificationResultCreate): VerificationResult {
    const id = insertAndGetId(
      `INSERT INTO verification_result (code, name, status, responsible_person, reservation_id, member_benefit_id, result, fail_reason, batch_no, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.code, data.name, data.status, data.responsible_person, data.reservation_id, data.member_benefit_id, data.result, data.fail_reason, data.batch_no, data.remark]
    );
    return this.findById(id)!;
  }

  update(id: number, data: VerificationResultUpdate): VerificationResult {
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
    runChanges(`UPDATE verification_result SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id)!;
  }

  delete(id: number): boolean {
    return runChanges('DELETE FROM verification_result WHERE id = ?', [id]) > 0;
  }

  countByResult(resultValue: string): number {
    const row = queryOne<any>('SELECT COUNT(*) as cnt FROM verification_result WHERE result = ?', [resultValue]);
    return row ? row.cnt : 0;
  }

  countTotal(): number {
    const row = queryOne<any>('SELECT COUNT(*) as cnt FROM verification_result');
    return row ? row.cnt : 0;
  }

  findByDateRange(startDate: string, endDate: string): VerificationResult[] {
    return queryAll<VerificationResult>(
      'SELECT * FROM verification_result WHERE created_at >= ? AND created_at <= ? ORDER BY id DESC',
      [startDate, endDate]
    );
  }

  findByResponsiblePerson(person: string): VerificationResult[] {
    return queryAll<VerificationResult>(
      'SELECT * FROM verification_result WHERE responsible_person = ? ORDER BY id DESC',
      [person]
    );
  }

  findByBatchNo(batchNo: string): VerificationResult[] {
    return queryAll<VerificationResult>(
      'SELECT * FROM verification_result WHERE batch_no = ? ORDER BY id DESC',
      [batchNo]
    );
  }
}
