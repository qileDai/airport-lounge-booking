import { StatusTransitionRepository } from '../repositories/statusTransition.repository';
import { BookingRecordRepository } from '../repositories/bookingRecord.repository';
import { VerificationResultRepository } from '../repositories/verificationResult.repository';
import { WaitingListRepository } from '../repositories/waitingList.repository';
import { IStatusTransition, IBookingRecord, IVerificationResult, IWaitingList } from '../models/entities';
import { StatusTransitionDTO } from '../schemas/statusTransition.dto';

const VALID_TRANSITIONS: Record<string, string[]> = {
  'booking_record': {
    'draft': ['pending_review', 'rejected'],
    'pending_review': ['confirmed', 'rejected', 'supplement_required'],
    'supplement_required': ['pending_review', 'rejected'],
    'confirmed': ['archived'],
    'rejected': [],
    'archived': []
  },
  'verification_result': {
    'draft': ['pending_review'],
    'pending_review': ['confirmed', 'rejected', 'supplement_required'],
    'supplement_required': ['pending_review', 'rejected'],
    'confirmed': ['archived'],
    'rejected': ['archived'],
    'archived': []
  },
  'waiting_list': {
    'waiting': ['notified', 'cancelled'],
    'notified': ['admitted', 'cancelled'],
    'admitted': [],
    'cancelled': [],
    'expired': []
  },
  'member_rights': {
    'active': ['suspended', 'expired', 'cancelled'],
    'suspended': ['active', 'expired', 'cancelled'],
    'expired': [],
    'cancelled': []
  }
};

export class StatusTransitionService {
  private transitionRepo: StatusTransitionRepository;
  private bookingRepo: BookingRecordRepository;
  private verificationRepo: VerificationResultRepository;
  private waitingRepo: WaitingListRepository;

  constructor() {
    this.transitionRepo = new StatusTransitionRepository();
    this.bookingRepo = new BookingRecordRepository();
    this.verificationRepo = new VerificationResultRepository();
    this.waitingRepo = new WaitingListRepository();
  }

  async transition(data: StatusTransitionDTO): Promise<IStatusTransition> {
    const allowedTargets = VALID_TRANSITIONS[data.entity_type]?.[data.from_status || ''];
    
    if (!allowedTargets) {
      throw new Error(`不支持的实体类型或状态：${data.entity_type} / ${data.from_status}`);
    }
    
    if (!allowedTargets.includes(data.to_status)) {
      throw new Error(
        `不允许从 ${data.from_status} 转换到 ${data.to_status}。允许的目标状态：${allowedTargets.join(', ')}`
      );
    }

    if (data.to_status === 'rejected' && !data.reason) {
      throw new Error('驳回操作必须填写原因');
    }

    await this.updateEntityStatus(data);

    const transition = await this.transitionRepo.create({
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      from_status: data.from_status,
      to_status: data.to_status,
      action: data.action,
      reason: data.reason,
      operator_name: data.operator_name,
      owner_name: data.owner_name,
      batch_id: data.batch_id,
      remark: data.remark
    });

    return transition;
  }

  async getEntityHistory(entityType: string, entityId: string): Promise<IStatusTransition[]> {
    return this.transitionRepo.getEntityHistory(entityType, entityId);
  }

  async getAuditLog(params: {
    entityType?: string;
    entityId?: string;
    page?: number;
    limit?: number
  }): Promise<{ data: IStatusTransition[]; total: number }> {
    return this.transitionRepo.findAll(
      params.page || 1,
      params.limit || 50,
      params.entityType,
      params.entityId
    );
  }

  getAllowedTransitions(entityType: string, currentStatus: string): string[] {
    return VALID_TRANSITIONS[entityType]?.[currentStatus] || [];
  }

  private async updateEntityStatus(data: StatusTransitionDTO): Promise<void> {
    switch (data.entity_type) {
      case 'booking_record':
        await this.bookingRepo.update(data.entity_id, { status: data.to_status as any });
        break;
      case 'verification_result':
        await this.verificationRepo.update(data.entity_id, { status: data.to_status as any });
        break;
      case 'waiting_list':
        await this.waitingRepo.update(data.entity_id, { status: data.to_status as any });
        break;
    }
  }
}
