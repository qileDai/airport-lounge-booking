import { WaitingListRepository } from '../repositories/waitingList.repository';
import { MemberRightsRepository } from '../repositories/memberRights.repository';
import { FlightPeriodRepository } from '../repositories/flightPeriod.repository';
import { IWaitingList, IMemberRights, IFlightPeriod } from '../models/entities';

export interface AdmissionResult {
  admitted: IWaitingList[];
  skipped: Array<{
    waiting: IWaitingList;
    reason: string
  }>;
  totalProcessed: number;
}

export class WaitingListAdmissionService {
  private waitingRepo: WaitingListRepository;
  private memberRepo: MemberRightsRepository;
  private flightRepo: FlightPeriodRepository;

  constructor() {
    this.waitingRepo = new WaitingListRepository();
    this.memberRepo = new MemberRightsRepository();
    this.flightRepo = new FlightPeriodRepository();
  }

  async getWaitingList(status?: string, page = 1, limit = 10): Promise<{ data: IWaitingList[]; total: number }> {
    if (status) {
      const filtered = await this.waitingRepo.findByStatus(status);
      const start = (page - 1) * limit;
      const end = start + limit;
      return {
        data: filtered.slice(start, end),
        total: filtered.length
      };
    }
    
    return this.waitingRepo.findAll(page, limit);
  }

  async addToWaitingList(data: {
    code: string;
    name: string;
    member_id: string;
    flight_period_id?: string;
    owner_name?: string;
    batch_id?: string;
    remark?: string
  }): Promise<IWaitingList> {
    const member = await this.memberRepo.findById(data.member_id);
    if (!member) {
      throw new Error('会员不存在');
    }

    if (member.status !== 'active') {
      throw new Error(`会员状态为 ${member.status}，无法加入候补名单`);
    }

    if (member.remaining_quota <= 0) {
      throw new Error('会员权益额度已用完，无法加入候补名单');
    }

    const existingWaiting = await this.waitingRepo.findByStatus('waiting');
    const alreadyInList = existingWaiting.find(w => w.member_id === data.member_id);
    if (alreadyInList) {
      throw new Error('该会员已在候补名单中');
    }

    let estimatedWaitMinutes = 60;
    if (data.flight_period_id) {
      const flight = await this.flightRepo.findById(data.flight_period_id);
      if (flight && flight.capacity > 0) {
        const utilizationRate = flight.used_count / flight.capacity;
        if (utilizationRate > 0.9) {
          estimatedWaitMinutes = 120;
        } else if (utilizationRate > 0.7) {
          estimatedWaitMinutes = 75;
        } else {
          estimatedWaitMinutes = 30;
        }
      }
    }

    const waitingItem = await this.waitingRepo.create({
      code: data.code,
      name: data.name,
      member_id: data.member_id,
      priority_score: this.calculateInitialPriority(member),
      wait_start_time: new Date().toISOString(),
      estimated_wait_minutes: estimatedWaitMinutes,
      status: 'waiting',
      position: 0,
      owner_name: data.owner_name,
      batch_id: data.batch_id,
      remark: data.remark
    });

    await this.waitingRepo.updatePositions();

    return waitingItem;
  }

  async processAdmission(flightPeriodId: string, availableSlots: number): Promise<AdmissionResult> {
    const flight = await this.flightRepo.findById(flightPeriodId);
    if (!flight) {
      throw new Error('航班时段不存在');
    }

    const availableCapacity = Math.max(0, flight.capacity - flight.used_count);
    const actualSlots = Math.min(availableSlots, availableCapacity);

    if (actualSlots <= 0) {
      return {
        admitted: [],
        skipped: [],
        totalProcessed: 0
      };
    }

    const waitingList = await this.waitingRepo.findByStatus('waiting');
    const admitted: IWaitingList[] = [];
    const skipped: AdmissionResult['skipped'] = [];

    for (const item of waitingList.slice(0, actualSlots * 2)) {
      if (admitted.length >= actualSlots) {
        break;
      }

      try {
        if (item.member_id) {
          const member = await this.memberRepo.findById(item.member_id);
          
          if (!member) {
            skipped.push({ waiting: item, reason: '会员不存在' });
            continue;
          }

          if (member.status !== 'active') {
            skipped.push({ waiting: item, reason: `会员状态异常：${member.status}` });
            continue;
          }

          if (member.remaining_quota <= 0) {
            skipped.push({ waiting: item, reason: '会员额度已用完' });
            continue;
          }

          await this.waitingRepo.update(item.id, {
            status: 'notified'
          });

          admitted.push(item);
        }
      } catch (error) {
        skipped.push({ 
          waiting: item, 
          reason: error instanceof Error ? error.message : '处理失败' 
        });
      }
    }

    await this.waitingRepo.updatePositions();

    return {
      admitted,
      skipped,
      totalProcessed: admitted.length + skipped.length
    };
  }

  async removeFromWaitingList(waitingId: string, reason: string): Promise<IWaitingList> {
    const waiting = await this.waitingRepo.findById(waitingId);
    if (!waiting) {
      throw new Error('候补记录不存在');
    }

    if (waiting.status === 'admitted') {
      throw new Error('已入场的记录无法移除');
    }

    const updated = await this.waitingRepo.update(waitingId, {
      status: 'cancelled'
    });

    await this.waitingRepo.updatePositions();

    return updated!;
  }

  async getQueuePosition(memberId: string): Promise<{
    position: number | null;
    estimatedWaitMinutes: number;
    peopleAhead: number
  }> {
    const waitingList = await this.waitingRepo.findByStatus('waiting');
    const myPosition = waitingList.findIndex(w => w.member_id === memberId);

    if (myPosition === -1) {
      return {
        position: null,
        estimatedWaitMinutes: 0,
        peopleAhead: 0
      };
    }

    const myRecord = waitingList[myPosition];
    return {
      position: myPosition + 1,
      estimatedWaitMinutes: myRecord.estimated_wait_minutes,
      peopleAhead: myPosition
    };
  }

  private calculateInitialPriority(member: IMemberRights): number {
    let score = 50;

    switch (member.member_level) {
      case 'platinum':
        score += 35;
        break;
      case 'gold':
        score += 20;
        break;
      case 'silver':
        score += 10;
        break;
    }

    if (member.total_quota > 0) {
      const quotaRatio = member.remaining_quota / member.total_quota;
      score += quotaRatio * 15;
    }

    return Math.min(100, Math.round(score * 10) / 10);
  }
}
