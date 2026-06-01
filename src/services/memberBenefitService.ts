import { MemberBenefitRepo } from '../repositories/memberBenefitRepo';
import { AuditLogRepo } from '../repositories/auditLogRepo';
import { MemberBenefit, MemberBenefitCreate, MemberBenefitUpdate } from '../models/memberBenefit';
import { NotFoundError, ValidationError } from '../utils/errors';

const memberBenefitRepo = new MemberBenefitRepo();
const auditLogRepo = new AuditLogRepo();

export class MemberBenefitService {
  getAll(): MemberBenefit[] {
    return memberBenefitRepo.findAll();
  }

  getById(id: number): MemberBenefit {
    const item = memberBenefitRepo.findById(id);
    if (!item) throw new NotFoundError('MemberBenefit', id);
    return item;
  }

  create(data: MemberBenefitCreate, operator: string = 'system'): MemberBenefit {
    if (!data.code || !data.name) {
      throw new ValidationError('code and name are required');
    }
    const existing = memberBenefitRepo.findByCode(data.code);
    if (existing) {
      throw new ValidationError(`MemberBenefit with code '${data.code}' already exists`);
    }
    if (data.remaining_quota < 0 || data.total_quota < 0) {
      throw new ValidationError('quota cannot be negative');
    }
    if (data.remaining_quota > data.total_quota) {
      throw new ValidationError('remaining_quota cannot exceed total_quota');
    }
    const item = memberBenefitRepo.create(data);
    auditLogRepo.create({
      code: `AUD-MB-${Date.now()}`,
      action: 'create',
      entity_type: 'member_benefit',
      entity_id: item.id,
      operator,
      detail: `Created member benefit: ${item.code} - ${item.name}`,
    });
    return item;
  }

  update(id: number, data: MemberBenefitUpdate, operator: string = 'system'): MemberBenefit {
    const existing = memberBenefitRepo.findById(id);
    if (!existing) throw new NotFoundError('MemberBenefit', id);
    if (data.remaining_quota !== undefined && data.total_quota !== undefined) {
      if (data.remaining_quota > data.total_quota) {
        throw new ValidationError('remaining_quota cannot exceed total_quota');
      }
    }
    const item = memberBenefitRepo.update(id, data);
    auditLogRepo.create({
      code: `AUD-MB-${Date.now()}`,
      action: 'update',
      entity_type: 'member_benefit',
      entity_id: id,
      operator,
      detail: `Updated member benefit: ${item.code}`,
    });
    return item;
  }

  delete(id: number, operator: string = 'system'): boolean {
    const existing = memberBenefitRepo.findById(id);
    if (!existing) throw new NotFoundError('MemberBenefit', id);
    const result = memberBenefitRepo.delete(id);
    auditLogRepo.create({
      code: `AUD-MB-${Date.now()}`,
      action: 'delete',
      entity_type: 'member_benefit',
      entity_id: id,
      operator,
      detail: `Deleted member benefit: ${existing.code}`,
    });
    return result;
  }

  getExpired(currentDate?: string): MemberBenefit[] {
    const date = currentDate || new Date().toISOString().slice(0, 10);
    return memberBenefitRepo.findExpired(date);
  }
}
