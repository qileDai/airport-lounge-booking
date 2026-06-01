import { FlightSlotRepo } from '../repositories/flightSlotRepo';
import { AuditLogRepo } from '../repositories/auditLogRepo';
import { FlightSlot, FlightSlotCreate, FlightSlotUpdate } from '../models/flightSlot';
import { NotFoundError, ValidationError } from '../utils/errors';

const flightSlotRepo = new FlightSlotRepo();
const auditLogRepo = new AuditLogRepo();

export class FlightSlotService {
  getAll(): FlightSlot[] {
    return flightSlotRepo.findAll();
  }

  getById(id: number): FlightSlot {
    const item = flightSlotRepo.findById(id);
    if (!item) throw new NotFoundError('FlightSlot', id);
    return item;
  }

  create(data: FlightSlotCreate, operator: string = 'system'): FlightSlot {
    if (!data.code || !data.name) {
      throw new ValidationError('code and name are required');
    }
    const existing = flightSlotRepo.findByCode(data.code);
    if (existing) {
      throw new ValidationError(`FlightSlot with code '${data.code}' already exists`);
    }
    const item = flightSlotRepo.create(data);
    auditLogRepo.create({
      code: `AUD-FS-${Date.now()}`,
      action: 'create',
      entity_type: 'flight_slot',
      entity_id: item.id,
      operator,
      detail: `Created flight slot: ${item.code} - ${item.name}`,
    });
    return item;
  }

  update(id: number, data: FlightSlotUpdate, operator: string = 'system'): FlightSlot {
    const existing = flightSlotRepo.findById(id);
    if (!existing) throw new NotFoundError('FlightSlot', id);
    const item = flightSlotRepo.update(id, data);
    auditLogRepo.create({
      code: `AUD-FS-${Date.now()}`,
      action: 'update',
      entity_type: 'flight_slot',
      entity_id: id,
      operator,
      detail: `Updated flight slot: ${item.code}`,
    });
    return item;
  }

  delete(id: number, operator: string = 'system'): boolean {
    const existing = flightSlotRepo.findById(id);
    if (!existing) throw new NotFoundError('FlightSlot', id);
    const result = flightSlotRepo.delete(id);
    auditLogRepo.create({
      code: `AUD-FS-${Date.now()}`,
      action: 'delete',
      entity_type: 'flight_slot',
      entity_id: id,
      operator,
      detail: `Deleted flight slot: ${existing.code}`,
    });
    return result;
  }

  archive(id: number, operator: string = 'system'): FlightSlot {
    const existing = flightSlotRepo.findById(id);
    if (!existing) throw new NotFoundError('FlightSlot', id);
    if (existing.is_archived) {
      throw new ValidationError(`FlightSlot ${existing.code} is already archived`);
    }
    const item = flightSlotRepo.archive(id);
    auditLogRepo.create({
      code: `AUD-FS-${Date.now()}`,
      action: 'archive',
      entity_type: 'flight_slot',
      entity_id: id,
      operator,
      detail: `Archived flight slot: ${existing.code}`,
    });
    return item;
  }

  snapshot(id: number, operator: string = 'system'): FlightSlot {
    const existing = flightSlotRepo.findById(id);
    if (!existing) throw new NotFoundError('FlightSlot', id);
    const item = flightSlotRepo.snapshot(id);
    auditLogRepo.create({
      code: `AUD-FS-${Date.now()}`,
      action: 'snapshot',
      entity_type: 'flight_slot',
      entity_id: id,
      operator,
      detail: `Created snapshot for flight slot: ${existing.code}`,
    });
    return item;
  }

  getActive(): FlightSlot[] {
    return flightSlotRepo.findActive();
  }

  getArchived(): FlightSlot[] {
    return flightSlotRepo.findArchived();
  }
}
