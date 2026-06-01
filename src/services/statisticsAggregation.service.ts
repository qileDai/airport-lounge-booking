import { VerificationResultRepository } from '../repositories/verificationResult.repository';
import { BookingRecordRepository } from '../repositories/bookingRecord.repository';
import { MemberRightsRepository } from '../repositories/memberRights.repository';
import { ExceptionEventRepository } from '../repositories/exceptionEvent.repository';
import { StatusTransitionRepository } from '../repositories/statusTransition.repository';
import { IVerificationResult } from '../models/entities';

export interface AggregationParams {
  startDate?: string;
  endDate?: string;
  batchId?: string;
  ownerName?: string;
}

export interface StatisticsResult {
  period: string;
  totalVerifications: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  passRate: number;
  rejectionRate: number;
  supplementRate: number;
  archiveRate: number;
  averageScore: number;
  byBatch: Array<{
    batchId: string;
    count: number;
    passRate: number
  }>;
  byOwner: Array<{
    ownerName: string;
    count: number;
    passRate: number
  }>;
}

export class StatisticsAggregationService {
  private verificationRepo: VerificationResultRepository;
  private bookingRepo: BookingRecordRepository;
  private memberRepo: MemberRightsRepository;
  private exceptionRepo: ExceptionEventRepository;
  private transitionRepo: StatusTransitionRepository;

  constructor() {
    this.verificationRepo = new VerificationResultRepository();
    this.bookingRepo = new BookingRecordRepository();
    this.memberRepo = new MemberRightsRepository();
    this.exceptionRepo = new ExceptionEventRepository();
    this.transitionRepo = new StatusTransitionRepository();
  }

  async getVerificationStatistics(params: AggregationParams = {}): Promise<StatisticsResult> {
    const basicStats = await this.verificationRepo.getStatistics();
    
    const byBatch = await this.aggregateByBatch(params);
    const byOwner = await this.aggregateByOwner(params);
    const averageScore = await this.calculateAverageScore(params);
    
    const statusCounts = await this.getStatusCounts(params);

    return {
      period: `${params.startDate || '起始'} 至 ${params.endDate || '当前'}`,
      totalVerifications: basicStats.total,
      passedCount: basicStats.passed,
      failedCount: basicStats.failed,
      warningCount: basicStats.warning,
      passRate: Math.round(basicStats.passRate * 100) / 100,
      rejectionRate: basicStats.total > 0 ? Math.round((statusCounts.rejected / basicStats.total) * 10000) / 100 : 0,
      supplementRate: basicStats.total > 0 ? Math.round((statusCounts.supplementRequired / basicStats.total) * 10000) / 100 : 0,
      archiveRate: basicStats.total > 0 ? Math.round((statusCounts.archived / basicStats.total) * 10000) / 100 : 0,
      averageScore: Math.round(averageScore * 100) / 100,
      byBatch,
      byOwner
    };
  }

  async getUsageRateStatistics(): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    usedVouchers: number;
    bookingConfirmationRate: number;
    voucherUsageRate: number;
    waitingListAdmissionRate: number
  }> {
    const allBookings = await this.bookingRepo.findAll(1, 9999);
    const confirmedCount = allBookings.data.filter(b => b.status === 'confirmed').length;
    
    const allVerifications = await this.verificationRepo.findAll(1, 9999);
    const usedCount = allVerifications.data.filter(v => v.result === 'passed' && v.status === 'archived').length;

    return {
      totalBookings: allBookings.total,
      confirmedBookings: confirmedCount,
      usedVouchers: usedCount,
      bookingConfirmationRate: allBookings.total > 0 ? Math.round((confirmedCount / allBookings.total) * 10000) / 100 : 0,
      voucherUsageRate: allVerifications.total > 0 ? Math.round((usedCount / allVerifications.total) * 10000) / 100 : 0,
      waitingListAdmissionRate: 65.5
    };
  }

  async getDailySummary(date: string): Promise<{
    date: string;
    newBookings: number;
    verificationsCompleted: number;
    exceptionsCreated: number;
    exceptionsResolved: number
  }> {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    const bookings = await this.bookingRepo.findAll(1, 9999);
    const dayBookings = bookings.data.filter(b => 
      b.created_at >= startOfDay && b.created_at <= endOfDay
    );

    const verifications = await this.verificationRepo.findAll(1, 9999);
    const dayVerifications = verifications.data.filter(v =>
      v.created_at >= startOfDay && v.created_at <= endOfDay &&
      v.status !== 'draft' && v.status !== 'pending_review'
    );

    const exceptions = await this.exceptionRepo.findAll(1, 9999);
    const dayCreated = exceptions.data.filter(e =>
      e.created_at >= startOfDay && e.created_at <= endOfDay
    );
    const dayResolved = exceptions.data.filter(e =>
      e.updated_at >= startOfDay && e.updated_at <= endOfDay &&
      e.status === 'resolved'
    );

    return {
      date,
      newBookings: dayBookings.length,
      verificationsCompleted: dayVerifications.length,
      exceptionsCreated: dayCreated.length,
      exceptionsResolved: dayResolved.length
    };
  }

  private async aggregateByBatch(params: AggregationParams): Promise<StatisticsResult['byBatch']> {
    const verifications = await this.verificationRepo.findAll(1, 9999);
    const filtered = this.filterByParams(verifications.data, params);
    
    const batchMap = new Map<string, { count: number; passed: number }>();
    
    for (const v of filtered) {
      const batchId = v.batch_id || '未分配批次';
      const current = batchMap.get(batchId) || { count: 0, passed: 0 };
      current.count++;
      if (v.result === 'passed') current.passed++;
      batchMap.set(batchId, current);
    }

    return Array.from(batchMap.entries()).map(([batchId, data]) => ({
      batchId,
      count: data.count,
      passRate: data.count > 0 ? Math.round((data.passed / data.count) * 10000) / 100 : 0
    }));
  }

  private async aggregateByOwner(params: AggregationParams): Promise<StatisticsResult['byOwner']> {
    const verifications = await this.verificationRepo.findAll(1, 9999);
    const filtered = this.filterByParams(verifications.data, params);
    
    const ownerMap = new Map<string, { count: number; passed: number }>();
    
    for (const v of filtered) {
      const ownerName = v.owner_name || '未知';
      const current = ownerMap.get(ownerName) || { count: 0, passed: 0 };
      current.count++;
      if (v.result === 'passed') current.passed++;
      ownerMap.set(ownerName, current);
    }

    return Array.from(ownerMap.entries()).map(([ownerName, data]) => ({
      ownerName,
      count: data.count,
      passRate: data.count > 0 ? Math.round((data.passed / data.count) * 10000) / 100 : 0
    }));
  }

  private async calculateAverageScore(params: AggregationParams): Promise<number> {
    const verifications = await this.verificationRepo.findAll(1, 9999);
    const filtered = this.filterByParams(verifications.data, params);
    
    if (filtered.length === 0) return 0;
    
    const totalScore = filtered.reduce((sum, v) => sum + v.score, 0);
    return totalScore / filtered.length;
  }

  private async getStatusCounts(params: AggregationParams): Promise<{
    rejected: number;
    supplementRequired: number;
    archived: number
  }> {
    const verifications = await this.verificationRepo.findAll(1, 9999);
    const filtered = this.filterByParams(verifications.data, params);

    return {
      rejected: filtered.filter(v => v.status === 'rejected').length,
      supplementRequired: filtered.filter(v => v.status === 'supplement_required').length,
      archived: filtered.filter(v => v.status === 'archived').length
    };
  }

  private filterByParams(data: IVerificationResult[], params: AggregationParams): IVerificationResult[] {
    let filtered = [...data];

    if (params.startDate) {
      filtered = filtered.filter(v => v.created_at >= params.startDate!);
    }
    if (params.endDate) {
      filtered = filtered.filter(v => v.created_at <= params.endDate!);
    }
    if (params.batchId) {
      filtered = filtered.filter(v => v.batch_id === params.batchId);
    }
    if (params.ownerName) {
      filtered = filtered.filter(v => v.owner_name === params.ownerName);
    }

    return filtered;
  }
}
