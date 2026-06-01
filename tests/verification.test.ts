import { initDatabase } from '../src/db/init';
import { seedDatabase } from '../src/db/seed';
import { closeDatabase, getDatabase } from '../src/db/database';
import { VerificationService } from '../src/services/verificationService';
import { MemberBenefitService } from '../src/services/memberBenefitService';
import { ReservationService } from '../src/services/reservationService';
import { FlightSlotService } from '../src/services/flightSlotService';
import { StatusFlowService } from '../src/services/statusFlowService';

let verificationService: VerificationService;
let memberBenefitService: MemberBenefitService;
let reservationService: ReservationService;
let flightSlotService: FlightSlotService;
let statusFlowService: StatusFlowService;

beforeAll(() => {
  const dbPath = ':memory:';
  closeDatabase();
  getDatabase(dbPath);
  initDatabase(dbPath);
  seedDatabase();
  verificationService = new VerificationService();
  memberBenefitService = new MemberBenefitService();
  reservationService = new ReservationService();
  flightSlotService = new FlightSlotService();
  statusFlowService = new StatusFlowService();
});

afterAll(() => {
  closeDatabase();
});

describe('VerificationService', () => {
  test('should verify a valid reservation successfully', () => {
    const result = verificationService.verify(1, 'test_operator');
    expect(result.result).toBe('passed');
    expect(result.status).toBe('confirmed');
    expect(result.reservation_id).toBe(1);
  });

  test('should fail verification for expired benefit', () => {
    const result = verificationService.verify(3, 'test_operator');
    expect(result.result).toBe('failed');
    expect(result.fail_reason).toContain('过期');
  });

  test('should save as draft when missing key fields', () => {
    const reservation = reservationService.create({
      code: 'RSV-TEST-DRAFT-001',
      name: '测试草稿预约-缺少航班时段',
      status: 'draft',
      responsible_person: '测试员',
      member_benefit_id: 1,
      flight_slot_id: null,
      companion_count: 0,
      batch_no: 'BATCH-TEST',
      remark: '测试',
    }, 'test_operator');

    const result = verificationService.verify(reservation.id, 'test_operator');
    expect(result.result).toBe('inconclusive');
    expect(result.status).toBe('draft');
    expect(result.fail_reason).toContain('缺少关键字段');
  });

  test('should fail verification for benefit with pending_review status', () => {
    const reservation = reservationService.create({
      code: 'RSV-TEST-PENDING-001',
      name: '测试待复核预约',
      status: 'pending_review',
      responsible_person: '测试员',
      member_benefit_id: 6,
      flight_slot_id: 6,
      companion_count: 0,
      batch_no: 'BATCH-TEST',
      remark: '测试',
    }, 'test_operator');

    const result = verificationService.verify(reservation.id, 'test_operator');
    expect(result.result).toBe('failed');
    expect(result.fail_reason).toContain('非已确认状态');
  });

  test('should fail verification when flight slot is full', () => {
    const slot = flightSlotService.create({
      code: 'FLT-TEST-FULL-001',
      name: '测试满员航班时段',
      status: 'confirmed',
      responsible_person: '测试员',
      airport_code: 'TST',
      flight_number: 'XX9999',
      departure_time: '2026-05-25T10:00:00',
      arrival_time: '2026-05-25T13:00:00',
      capacity: 5,
      used_count: 5,
      is_archived: 0,
      snapshot_data: null,
      batch_no: 'BATCH-TEST',
      remark: '满员测试',
    }, 'test_operator');

    const reservation = reservationService.create({
      code: 'RSV-TEST-FULL-001',
      name: '测试满员预约',
      status: 'draft',
      responsible_person: '测试员',
      member_benefit_id: 1,
      flight_slot_id: slot.id,
      companion_count: 0,
      batch_no: 'BATCH-TEST',
      remark: '满员测试',
    }, 'test_operator');

    const result = verificationService.verify(reservation.id, 'test_operator');
    expect(result.result).toBe('failed');
    expect(result.fail_reason).toContain('容量已满');
  });
});
