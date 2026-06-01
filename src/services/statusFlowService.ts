import { StatusFlowRecordRepo } from '../repositories/statusFlowRecordRepo';
import { AuditLogRepo } from '../repositories/auditLogRepo';
import { StatusFlowRecord, StatusFlowRecordCreate } from '../models/statusFlowRecord';
import { STATUS_TRANSITIONS, VALID_STATUSES } from '../schemas';
import { NotFoundError, StatusTransitionError, ValidationError, BusinessRuleError } from '../utils/errors';

const statusFlowRecordRepo = new StatusFlowRecordRepo();
const auditLogRepo = new AuditLogRepo();

export class StatusFlowService {
  getAll(): StatusFlowRecord[] {
    return statusFlowRecordRepo.findAll();
  }

  getByEntity(entityType: string, entityId: number): StatusFlowRecord[] {
    return statusFlowRecordRepo.findByEntity(entityType, entityId);
  }

  transition(
    entityType: string,
    entityId: number,
    fromStatus: string,
    toStatus: string,
    action: string,
    responsiblePerson: string,
    rejectReason?: string,
    batchNo?: string,
    operator: string = 'system'
  ): StatusFlowRecord {
    if (!VALID_STATUSES.includes(fromStatus as any) || !VALID_STATUSES.includes(toStatus as any)) {
      throw new ValidationError(`Invalid status: from='${fromStatus}', to='${toStatus}'. Valid statuses: ${VALID_STATUSES.join(', ')}`);
    }

    const allowedTransitions = STATUS_TRANSITIONS[fromStatus];
    if (!allowedTransitions || !allowedTransitions.includes(toStatus)) {
      throw new StatusTransitionError(fromStatus, toStatus);
    }

    if (toStatus === 'rejected' && !rejectReason) {
      throw new BusinessRuleError('驳回必须填写原因 (reject_reason is required for rejection)');
    }

    const record = statusFlowRecordRepo.create({
      code: `SFR-${Date.now()}-${entityType}-${entityId}`,
      name: `${entityType}状态流转-${fromStatus}到${toStatus}`,
      status: 'confirmed',
      responsible_person: responsiblePerson,
      entity_type: entityType,
      entity_id: entityId,
      from_status: fromStatus,
      to_status: toStatus,
      action,
      reject_reason: rejectReason || null,
      batch_no: batchNo || null,
      remark: null,
    });

    auditLogRepo.create({
      code: `AUD-SFR-${Date.now()}`,
      action: 'status_transition',
      entity_type: entityType,
      entity_id: entityId,
      operator,
      detail: `Status transition: ${fromStatus} -> ${toStatus} for ${entityType}#${entityId}${rejectReason ? ', reason: ' + rejectReason : ''}`,
    });

    return record;
  }

  validateTransition(fromStatus: string, toStatus: string): boolean {
    const allowedTransitions = STATUS_TRANSITIONS[fromStatus];
    return allowedTransitions ? allowedTransitions.includes(toStatus) : false;
  }

  getAllowedTransitions(currentStatus: string): string[] {
    return STATUS_TRANSITIONS[currentStatus] || [];
  }
}
