import { WaitlistRepo } from '../repositories/waitlistRepo';
import { MemberBenefitRepo } from '../repositories/memberBenefitRepo';
import { FlightSlotRepo } from '../repositories/flightSlotRepo';
import { AuditLogRepo } from '../repositories/auditLogRepo';
import { Waitlist, WaitlistCreate } from '../models/waitlist';
import { NotFoundError, ValidationError, BusinessRuleError } from '../utils/errors';

const waitlistRepo = new WaitlistRepo();
const memberBenefitRepo = new MemberBenefitRepo();
const flightSlotRepo = new FlightSlotRepo();
const auditLogRepo = new AuditLogRepo();

export class WaitlistService {
  getAll(): Waitlist[] {
    return waitlistRepo.findAll();
  }

  getById(id: number): Waitlist {
    const item = waitlistRepo.findById(id);
    if (!item) throw new NotFoundError('Waitlist', id);
    return item;
  }

  create(data: WaitlistCreate, operator: string = 'system'): Waitlist {
    if (!data.code || !data.name) {
      throw new ValidationError('code and name are required');
    }
    if (data.member_benefit_id) {
      const benefit = memberBenefitRepo.findById(data.member_benefit_id);
      if (!benefit) throw new ValidationError(`MemberBenefit with id ${data.member_benefit_id} not found`);
    }
    if (data.flight_slot_id) {
      const slot = flightSlotRepo.findById(data.flight_slot_id);
      if (!slot) throw new ValidationError(`FlightSlot with id ${data.flight_slot_id} not found`);
    }
    const item = waitlistRepo.create(data);
    auditLogRepo.create({
      code: `AUD-WTL-${Date.now()}`,
      action: 'create',
      entity_type: 'waitlist',
      entity_id: item.id,
      operator,
      detail: `Created waitlist entry: ${item.code} - ${item.name}`,
    });
    return item;
  }

  arrange(flightSlotId: number, operator: string = 'system'): Waitlist[] {
    const slot = flightSlotRepo.findById(flightSlotId);
    if (!slot) throw new NotFoundError('FlightSlot', flightSlotId);

    const availableCapacity = slot.capacity - slot.used_count;
    if (availableCapacity <= 0) {
      throw new BusinessRuleError(`航班时段 ${slot.code} 容量已满，无法安排候补入场`);
    }

    const waitingList = waitlistRepo.findWaiting().filter(w => w.flight_slot_id === flightSlotId);

    if (waitingList.length === 0) {
      return [];
    }

    const transferred: Waitlist[] = [];
    const transferCount = Math.min(availableCapacity, waitingList.length);

    for (let i = 0; i < transferCount; i++) {
      const entry = waitingList[i];
      const updated = waitlistRepo.update(entry.id, { status: 'transferred' });
      transferred.push(updated);

      if (entry.member_benefit_id) {
        const benefit = memberBenefitRepo.findById(entry.member_benefit_id);
        if (benefit && benefit.remaining_quota > 0) {
          memberBenefitRepo.update(benefit.id, { remaining_quota: benefit.remaining_quota - 1 });
        }
      }

      flightSlotRepo.update(flightSlotId, { used_count: slot.used_count + i + 1 });

      auditLogRepo.create({
        code: `AUD-WTL-ARR-${Date.now()}-${i}`,
        action: 'arrange_waitlist',
        entity_type: 'waitlist',
        entity_id: entry.id,
        operator,
        detail: `Waitlist entry ${entry.code} transferred to flight slot ${slot.code}`,
      });
    }

    return transferred;
  }

  getWaitingByFlightSlot(flightSlotId: number): Waitlist[] {
    return waitlistRepo.findByFlightSlotId(flightSlotId).filter(w => w.status === 'waiting');
  }
}
