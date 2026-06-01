import { PriorityInput, PriorityOutput, MEMBER_LEVEL_WEIGHTS } from '../schemas';
import { WaitlistRepo } from '../repositories/waitlistRepo';
import { MemberBenefitRepo } from '../repositories/memberBenefitRepo';
import { FlightSlotRepo } from '../repositories/flightSlotRepo';
import { AuditLogRepo } from '../repositories/auditLogRepo';
import { NotFoundError, ValidationError } from '../utils/errors';

const waitlistRepo = new WaitlistRepo();
const memberBenefitRepo = new MemberBenefitRepo();
const flightSlotRepo = new FlightSlotRepo();
const auditLogRepo = new AuditLogRepo();

export class PriorityCalculationService {
  calculate(input: PriorityInput): PriorityOutput {
    const memberLevelWeight = MEMBER_LEVEL_WEIGHTS[input.member_level] || 0;

    const totalQuota = input.total_quota || 1;
    const quotaWeight = (input.remaining_quota / totalQuota) * 30;

    let flightSlotWeight = 0;
    if (input.departure_time) {
      const departure = new Date(input.departure_time);
      const now = new Date();
      const hoursUntilDeparture = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilDeparture <= 2) {
        flightSlotWeight = 20;
      } else if (hoursUntilDeparture <= 4) {
        flightSlotWeight = 10;
      }
    }

    let waitTimeWeight = 0;
    if (input.wait_start_time) {
      const waitStart = new Date(input.wait_start_time);
      const now = new Date();
      const waitHours = (now.getTime() - waitStart.getTime()) / (1000 * 60 * 60);
      waitTimeWeight = Math.min(waitHours / 24, 1) * 10;
    }

    const totalScore = Math.round((memberLevelWeight + quotaWeight + flightSlotWeight + waitTimeWeight) * 100) / 100;

    return {
      member_level_weight: memberLevelWeight,
      quota_weight: Math.round(quotaWeight * 100) / 100,
      flight_slot_weight: flightSlotWeight,
      wait_time_weight: Math.round(waitTimeWeight * 100) / 100,
      total_score: totalScore,
    };
  }

  calculateForMember(memberBenefitId: number, flightSlotId: number, operator: string = 'system'): PriorityOutput & { waitlist_id?: number } {
    const benefit = memberBenefitRepo.findById(memberBenefitId);
    if (!benefit) throw new NotFoundError('MemberBenefit', memberBenefitId);

    const slot = flightSlotRepo.findById(flightSlotId);
    if (!slot) throw new NotFoundError('FlightSlot', flightSlotId);

    const waitlistEntries = waitlistRepo.findByFlightSlotId(flightSlotId)
      .filter(w => w.member_benefit_id === memberBenefitId && w.status === 'waiting');
    const waitStartTime = waitlistEntries.length > 0 ? waitlistEntries[0].wait_start_time : null;

    const input: PriorityInput = {
      member_level: benefit.member_level,
      remaining_quota: benefit.remaining_quota,
      total_quota: benefit.total_quota,
      departure_time: slot.departure_time,
      wait_start_time: waitStartTime,
    };

    const result = this.calculate(input);

    if (waitlistEntries.length > 0) {
      waitlistRepo.update(waitlistEntries[0].id, { priority_score: result.total_score });
    }

    auditLogRepo.create({
      code: `AUD-PRI-${Date.now()}`,
      action: 'calculate_priority',
      entity_type: 'member_benefit',
      entity_id: memberBenefitId,
      operator,
      detail: `Priority calculated: ${result.total_score} for member ${benefit.code} on slot ${slot.code}`,
    });

    return {
      ...result,
      waitlist_id: waitlistEntries.length > 0 ? waitlistEntries[0].id : undefined,
    };
  }

  recalculateAllForFlightSlot(flightSlotId: number, operator: string = 'system'): PriorityOutput[] {
    const slot = flightSlotRepo.findById(flightSlotId);
    if (!slot) throw new NotFoundError('FlightSlot', flightSlotId);

    const waitingEntries = waitlistRepo.findByFlightSlotId(flightSlotId)
      .filter(w => w.status === 'waiting');

    const results: PriorityOutput[] = [];
    for (const entry of waitingEntries) {
      if (!entry.member_benefit_id) continue;
      const benefit = memberBenefitRepo.findById(entry.member_benefit_id);
      if (!benefit) continue;

      const input: PriorityInput = {
        member_level: benefit.member_level,
        remaining_quota: benefit.remaining_quota,
        total_quota: benefit.total_quota,
        departure_time: slot.departure_time,
        wait_start_time: entry.wait_start_time,
      };

      const result = this.calculate(input);
      waitlistRepo.update(entry.id, { priority_score: result.total_score });
      results.push(result);
    }

    auditLogRepo.create({
      code: `AUD-PRI-RECALC-${Date.now()}`,
      action: 'recalculate_priorities',
      entity_type: 'flight_slot',
      entity_id: flightSlotId,
      operator,
      detail: `Recalculated priorities for ${results.length} waitlist entries on slot ${slot.code}`,
    });

    return results;
  }
}
