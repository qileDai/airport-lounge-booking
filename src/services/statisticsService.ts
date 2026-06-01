import { VerificationResultRepo } from '../repositories/verificationResultRepo';
import { WaitlistRepo } from '../repositories/waitlistRepo';
import { UsageVoucherRepo } from '../repositories/usageVoucherRepo';
import { AuditLogRepo } from '../repositories/auditLogRepo';
import { StatisticsFilter, StatisticsResult } from '../schemas';

const verificationResultRepo = new VerificationResultRepo();
const waitlistRepo = new WaitlistRepo();
const usageVoucherRepo = new UsageVoucherRepo();
const auditLogRepo = new AuditLogRepo();

export class StatisticsService {
  verificationRate(filter: StatisticsFilter): StatisticsResult[] {
    const allResults = verificationResultRepo.findAll();
    return this.aggregateResults(allResults, filter, 'verification');
  }

  waitlistTransferRate(filter: StatisticsFilter): StatisticsResult[] {
    const allWaitlist = waitlistRepo.findAll();
    const groups = this.groupBy(allWaitlist, filter.group_by);

    const results: StatisticsResult[] = [];
    for (const [key, items] of groups.entries()) {
      const total = items.length;
      const transferred = items.filter(i => i.status === 'transferred').length;
      const waiting = items.filter(i => i.status === 'waiting').length;
      const rate = total > 0 ? Math.round((transferred / total) * 10000) / 100 : 0;

      results.push({
        group_key: key,
        total_count: total,
        passed_count: transferred,
        failed_count: waiting,
        rate,
        details: items.map(i => ({
          id: i.id,
          code: i.code,
          result: i.status,
          created_at: i.created_at,
        })),
      });
    }

    return results;
  }

  usageRate(filter: StatisticsFilter): StatisticsResult[] {
    const allVouchers = usageVoucherRepo.findAll();
    const groups = this.groupBy(allVouchers, filter.group_by);

    const results: StatisticsResult[] = [];
    for (const [key, items] of groups.entries()) {
      const total = items.length;
      const used = items.filter(i => i.status === 'used').length;
      const unused = items.filter(i => i.status !== 'used').length;
      const rate = total > 0 ? Math.round((used / total) * 10000) / 100 : 0;

      results.push({
        group_key: key,
        total_count: total,
        passed_count: used,
        failed_count: unused,
        rate,
        details: items.map(i => ({
          id: i.id,
          code: i.code,
          result: i.status,
          created_at: i.created_at,
        })),
      });
    }

    return results;
  }

  private aggregateResults(
    items: any[],
    filter: StatisticsFilter,
    type: string
  ): StatisticsResult[] {
    let filtered = items;

    if (filter.start_date) {
      filtered = filtered.filter(i => i.created_at >= filter.start_date!);
    }
    if (filter.end_date) {
      filtered = filtered.filter(i => i.created_at <= filter.end_date!);
    }
    if (filter.batch_no) {
      filtered = filtered.filter(i => i.batch_no === filter.batch_no);
    }
    if (filter.responsible_person) {
      filtered = filtered.filter(i => i.responsible_person === filter.responsible_person);
    }

    const groups = this.groupBy(filtered, filter.group_by);

    const results: StatisticsResult[] = [];
    for (const [key, groupItems] of groups.entries()) {
      const total = groupItems.length;
      const passed = groupItems.filter(i => i.result === 'passed').length;
      const failed = groupItems.filter(i => i.result === 'failed').length;
      const rate = total > 0 ? Math.round((passed / total) * 10000) / 100 : 0;

      results.push({
        group_key: key,
        total_count: total,
        passed_count: passed,
        failed_count: failed,
        rate,
        details: groupItems.map(i => ({
          id: i.id,
          code: i.code,
          result: i.result || i.status,
          created_at: i.created_at,
        })),
      });
    }

    return results;
  }

  private groupBy(items: any[], key: string): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    for (const item of items) {
      let groupKey: string;
      switch (key) {
        case 'day':
          groupKey = (item.created_at || '').slice(0, 10);
          break;
        case 'batch':
          groupKey = item.batch_no || 'no-batch';
          break;
        case 'responsible_person':
          groupKey = item.responsible_person || 'unknown';
          break;
        default:
          groupKey = 'all';
      }
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(item);
    }
    return groups;
  }
}
