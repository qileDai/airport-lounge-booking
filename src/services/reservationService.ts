import { ReservationRepo } from '../repositories/reservationRepo';
import { MemberBenefitRepo } from '../repositories/memberBenefitRepo';
import { FlightSlotRepo } from '../repositories/flightSlotRepo';
import { AuditLogRepo } from '../repositories/auditLogRepo';
import { Reservation, ReservationCreate, ReservationUpdate } from '../models/reservation';
import { NotFoundError, ValidationError, BusinessRuleError } from '../utils/errors';
import { BatchImportItem, BatchImportResult } from '../schemas';

const reservationRepo = new ReservationRepo();
const memberBenefitRepo = new MemberBenefitRepo();
const flightSlotRepo = new FlightSlotRepo();
const auditLogRepo = new AuditLogRepo();

export class ReservationService {
  getAll(): Reservation[] {
    return reservationRepo.findAll();
  }

  getById(id: number): Reservation {
    const item = reservationRepo.findById(id);
    if (!item) throw new NotFoundError('Reservation', id);
    return item;
  }

  create(data: ReservationCreate, operator: string = 'system'): Reservation {
    if (!data.code || !data.name) {
      throw new ValidationError('code and name are required');
    }
    const existing = reservationRepo.findByCode(data.code);
    if (existing) {
      throw new ValidationError(`Reservation with code '${data.code}' already exists`);
    }
    if (data.member_benefit_id) {
      const benefit = memberBenefitRepo.findById(data.member_benefit_id);
      if (!benefit) throw new ValidationError(`MemberBenefit with id ${data.member_benefit_id} not found`);
    }
    if (data.flight_slot_id) {
      const slot = flightSlotRepo.findById(data.flight_slot_id);
      if (!slot) throw new ValidationError(`FlightSlot with id ${data.flight_slot_id} not found`);
    }
    const item = reservationRepo.create(data);
    auditLogRepo.create({
      code: `AUD-RSV-${Date.now()}`,
      action: 'create',
      entity_type: 'reservation',
      entity_id: item.id,
      operator,
      detail: `Created reservation: ${item.code} - ${item.name}`,
    });
    return item;
  }

  update(id: number, data: ReservationUpdate, operator: string = 'system'): Reservation {
    const existing = reservationRepo.findById(id);
    if (!existing) throw new NotFoundError('Reservation', id);
    const item = reservationRepo.update(id, data);
    auditLogRepo.create({
      code: `AUD-RSV-${Date.now()}`,
      action: 'update',
      entity_type: 'reservation',
      entity_id: id,
      operator,
      detail: `Updated reservation: ${item.code}`,
    });
    return item;
  }

  delete(id: number, operator: string = 'system'): boolean {
    const existing = reservationRepo.findById(id);
    if (!existing) throw new NotFoundError('Reservation', id);
    const result = reservationRepo.delete(id);
    auditLogRepo.create({
      code: `AUD-RSV-${Date.now()}`,
      action: 'delete',
      entity_type: 'reservation',
      entity_id: id,
      operator,
      detail: `Deleted reservation: ${existing.code}`,
    });
    return result;
  }

  batchImportPreCheck(items: BatchImportItem[], operator: string = 'system'): BatchImportResult {
    const result: BatchImportResult = {
      total: items.length,
      valid: 0,
      invalid: 0,
      errors: [],
      imported: [],
    };

    const validItems: ReservationCreate[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemErrors: string[] = [];

      if (!item.code) itemErrors.push('code is required');
      if (!item.name) itemErrors.push('name is required');
      if (!item.responsible_person) itemErrors.push('responsible_person is required');

      const existing = reservationRepo.findByCode(item.code);
      if (existing) itemErrors.push(`code '${item.code}' already exists`);

      if (item.member_benefit_id) {
        const benefit = memberBenefitRepo.findById(item.member_benefit_id);
        if (!benefit) itemErrors.push(`member_benefit_id ${item.member_benefit_id} not found`);
      }

      if (item.flight_slot_id) {
        const slot = flightSlotRepo.findById(item.flight_slot_id);
        if (!slot) itemErrors.push(`flight_slot_id ${item.flight_slot_id} not found`);
      }

      if (itemErrors.length > 0) {
        result.invalid++;
        result.errors.push({ index: i, code: item.code || '', reason: itemErrors.join('; ') });
      } else {
        result.valid++;
        validItems.push({
          code: item.code,
          name: item.name,
          status: 'draft',
          responsible_person: item.responsible_person,
          member_benefit_id: item.member_benefit_id || null,
          flight_slot_id: item.flight_slot_id || null,
          companion_count: item.companion_count || 0,
          batch_no: item.batch_no || null,
          remark: item.remark || null,
        });
      }
    }

    if (validItems.length > 0) {
      const imported = reservationRepo.createMany(validItems);
      result.imported = imported.map(r => ({ id: r.id, code: r.code, name: r.name }));
      auditLogRepo.create({
        code: `AUD-RSV-BATCH-${Date.now()}`,
        action: 'batch_import',
        entity_type: 'reservation',
        entity_id: 0,
        operator,
        detail: `Batch imported ${imported.length} reservations, ${result.invalid} failed`,
      });
    }

    return result;
  }
}
