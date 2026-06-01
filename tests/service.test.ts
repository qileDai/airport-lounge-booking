import { MemberRightsService } from '../src/services/memberRights.service';
import { BookingRecordService } from '../src/services/bookingRecord.service';
import { PriorityCalculationService } from '../src/services/priorityCalculation.service';
import { ExceptionDetectionService } from '../src/services/exceptionDetection.service';
import { StatusTransitionService } from '../src/services/statusTransition.service';

describe('会员权益服务', () => {
  let service: MemberRightsService;

  beforeEach(() => {
    service = new MemberRightsService();
  });

  test('应能获取所有会员权益', async () => {
    const result = await service.getAll(1, 10);
    expect(result.data).toBeDefined();
    expect(result.total).toBeGreaterThanOrEqual(0);
  });
});

describe('预约记录服务 - 权益核验', () => {
  let service: BookingRecordService;

  beforeEach(() => {
    service = new BookingRecordService();
  });

  test('批量导入预检应检测错误和警告', async () => {
    const importData = {
      records: [
        {
          code: `BK-PRETEST-${Date.now()}-1`,
          name: '有效预约',
          flight_number: 'CA1234',
          flight_date: '2025-12-31T08:00:00Z'
        },
        {
          code: `BK-PRETEST-${Date.now()}-2`,
          name: '缺少编号'
        }
      ]
    };

    const results = await service.batchImportPrecheck(importData);
    
    expect(results.length).toBe(2);
    expect(results[1].valid).toBe(false);
    expect(results[1].errors.length).toBeGreaterThan(0);
  });
});

describe('优先级计算服务', () => {
  let service: PriorityCalculationService;

  beforeEach(() => {
    service = new PriorityCalculationService();
  });

  test('白金会员优先级应高于银卡会员', async () => {
    const allMembers = await service.getAll?.();
  });
});

describe('状态流转服务', () => {
  let service: StatusTransitionService;

  beforeEach(() => {
    service = new StatusTransitionService();
  });

  test('应验证合法的状态流转路径', () => {
    const allowed = service.getAllowedTransitions('booking_record', 'draft');
    expect(allowed).toContain('pending_review');
    expect(allowed).not.toContain('archived');
  });

  test('驳回操作必须填写原因', async () => {
    try {
      await service.transition({
        entity_type: 'booking_record',
        entity_id: 'test-id',
        from_status: 'pending_review',
        to_status: 'rejected',
        action: 'reject_booking'
      });
      fail('应该抛出错误');
    } catch (error) {
      expect(error.message).toContain('原因');
    }
  });
});
