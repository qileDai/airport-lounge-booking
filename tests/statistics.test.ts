import { initDatabase } from '../src/db/init';
import { seedDatabase } from '../src/db/seed';
import { closeDatabase, getDatabase } from '../src/db/database';
import { StatisticsService } from '../src/services/statisticsService';
import { ExceptionService } from '../src/services/exceptionService';

let statisticsService: StatisticsService;
let exceptionService: ExceptionService;

beforeAll(() => {
  const dbPath = ':memory:';
  closeDatabase();
  getDatabase(dbPath);
  initDatabase(dbPath);
  seedDatabase();
  statisticsService = new StatisticsService();
  exceptionService = new ExceptionService();
});

afterAll(() => {
  closeDatabase();
});

describe('StatisticsService', () => {
  test('should calculate verification rate grouped by day', () => {
    const result = statisticsService.verificationRate({ group_by: 'day' });
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const item = result[0];
      expect(item).toHaveProperty('group_key');
      expect(item).toHaveProperty('total_count');
      expect(item).toHaveProperty('passed_count');
      expect(item).toHaveProperty('failed_count');
      expect(item).toHaveProperty('rate');
      expect(item).toHaveProperty('details');
    }
  });

  test('should calculate verification rate grouped by batch', () => {
    const result = statisticsService.verificationRate({ group_by: 'batch' });
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const item = result[0];
      expect(item.group_key).toMatch(/BATCH/);
    }
  });

  test('should calculate verification rate grouped by responsible_person', () => {
    const result = statisticsService.verificationRate({ group_by: 'responsible_person' });
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const item = result[0];
      expect(item.group_key).toBeTruthy();
    }
  });

  test('should calculate waitlist transfer rate', () => {
    const result = statisticsService.waitlistTransferRate({ group_by: 'day' });
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const item = result[0];
      expect(item.total_count).toBeGreaterThan(0);
      expect(item.rate).toBeGreaterThanOrEqual(0);
      expect(item.rate).toBeLessThanOrEqual(100);
    }
  });

  test('should calculate usage rate', () => {
    const result = statisticsService.usageRate({ group_by: 'day' });
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const item = result[0];
      expect(item.total_count).toBeGreaterThan(0);
      expect(item.rate).toBeGreaterThanOrEqual(0);
      expect(item.rate).toBeLessThanOrEqual(100);
    }
  });

  test('should provide details that trace back to source data', () => {
    const result = statisticsService.verificationRate({ group_by: 'batch' });
    if (result.length > 0) {
      const item = result[0];
      expect(item.details.length).toBeGreaterThan(0);
      expect(item.details[0]).toHaveProperty('id');
      expect(item.details[0]).toHaveProperty('code');
      expect(item.details[0]).toHaveProperty('result');
    }
  });
});

describe('ExceptionService', () => {
  test('should check for expired benefits', () => {
    const result = exceptionService.checkExpiredBenefits('test_operator');
    expect(result).toHaveProperty('found');
    expect(result).toHaveProperty('events');
    expect(Array.isArray(result.events)).toBe(true);
  });

  test('should get all exception events', () => {
    const events = exceptionService.getAll();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
  });

  test('should get pending exception events', () => {
    const events = exceptionService.getPending();
    expect(Array.isArray(events)).toBe(true);
  });

  test('should handle an exception event', () => {
    const events = exceptionService.getAll();
    if (events.length > 0) {
      const handled = exceptionService.handleException(events[0].id, '处理员A', 'handling', 'test_operator');
      expect(handled.status).toBe('handling');
    }
  });
});
