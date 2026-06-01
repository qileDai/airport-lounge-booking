import { MemberRightsRepository } from '../repositories/memberRights.repository';
import { WaitingListRepository } from '../repositories/waitingList.repository';
import { FlightPeriodRepository } from '../repositories/flightPeriod.repository';
import { RuleConfigRepository } from '../repositories/ruleConfig.repository';
import { IMemberRights, IWaitingList, IFlightPeriod, IRuleConfig } from '../models/entities';

export interface PriorityCalculationInput {
  member_id: string;
  flight_period_id?: string;
}

export interface PriorityResult {
  member_id: string;
  priority_score: number;
  breakdown: {
    level_score: number;
    quota_score: number;
    flight_time_score: number;
    wait_time_score: number
  };
  rank?: number;
  recommendation: string;
}

export class PriorityCalculationService {
  private memberRepo: MemberRightsRepository;
  private waitingRepo: WaitingListRepository;
  private flightRepo: FlightPeriodRepository;
  private ruleRepo: RuleConfigRepository;

  constructor() {
    this.memberRepo = new MemberRightsRepository();
    this.waitingRepo = new WaitingListRepository();
    this.flightRepo = new FlightPeriodRepository();
    this.ruleRepo = new RuleConfigRepository();
  }

  async calculatePriority(input: PriorityCalculationInput): Promise<PriorityResult> {
    const member = await this.memberRepo.findById(input.member_id);
    if (!member) {
      throw new Error('会员不存在');
    }

    const rules = await this.ruleRepo.findAll(true);
    
    let levelScore = this.calculateLevelScore(member.member_level, rules);
    let quotaScore = this.calculateQuotaScore(member.remaining_quota, member.total_quota, rules);
    let flightTimeScore = 0;
    
    if (input.flight_period_id) {
      const flight = await this.flightRepo.findById(input.flight_period_id);
      if (flight) {
        flightTimeScore = this.calculateFlightTimeScore(flight);
      }
    }

    const waitingRecord = await this.findWaitingRecord(input.member_id);
    const waitTimeScore = waitingRecord ? this.calculateWaitTimeScore(waitingRecord, rules) : 50;

    const totalScore = (
      levelScore * 0.35 +
      quotaScore * 0.25 +
      flightTimeScore * 0.20 +
      waitTimeScore * 0.20
    );

    return {
      member_id: input.member_id,
      priority_score: Math.round(totalScore * 10) / 10,
      breakdown: {
        level_score: Math.round(levelScore),
        quota_score: Math.round(quotaScore),
        flight_time_score: Math.round(flightTimeScore),
        wait_time_score: Math.round(waitTimeScore)
      },
      recommendation: this.getRecommendation(totalScore)
    };
  }

  async calculateAllWaitingPriorities(): Promise<PriorityResult[]> {
    const waitingList = await this.waitingRepo.findByStatus('waiting');
    const results: PriorityResult[] = [];

    for (const item of waitingList) {
      if (item.member_id) {
        try {
          const result = await this.calculatePriority({ member_id: item.member_id });
          results.push(result);
          
          await this.waitingRepo.update(item.id, {
            priority_score: result.priority_score
          });
        } catch (error) {
          console.error(`计算候补 ${item.id} 优先级失败:`, error);
        }
      }
    }

    await this.waitingRepo.updatePositions();

    results.sort((a, b) => b.priority_score - a.priority_score);
    results.forEach((r, i) => r.rank = i + 1);

    return results;
  }

  async admitFromWaitingList(count: number = 1): Promise<IWaitingList[]> {
    await this.calculateAllWaitingPriorities();
    
    const waitingList = await this.waitingRepo.findByStatus('waiting');
    const toAdmit = waitingList.slice(0, count);

    for (const item of toAdmit) {
      await this.waitingRepo.update(item.id, {
        status: 'notified'
      });
    }

    return toAdmit;
  }

  private calculateLevelScore(level: string, rules: IRuleConfig[]): number {
    const levelWeights: Record<string, number> = {
      platinum: 100,
      gold: 75,
      silver: 50
    };

    const rule = rules.find(r => r.rule_key === 'member_level_weight');
    if (rule && rule.rule_value) {
      try {
        const customWeights = JSON.parse(rule.rule_value);
        return customWeights[level] || levelWeights[level] || 30;
      } catch (e) {
        console.warn('解析会员等级权重规则失败，使用默认值');
      }
    }

    return levelWeights[level] || 30;
  }

  private calculateQuotaScore(remaining: number, total: number, rules: IRuleConfig[]): number {
    if (total === 0) return 0;
    
    const ratio = remaining / total;
    
    if (ratio >= 0.7) return 100;
    if (ratio >= 0.4) return 70;
    if (ratio >= 0.1) return 40;
    return 10;
  }

  private calculateFlightTimeScore(flight: IFlightPeriod): number {
    const now = new Date();
    const departure = new Date(flight.departure_time);
    const hoursUntilFlight = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilFlight < 2) return 95;
    if (hoursUntilFlight < 6) return 85;
    if (hoursUntilFlight < 12) return 70;
    if (hoursUntilFlight < 24) return 55;
    if (hoursUntilFlight < 48) return 40;
    return 25;
  }

  private calculateWaitTimeScore(waiting: IWaitingList, rules: IRuleConfig[]): number {
    const startTime = new Date(waiting.wait_start_time);
    const now = new Date();
    const waitMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);

    const rule = rules.find(r => r.rule_key === 'wait_time_factor');
    const maxMinutes = rule?.threshold_value || 120;

    if (waitMinutes >= maxMinutes) return 100;
    
    const score = (waitMinutes / maxMinutes) * 100;
    return Math.min(100, score);
  }

  private async findWaitingRecord(memberId: string): Promise<IWaitingList | null> {
    const allWaiting = await this.waitingRepo.findByStatus('waiting');
    return allWaiting.find(w => w.member_id === memberId) || null;
  }

  private getRecommendation(score: number): string {
    if (score >= 85) return '高优先级，建议优先安排入场';
    if (score >= 70) return '中高优先级，可正常排队等候';
    if (score >= 55) return '中等优先级，需关注等待时间';
    if (score >= 40) return '较低优先级，可能需要较长等待时间';
    return '低优先级，建议检查资格条件';
  }
}
