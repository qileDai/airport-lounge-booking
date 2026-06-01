import { VerificationResultRepo } from '../repositories/verificationResultRepo';
import { MemberBenefitRepo } from '../repositories/memberBenefitRepo';
import { ReservationRepo } from '../repositories/reservationRepo';
import { FlightSlotRepo } from '../repositories/flightSlotRepo';
import { AuditLogRepo } from '../repositories/auditLogRepo';
import { VerificationResult, VerificationResultCreate } from '../models/verificationResult';
import { NotFoundError, BusinessRuleError } from '../utils/errors';

const verificationResultRepo = new VerificationResultRepo();
const memberBenefitRepo = new MemberBenefitRepo();
const reservationRepo = new ReservationRepo();
const flightSlotRepo = new FlightSlotRepo();
const auditLogRepo = new AuditLogRepo();

export class VerificationService {
  getAll(): VerificationResult[] {
    return verificationResultRepo.findAll();
  }

  getById(id: number): VerificationResult {
    const item = verificationResultRepo.findById(id);
    if (!item) throw new NotFoundError('VerificationResult', id);
    return item;
  }

  verify(reservationId: number, operator: string = 'system'): VerificationResult {
    const reservation = reservationRepo.findById(reservationId);
    if (!reservation) throw new NotFoundError('Reservation', reservationId);

    const missingFields: string[] = [];
    if (!reservation.member_benefit_id) missingFields.push('member_benefit_id');
    if (!reservation.flight_slot_id) missingFields.push('flight_slot_id');

    if (missingFields.length > 0) {
      const draftResult = verificationResultRepo.create({
        code: `VRF-${Date.now()}-${reservationId}`,
        name: `核验草稿-${reservation.code}`,
        status: 'draft',
        responsible_person: operator,
        reservation_id: reservationId,
        member_benefit_id: reservation.member_benefit_id,
        result: 'inconclusive',
        fail_reason: `缺少关键字段: ${missingFields.join(', ')}，仅允许保存为草稿`,
        batch_no: reservation.batch_no,
        remark: '核验前校验不通过，关键字段缺失',
      });
      auditLogRepo.create({
        code: `AUD-VRF-${Date.now()}`,
        action: 'verify_draft',
        entity_type: 'verification_result',
        entity_id: draftResult.id,
        operator,
        detail: `Verification saved as draft due to missing fields: ${missingFields.join(', ')}`,
      });
      return draftResult;
    }

    const benefit = memberBenefitRepo.findById(reservation.member_benefit_id!);
    const slot = flightSlotRepo.findById(reservation.flight_slot_id!);

    if (!benefit) {
      throw new BusinessRuleError(`会员权益 ID ${reservation.member_benefit_id} 不存在，无法核验`);
    }
    if (!slot) {
      throw new BusinessRuleError(`航班时段 ID ${reservation.flight_slot_id} 不存在，无法核验`);
    }

    const failReasons: string[] = [];

    if (benefit.status !== 'confirmed') {
      failReasons.push(`会员权益状态为 '${benefit.status}'，非已确认状态`);
    }

    const today = new Date().toISOString().slice(0, 10);
    if (benefit.expiry_date && benefit.expiry_date < today) {
      failReasons.push(`会员权益已于 ${benefit.expiry_date} 过期`);
    }

    if (benefit.effective_date && benefit.effective_date > today) {
      failReasons.push(`会员权益尚未生效，生效日期为 ${benefit.effective_date}`);
    }

    if (benefit.remaining_quota <= 0) {
      failReasons.push(`会员权益剩余额度为 0`);
    }

    if (slot.is_archived) {
      failReasons.push(`航班时段已归档`);
    }

    if (slot.used_count >= slot.capacity) {
      failReasons.push(`航班时段容量已满 (${slot.used_count}/${slot.capacity})`);
    }

    const resultValue = failReasons.length === 0 ? 'passed' : 'failed';
    const verification = verificationResultRepo.create({
      code: `VRF-${Date.now()}-${reservationId}`,
      name: `核验-${reservation.code}`,
      status: 'confirmed',
      responsible_person: operator,
      reservation_id: reservationId,
      member_benefit_id: reservation.member_benefit_id,
      result: resultValue,
      fail_reason: failReasons.length > 0 ? failReasons.join('; ') : null,
      batch_no: reservation.batch_no,
      remark: null,
    });

    if (resultValue === 'passed') {
      memberBenefitRepo.update(benefit.id, {
        remaining_quota: benefit.remaining_quota - 1,
      });
      flightSlotRepo.update(slot.id, {
        used_count: slot.used_count + 1,
      });
    }

    auditLogRepo.create({
      code: `AUD-VRF-${Date.now()}`,
      action: 'verify',
      entity_type: 'verification_result',
      entity_id: verification.id,
      operator,
      detail: `Verification ${resultValue} for reservation ${reservation.code}${failReasons.length > 0 ? ': ' + failReasons.join('; ') : ''}`,
    });

    return verification;
  }

  getByDateRange(startDate: string, endDate: string): VerificationResult[] {
    return verificationResultRepo.findByDateRange(startDate, endDate);
  }

  getByResponsiblePerson(person: string): VerificationResult[] {
    return verificationResultRepo.findByResponsiblePerson(person);
  }

  getByBatchNo(batchNo: string): VerificationResult[] {
    return verificationResultRepo.findByBatchNo(batchNo);
  }
}
