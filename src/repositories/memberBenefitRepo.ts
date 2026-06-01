import { MemberBenefit, MemberBenefitCreate, MemberBenefitUpdate } from '../models/memberBenefit';
import { queryAll, queryOne, insertAndGetId, runChanges } from '../utils/dbHelper';

export class MemberBenefitRepo {
  findAll(): MemberBenefit[] {
    return queryAll<MemberBenefit>('SELECT * FROM member_benefit ORDER BY id DESC');
  }

  findById(id: number): MemberBenefit | undefined {
    return queryOne<MemberBenefit>('SELECT * FROM member_benefit WHERE id = ?', [id]);
  }

  findByCode(code: string): MemberBenefit | undefined {
    return queryOne<MemberBenefit>('SELECT * FROM member_benefit WHERE code = ?', [code]);
  }

  create(data: MemberBenefitCreate): MemberBenefit {
    const id = insertAndGetId(
      `INSERT INTO member_benefit (code, name, status, responsible_person, member_level, remaining_quota, total_quota, effective_date, expiry_date, batch_no, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.code, data.name, data.status, data.responsible_person, data.member_level, data.remaining_quota, data.total_quota, data.effective_date, data.expiry_date, data.batch_no, data.remark]
    );
    return this.findById(id)!;
  }

  update(id: number, data: MemberBenefitUpdate): MemberBenefit {
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
    runChanges(`UPDATE member_benefit SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id)!;
  }

  delete(id: number): boolean {
    return runChanges('DELETE FROM member_benefit WHERE id = ?', [id]) > 0;
  }

  findExpired(currentDate: string): MemberBenefit[] {
    return queryAll<MemberBenefit>(
      "SELECT * FROM member_benefit WHERE expiry_date IS NOT NULL AND expiry_date < ? AND status != 'archived'",
      [currentDate]
    );
  }

  findByStatus(status: string): MemberBenefit[] {
    return queryAll<MemberBenefit>('SELECT * FROM member_benefit WHERE status = ?', [status]);
  }
}
