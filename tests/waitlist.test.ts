import { initDatabase } from '../src/db/init';
import { seedDatabase } from '../src/db/seed';
import { closeDatabase, getDatabase } from '../src/db/database';
import { WaitlistService } from '../src/services/waitlistService';
import { PriorityCalculationService } from '../src/services/priorityCalculationService';
import { FlightSlotService } from '../src/services/flightSlotService';

let waitlistService: WaitlistService;
let priorityCalculationService: PriorityCalculationService;
let flightSlotService: FlightSlotService;

beforeAll(() => {
  const dbPath = ':memory:';
  closeDatabase();
  getDatabase(dbPath);
  initDatabase(dbPath);
  seedDatabase();
  waitlistService = new WaitlistService();
  priorityCalculationService = new PriorityCalculationService();
  flightSlotService = new FlightSlotService();
});

afterAll(() => {
  closeDatabase();
});

describe('PriorityCalculationService', () => {
  test('should calculate priority for diamond member correctly', () => {
    const result = priorityCalculationService.calculate({
      member_level: 'diamond',
      remaining_quota: 8,
      total_quota: 12,
      departure_time: '2026-05-25T08:00:00',
      wait_start_time: '2026-05-24T20:00:00',
    });
    expect(result.member_level_weight).toBe(40);
    expect(result.quota_weight).toBeCloseTo(20, 0);
    expect(result.total_score).toBeGreaterThan(0);
  });

  test('should calculate priority for silver member correctly', () => {
    const result = priorityCalculationService.calculate({
      member_level: 'silver',
      remaining_quota: 1,
      total_quota: 3,
      departure_time: '2026-05-25T20:00:00',
      wait_start_time: null,
    });
    expect(result.member_level_weight).toBe(10);
    expect(result.quota_weight).toBeCloseTo(10, 0);
  });

  test('should give higher flight slot weight for imminent departure', () => {
    const imminent = priorityCalculationService.calculate({
      member_level: 'gold',
      remaining_quota: 2,
      total_quota: 4,
      departure_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      wait_start_time: null,
    });
    const later = priorityCalculationService.calculate({
      member_level: 'gold',
      remaining_quota: 2,
      total_quota: 4,
      departure_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      wait_start_time: null,
    });
    expect(imminent.flight_slot_weight).toBeGreaterThanOrEqual(later.flight_slot_weight);
  });

  test('should give higher wait time weight for longer waiting', () => {
    const longWait = priorityCalculationService.calculate({
      member_level: 'gold',
      remaining_quota: 2,
      total_quota: 4,
      departure_time: null,
      wait_start_time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    });
    const shortWait = priorityCalculationService.calculate({
      member_level: 'gold',
      remaining_quota: 2,
      total_quota: 4,
      departure_time: null,
      wait_start_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    });
    expect(longWait.wait_time_weight).toBeGreaterThan(shortWait.wait_time_weight);
  });
});

describe('WaitlistService', () => {
  test('should get all waitlist entries', () => {
    const entries = waitlistService.getAll();
    expect(entries.length).toBeGreaterThan(0);
  });

  test('should get waiting entries by flight slot', () => {
    const entries = waitlistService.getWaitingByFlightSlot(1);
    expect(Array.isArray(entries)).toBe(true);
  });

  test('should arrange waitlist entries when capacity available', () => {
    const slot = flightSlotService.create({
      code: 'FLT-WTL-TEST-001',
      name: '候补测试航班时段',
      status: 'confirmed',
      responsible_person: '测试员',
      airport_code: 'TST',
      flight_number: 'XX0001',
      departure_time: '2026-05-25T10:00:00',
      arrival_time: '2026-05-25T13:00:00',
      capacity: 50,
      used_count: 5,
      is_archived: 0,
      snapshot_data: null,
      batch_no: 'BATCH-TEST',
      remark: '候补测试',
    }, 'test_operator');

    const waitlist = waitlistService.create({
      code: 'WTL-TEST-001',
      name: '候补测试条目',
      status: 'waiting',
      responsible_person: '测试员',
      member_benefit_id: 1,
      flight_slot_id: slot.id,
      wait_start_time: '2026-05-24T20:00:00',
      priority_score: 75.0,
      batch_no: 'BATCH-TEST',
      remark: '候补测试',
    }, 'test_operator');

    const transferred = waitlistService.arrange(slot.id, 'test_operator');
    expect(transferred.length).toBeGreaterThanOrEqual(1);
    expect(transferred[0].status).toBe('transferred');
  });
});
