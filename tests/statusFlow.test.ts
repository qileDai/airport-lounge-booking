import { initDatabase } from '../src/db/init';
import { seedDatabase } from '../src/db/seed';
import { closeDatabase, getDatabase } from '../src/db/database';
import { StatusFlowService } from '../src/services/statusFlowService';
import { StatusTransitionError, BusinessRuleError } from '../src/utils/errors';

let statusFlowService: StatusFlowService;

beforeAll(() => {
  const dbPath = ':memory:';
  closeDatabase();
  getDatabase(dbPath);
  initDatabase(dbPath);
  seedDatabase();
  statusFlowService = new StatusFlowService();
});

afterAll(() => {
  closeDatabase();
});

describe('StatusFlowService', () => {
  test('should allow valid transition from draft to pending_review', () => {
    const record = statusFlowService.transition(
      'member_benefit', 99, 'draft', 'pending_review', 'submit', '测试员'
    );
    expect(record.from_status).toBe('draft');
    expect(record.to_status).toBe('pending_review');
    expect(record.status).toBe('confirmed');
  });

  test('should allow valid transition from pending_review to confirmed', () => {
    const record = statusFlowService.transition(
      'member_benefit', 99, 'pending_review', 'confirmed', 'approve', '审核员'
    );
    expect(record.from_status).toBe('pending_review');
    expect(record.to_status).toBe('confirmed');
  });

  test('should allow valid transition from pending_review to rejected', () => {
    const record = statusFlowService.transition(
      'reservation', 99, 'pending_review', 'rejected', 'reject', '审核员', '信息不完整'
    );
    expect(record.to_status).toBe('rejected');
    expect(record.reject_reason).toBe('信息不完整');
  });

  test('should reject transition without reject_reason for rejection', () => {
    expect(() => {
      statusFlowService.transition(
        'reservation', 99, 'pending_review', 'rejected', 'reject', '审核员'
      );
    }).toThrow(BusinessRuleError);
  });

  test('should reject invalid transition from draft to confirmed', () => {
    expect(() => {
      statusFlowService.transition(
        'member_benefit', 99, 'draft', 'confirmed', 'approve', '测试员'
      );
    }).toThrow(StatusTransitionError);
  });

  test('should reject invalid transition from archived to any status', () => {
    expect(() => {
      statusFlowService.transition(
        'member_benefit', 99, 'archived', 'draft', 'revert', '测试员'
      );
    }).toThrow(StatusTransitionError);
  });

  test('should allow transition from rejected to pending_supplement', () => {
    const record = statusFlowService.transition(
      'reservation', 99, 'rejected', 'pending_supplement', 'rework', '测试员'
    );
    expect(record.to_status).toBe('pending_supplement');
  });

  test('should allow transition from confirmed to archived', () => {
    const record = statusFlowService.transition(
      'member_benefit', 99, 'confirmed', 'archived', 'archive', '测试员'
    );
    expect(record.to_status).toBe('archived');
  });

  test('should get allowed transitions for a status', () => {
    const transitions = statusFlowService.getAllowedTransitions('draft');
    expect(transitions).toContain('pending_review');
    expect(transitions).toContain('pending_supplement');
    expect(transitions).not.toContain('confirmed');
  });

  test('should validate transition correctly', () => {
    expect(statusFlowService.validateTransition('draft', 'pending_review')).toBe(true);
    expect(statusFlowService.validateTransition('draft', 'confirmed')).toBe(false);
    expect(statusFlowService.validateTransition('archived', 'draft')).toBe(false);
  });

  test('should get status flow records by entity', () => {
    const records = statusFlowService.getByEntity('member_benefit', 1);
    expect(Array.isArray(records)).toBe(true);
  });
});
