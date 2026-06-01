import { MemberRightsRepository } from '../repositories/memberRights.repository';
import { ExceptionEventRepository } from '../repositories/exceptionEvent.repository';
import { StatusTransitionRepository } from '../repositories/statusTransition.repository';
import { IMemberRights, IExceptionEvent } from '../models/entities';

export interface ExceptionCheckResult {
  hasException: boolean;
  exceptions: Array<{
    type: string;
    severity: string;
    message: string;
    triggerField: string;
    thresholdValue: string;
    actualValue: string
  }>;
  member: IMemberRights;
}

export class ExceptionDetectionService {
  private memberRepo: MemberRightsRepository;
  private exceptionRepo: ExceptionEventRepository;
  private transitionRepo: StatusTransitionRepository;

  constructor() {
    this.memberRepo = new MemberRightsRepository();
    this.exceptionRepo = new ExceptionEventRepository();
    this.transitionRepo = new StatusTransitionRepository();
  }

  async checkMemberExceptions(memberId: string): Promise<ExceptionCheckResult> {
    const member = await this.memberRepo.findById(memberId);
    if (!member) {
      throw new Error('会员不存在');
    }

    const exceptions: ExceptionCheckResult['exceptions'] = [];
    const now = new Date();

    if (member.status !== 'active') {
      exceptions.push({
        type: 'account_status_abnormal',
        severity: 'high',
        message: `账户状态异常：${member.status}`,
        triggerField: 'status',
        thresholdValue: 'active',
        actualValue: member.status
      });
    }

    const validTo = new Date(member.valid_to);
    if (validTo <= now) {
      exceptions.push({
        type: 'rights_expired',
        severity: 'critical',
        message: '权益已过期',
        triggerField: 'valid_to',
        thresholdValue: now.toISOString().split('T')[0],
        actualValue: member.valid_to.split('T')[0]
      });
    } else {
      const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 7) {
        exceptions.push({
          type: 'rights_expiring_soon',
          severity: daysUntilExpiry <= 3 ? 'high' : 'medium',
          message: `权益即将过期，剩余${daysUntilExpiry}天`,
          triggerField: 'valid_to',
          thresholdValue: now.setDate(now.getDate() + 7).toISOString().split('T')[0],
          actualValue: member.valid_to.split('T')[0]
        });
      }
    }

    if (member.remaining_quota <= 0 && member.total_quota > 0) {
      exceptions.push({
        type: 'quota_exhausted',
        severity: 'medium',
        message: '权益额度已用完',
        triggerField: 'remaining_quota',
        thresholdValue: '1',
        actualValue: String(member.remaining_quota)
      });
    } else if (member.remaining_quota > 0 && member.remaining_quota <= 2) {
      exceptions.push({
        type: 'quota_low',
        severity: 'low',
        message: `权益额度不足，仅剩${member.remaining_quota}次`,
        triggerField: 'remaining_quota',
        thresholdValue: '3',
        actualValue: String(member.remaining_quota)
      });
    }

    for (const exc of exceptions) {
      if (exc.severity === 'critical' || exc.severity === 'high') {
        await this.createExceptionEvent(member, exc);
        
        if (exc.type === 'rights_expired') {
          await this.transitionRepo.create({
            entity_type: 'member_rights',
            entity_id: member.id,
            from_status: member.status,
            to_status: 'expired',
            action: 'auto_expire',
            reason: exc.message,
            operator_name: '系统自动检测'
          });
        }
      }
    }

    return {
      hasException: exceptions.length > 0,
      exceptions,
      member
    };
  }

  async batchCheckExpiry(): Promise<{
    checked: number;
    exceptionsFound: number;
    details: Array<{ memberId: string; code: string; status: string }>
  }> {
    const activeMembers = await this.memberRepo.getByStatus('active');
    let exceptionsFound = 0;
    const details: Array<{ memberId: string; code: string; status: string }> = [];

    for (const member of activeMembers) {
      const result = await this.checkMemberExceptions(member.id);
      
      if (result.hasException) {
        const criticalOrHigh = result.exceptions.filter(e => 
          e.severity === 'critical' || e.severity === 'high'
        );
        
        if (criticalOrHigh.length > 0) {
          exceptionsFound++;
          details.push({
            memberId: member.id,
            code: member.code,
            status: member.status
          });
        }
      }
    }

    return {
      checked: activeMembers.length,
      exceptionsFound,
      details
    };
  }

  private async createExceptionEvent(
    member: IMemberRights, 
    exception: ExceptionCheckResult['exceptions'][0]
  ): Promise<void> {
    const existingOpen = await this.exceptionRepo.findByStatus('open');
    const alreadyExists = existingOpen.some(e => 
      e.source_entity_id === member.id && e.exception_type === exception.type
    );

    if (!alreadyExists) {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + (exception.severity === 'critical' ? 2 : 24));

      await this.exceptionRepo.create({
        code: `EE-${Date.now()}-${exception.type.toUpperCase()}`,
        name: `${member.name}-${exception.type}`,
        exception_type: exception.type,
        severity: exception.severity as any,
        source_entity_type: 'member_rights',
        source_entity_id: member.id,
        trigger_field: exception.triggerField,
        threshold_value: exception.thresholdValue,
        actual_value: exception.actualValue,
        handler_name: '异常处理组',
        deadline: deadline.toISOString(),
        status: 'open',
        owner_name: '异常处理组长',
        remark: exception.message
      });
    }
  }
}
