import { ExceptionEventRepo } from '../repositories/exceptionEventRepo';
import { MemberBenefitRepo } from '../repositories/memberBenefitRepo';
import { AuditLogRepo } from '../repositories/auditLogRepo';
import { ExceptionEvent, ExceptionEventCreate } from '../models/exceptionEvent';
import { NotFoundError } from '../utils/errors';
import { ExceptionCheckResult } from '../schemas';

const exceptionEventRepo = new ExceptionEventRepo();
const memberBenefitRepo = new MemberBenefitRepo();
const auditLogRepo = new AuditLogRepo();

export class ExceptionService {
  getAll(): ExceptionEvent[] {
    return exceptionEventRepo.findAll();
  }

  getById(id: number): ExceptionEvent {
    const item = exceptionEventRepo.findById(id);
    if (!item) throw new NotFoundError('ExceptionEvent', id);
    return item;
  }

  checkExpiredBenefits(operator: string = 'system'): ExceptionCheckResult {
    const today = new Date().toISOString().slice(0, 10);
    const expiredBenefits = memberBenefitRepo.findExpired(today);

    const events: ExceptionCheckResult['events'] = [];

    for (const benefit of expiredBenefits) {
      const existingEvents = exceptionEventRepo.findByEntity('member_benefit', benefit.id);
      const alreadyHasPending = existingEvents.some(e => e.status === 'pending' || e.status === 'handling');

      if (alreadyHasPending) continue;

      const event = exceptionEventRepo.create({
        code: `EXC-EXP-${Date.now()}-${benefit.id}`,
        name: `权益过期异常-${benefit.code}`,
        status: 'pending',
        responsible_person: benefit.responsible_person,
        entity_type: 'member_benefit',
        entity_id: benefit.id,
        trigger_field: 'expiry_date',
        threshold_value: today,
        handler: benefit.responsible_person,
        handling_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        batch_no: benefit.batch_no,
        remark: `会员权益 ${benefit.code} 已于 ${benefit.expiry_date} 过期，需处理`,
      });

      events.push({
        id: event.id,
        code: event.code,
        entity_type: event.entity_type,
        entity_id: event.entity_id,
        trigger_field: event.trigger_field,
        threshold_value: event.threshold_value,
      });

      auditLogRepo.create({
        code: `AUD-EXC-${Date.now()}-${benefit.id}`,
        action: 'check_expired',
        entity_type: 'exception_event',
        entity_id: event.id,
        operator,
        detail: `Detected expired benefit: ${benefit.code}, expiry_date: ${benefit.expiry_date}`,
      });
    }

    return {
      found: events.length,
      events,
    };
  }

  handleException(id: number, handler: string, action: 'handling' | 'resolved' | 'closed', operator: string = 'system'): ExceptionEvent {
    const event = exceptionEventRepo.findById(id);
    if (!event) throw new NotFoundError('ExceptionEvent', id);

    const updated = exceptionEventRepo.update(id, {
      status: action,
      handler,
    } as any);

    auditLogRepo.create({
      code: `AUD-EXC-HDL-${Date.now()}`,
      action: `handle_exception_${action}`,
      entity_type: 'exception_event',
      entity_id: id,
      operator,
      detail: `Exception event ${event.code} status changed to ${action} by ${handler}`,
    });

    return updated;
  }

  getPending(): ExceptionEvent[] {
    return exceptionEventRepo.findPending();
  }

  getByEntity(entityType: string, entityId: number): ExceptionEvent[] {
    return exceptionEventRepo.findByEntity(entityType, entityId);
  }
}
