import { Router, Request, Response, NextFunction } from 'express';
import { MemberBenefitService } from '../services/memberBenefitService';
import { ReservationService } from '../services/reservationService';
import { VerificationService } from '../services/verificationService';
import { WaitlistService } from '../services/waitlistService';
import { PriorityCalculationService } from '../services/priorityCalculationService';
import { ExceptionService } from '../services/exceptionService';
import { StatisticsService } from '../services/statisticsService';
import { FlightSlotService } from '../services/flightSlotService';
import { StatusFlowService } from '../services/statusFlowService';
import { AuditLogService } from '../services/auditLogService';
import { AppError } from '../utils/errors';
import { initDatabase } from '../db/init';
import { seedDatabase } from '../db/seed';
import { closeDatabase, resetDatabase } from '../db/database';

const router = Router();

const memberBenefitService = new MemberBenefitService();
const reservationService = new ReservationService();
const verificationService = new VerificationService();
const waitlistService = new WaitlistService();
const priorityCalculationService = new PriorityCalculationService();
const exceptionService = new ExceptionService();
const statisticsService = new StatisticsService();
const flightSlotService = new FlightSlotService();
const statusFlowService = new StatusFlowService();
const auditLogService = new AuditLogService();

function getOperator(req: Request): string {
  return (req.headers['x-operator'] as string) || 'anonymous';
}

router.get('/member-benefits', (_req: Request, res: Response) => {
  res.json(memberBenefitService.getAll());
});

router.get('/member-benefits/:id', (req: Request, res: Response) => {
  res.json(memberBenefitService.getById(Number(req.params.id)));
});

router.post('/member-benefits', (req: Request, res: Response) => {
  const item = memberBenefitService.create(req.body, getOperator(req));
  res.status(201).json(item);
});

router.put('/member-benefits/:id', (req: Request, res: Response) => {
  res.json(memberBenefitService.update(Number(req.params.id), req.body, getOperator(req)));
});

router.delete('/member-benefits/:id', (req: Request, res: Response) => {
  memberBenefitService.delete(Number(req.params.id), getOperator(req));
  res.status(204).send();
});

router.get('/reservations', (_req: Request, res: Response) => {
  res.json(reservationService.getAll());
});

router.get('/reservations/:id', (req: Request, res: Response) => {
  res.json(reservationService.getById(Number(req.params.id)));
});

router.post('/reservations', (req: Request, res: Response) => {
  const item = reservationService.create(req.body, getOperator(req));
  res.status(201).json(item);
});

router.put('/reservations/:id', (req: Request, res: Response) => {
  res.json(reservationService.update(Number(req.params.id), req.body, getOperator(req)));
});

router.delete('/reservations/:id', (req: Request, res: Response) => {
  reservationService.delete(Number(req.params.id), getOperator(req));
  res.status(204).send();
});

router.post('/reservations/batch-import', (req: Request, res: Response) => {
  const result = reservationService.batchImportPreCheck(req.body.items || [], getOperator(req));
  res.json(result);
});

router.get('/flight-slots', (_req: Request, res: Response) => {
  res.json(flightSlotService.getAll());
});

router.get('/flight-slots/active', (_req: Request, res: Response) => {
  res.json(flightSlotService.getActive());
});

router.get('/flight-slots/archived', (_req: Request, res: Response) => {
  res.json(flightSlotService.getArchived());
});

router.get('/flight-slots/:id', (req: Request, res: Response) => {
  res.json(flightSlotService.getById(Number(req.params.id)));
});

router.post('/flight-slots', (req: Request, res: Response) => {
  const item = flightSlotService.create(req.body, getOperator(req));
  res.status(201).json(item);
});

router.put('/flight-slots/:id', (req: Request, res: Response) => {
  res.json(flightSlotService.update(Number(req.params.id), req.body, getOperator(req)));
});

router.delete('/flight-slots/:id', (req: Request, res: Response) => {
  flightSlotService.delete(Number(req.params.id), getOperator(req));
  res.status(204).send();
});

router.post('/flight-slots/:id/archive', (req: Request, res: Response) => {
  res.json(flightSlotService.archive(Number(req.params.id), getOperator(req)));
});

router.post('/flight-slots/:id/snapshot', (req: Request, res: Response) => {
  res.json(flightSlotService.snapshot(Number(req.params.id), getOperator(req)));
});

router.post('/verifications', (req: Request, res: Response) => {
  const { reservation_id } = req.body;
  const item = verificationService.verify(reservation_id, getOperator(req));
  res.status(201).json(item);
});

router.get('/verifications', (_req: Request, res: Response) => {
  res.json(verificationService.getAll());
});

router.get('/verifications/:id', (req: Request, res: Response) => {
  res.json(verificationService.getById(Number(req.params.id)));
});

router.get('/waitlists', (_req: Request, res: Response) => {
  res.json(waitlistService.getAll());
});

router.get('/waitlists/:id', (req: Request, res: Response) => {
  res.json(waitlistService.getById(Number(req.params.id)));
});

router.post('/waitlists', (req: Request, res: Response) => {
  const item = waitlistService.create(req.body, getOperator(req));
  res.status(201).json(item);
});

router.post('/waitlists/arrange', (req: Request, res: Response) => {
  const { flight_slot_id } = req.body;
  const items = waitlistService.arrange(flight_slot_id, getOperator(req));
  res.json(items);
});

router.get('/waitlists/flight-slot/:flightSlotId', (req: Request, res: Response) => {
  res.json(waitlistService.getWaitingByFlightSlot(Number(req.params.flightSlotId)));
});

router.post('/priority/calculate', (req: Request, res: Response) => {
  const { member_benefit_id, flight_slot_id } = req.body;
  const result = priorityCalculationService.calculateForMember(member_benefit_id, flight_slot_id, getOperator(req));
  res.json(result);
});

router.post('/priority/calculate-raw', (req: Request, res: Response) => {
  const result = priorityCalculationService.calculate(req.body);
  res.json(result);
});

router.post('/priority/recalculate/:flightSlotId', (req: Request, res: Response) => {
  const results = priorityCalculationService.recalculateAllForFlightSlot(Number(req.params.flightSlotId), getOperator(req));
  res.json(results);
});

router.post('/exceptions/check', (req: Request, res: Response) => {
  const result = exceptionService.checkExpiredBenefits(getOperator(req));
  res.json(result);
});

router.get('/exceptions', (_req: Request, res: Response) => {
  res.json(exceptionService.getAll());
});

router.get('/exceptions/pending', (_req: Request, res: Response) => {
  res.json(exceptionService.getPending());
});

router.get('/exceptions/:id', (req: Request, res: Response) => {
  res.json(exceptionService.getById(Number(req.params.id)));
});

router.post('/exceptions/:id/handle', (req: Request, res: Response) => {
  const { handler, action } = req.body;
  const item = exceptionService.handleException(Number(req.params.id), handler, action, getOperator(req));
  res.json(item);
});

router.get('/statistics/verification-rate', (req: Request, res: Response) => {
  const filter = {
    group_by: (req.query.group_by as string) || 'day',
    start_date: req.query.start_date as string | undefined,
    end_date: req.query.end_date as string | undefined,
    batch_no: req.query.batch_no as string | undefined,
    responsible_person: req.query.responsible_person as string | undefined,
  };
  res.json(statisticsService.verificationRate(filter));
});

router.get('/statistics/waitlist-transfer-rate', (req: Request, res: Response) => {
  const filter = {
    group_by: (req.query.group_by as string) || 'day',
    start_date: req.query.start_date as string | undefined,
    end_date: req.query.end_date as string | undefined,
    batch_no: req.query.batch_no as string | undefined,
    responsible_person: req.query.responsible_person as string | undefined,
  };
  res.json(statisticsService.waitlistTransferRate(filter));
});

router.get('/statistics/usage-rate', (req: Request, res: Response) => {
  const filter = {
    group_by: (req.query.group_by as string) || 'day',
    start_date: req.query.start_date as string | undefined,
    end_date: req.query.end_date as string | undefined,
    batch_no: req.query.batch_no as string | undefined,
    responsible_person: req.query.responsible_person as string | undefined,
  };
  res.json(statisticsService.usageRate(filter));
});

router.post('/status-flow', (req: Request, res: Response) => {
  const { entity_type, entity_id, from_status, to_status, action, responsible_person, reject_reason, batch_no } = req.body;
  const record = statusFlowService.transition(
    entity_type, entity_id, from_status, to_status, action, responsible_person, reject_reason, batch_no, getOperator(req)
  );
  res.status(201).json(record);
});

router.get('/status-flow', (req: Request, res: Response) => {
  const entityType = req.query.entity_type as string;
  const entityId = req.query.entity_id ? Number(req.query.entity_id) : undefined;
  if (entityType && entityId) {
    res.json(statusFlowService.getByEntity(entityType, entityId));
  } else {
    res.json(statusFlowService.getAll());
  }
});

router.get('/status-flow/allowed-transitions', (req: Request, res: Response) => {
  const currentStatus = req.query.current_status as string;
  if (!currentStatus) {
    res.status(400).json({ error: 'current_status query parameter is required' });
    return;
  }
  res.json({ current_status: currentStatus, allowed_transitions: statusFlowService.getAllowedTransitions(currentStatus) });
});

router.get('/audit-logs', (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  const entityType = req.query.entity_type as string;
  const entityId = req.query.entity_id ? Number(req.query.entity_id) : undefined;
  const operator = req.query.operator as string;
  const startDate = req.query.start_date as string;
  const endDate = req.query.end_date as string;

  if (entityType && entityId) {
    res.json(auditLogService.getByEntityId(entityType, entityId));
  } else if (entityType) {
    res.json(auditLogService.getByEntityType(entityType));
  } else if (operator) {
    res.json(auditLogService.getByOperator(operator));
  } else if (startDate && endDate) {
    res.json(auditLogService.getByDateRange(startDate, endDate));
  } else {
    res.json(auditLogService.getAll(limit, offset));
  }
});

router.post('/seed/reset', (_req: Request, res: Response) => {
  resetDatabase();
  initDatabase();
  seedDatabase();
  res.json({ message: 'Database reset and seeded successfully' });
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, name: err.name });
  } else {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', name: 'InternalServerError' });
  }
}

export default router;
