import { BookingRecordRepository } from '../repositories/bookingRecord.repository';
import { MemberRightsRepository } from '../repositories/memberRights.repository';
import { FlightPeriodRepository } from '../repositories/flightPeriod.repository';
import { CompanionRepository } from '../repositories/companion.repository';
import { IBookingRecord, IMemberRights, IFlightPeriod, ICompanion } from '../models/entities';
import { CreateBookingRecordDTO, UpdateBookingRecordDTO, BatchImportBookingDTO, PrecheckResult } from '../schemas/bookingRecord.dto';

export class BookingRecordService {
  private bookingRepo: BookingRecordRepository;
  private memberRepo: MemberRightsRepository;
  private flightRepo: FlightPeriodRepository;
  private companionRepo: CompanionRepository;

  constructor() {
    this.bookingRepo = new BookingRecordRepository();
    this.memberRepo = new MemberRightsRepository();
    this.flightRepo = new FlightPeriodRepository();
    this.companionRepo = new CompanionRepository();
  }

  async getAll(page = 1, limit = 10) {
    return this.bookingRepo.findAll(page, limit);
  }

  async getById(id: string) {
    const booking = await this.bookingRepo.findById(id);
    if (!booking) {
      throw new Error('预约记录不存在');
    }
    return booking;
  }

  async create(data: CreateBookingRecordDTO): Promise<IBookingRecord> {
    const existing = await this.bookingRepo.findByCode(data.code);
    if (existing) {
      throw new Error(`预约编号 ${data.code} 已存在`);
    }

    if (data.member_id) {
      const member = await this.memberRepo.findById(data.member_id);
      if (!member) {
        throw new Error('关联的会员权益不存在');
      }
    }

    return this.bookingRepo.create({
      ...data,
      status: 'draft',
      companion_count: data.companion_count || 0
    });
  }

  async update(id: string, data: UpdateBookingRecordDTO): Promise<IBookingRecord> {
    const existing = await this.getById(id);
    
    if (data.member_id) {
      const member = await this.memberRepo.findById(data.member_id);
      if (!member) {
        throw new Error('关联的会员权益不存在');
      }
    }

    return this.bookingRepo.update(id, data) as Promise<IBookingRecord>;
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.bookingRepo.delete(id);
  }

  async batchImportPrecheck(data: BatchImportBookingDTO): Promise<PrecheckResult[]> {
    const results: PrecheckResult[] = [];
    
    for (const record of data.records) {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!record.code || !record.name) {
        errors.push('缺少必填字段：编号或名称');
      }

      const existingCode = await this.bookingRepo.findByCode(record.code);
      if (existingCode) {
        errors.push(`预约编号 ${record.code} 已存在`);
      }

      if (record.member_id) {
        const member = await this.memberRepo.findById(record.member_id);
        if (!member) {
          errors.push(`关联的会员权益 ${record.member_id} 不存在`);
        } else if (member.status !== 'active') {
          warnings.push(`会员权益状态为 ${member.status}，可能影响核验`);
        }
        
        if (member.remaining_quota <= 0) {
          warnings.push('该会员剩余额度为0，无法完成新预约');
        }
      }

      if (!record.flight_number) {
        warnings.push('缺少航班信息，将保存为草稿状态');
      }

      if (!record.flight_date) {
        warnings.push('缺少航班日期，将保存为草稿状态');
      }

      if (record.flight_number && record.flight_date) {
        const flightDate = new Date(record.flight_date);
        const now = new Date();
        if (flightDate < now) {
          warnings.push('航班日期已过，请确认是否正确');
        }
      }

      results.push({
        code: record.code,
        valid: errors.length === 0,
        errors,
        warnings
      });
    }

    return results;
  }

  async verifyEligibility(bookingId: string): Promise<{
    eligible: boolean;
    score: number;
    violations: string[];
    canSubmit: boolean
  }> {
    const booking = await this.getById(bookingId);
    const violations: string[] = [];
    let score = 100;

    if (!booking.member_id) {
      violations.push('未关联会员权益');
      score -= 30;
    } else {
      const member = await this.memberRepo.findById(booking.member_id);
      if (!member) {
        violations.push('关联的会员权益不存在');
        score -= 40;
      } else {
        if (member.status !== 'active') {
          violations.push(`会员权益状态异常：${member.status}`);
          score -= 35;
        }

        const now = new Date();
        if (now > new Date(member.valid_to)) {
          violations.push('会员权益已过期');
          score -= 50;
        } else if (now > new Date(member.valid_from)) {
          const daysLeft = Math.ceil((new Date(member.valid_to).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysLeft < 7) {
            violations.push(`会员权益即将过期，剩余${daysLeft}天`);
            score -= 15;
          }
        }

        if (member.remaining_quota <= 0) {
          violations.push('会员权益额度已用完');
          score -= 25;
        }
      }
    }

    if (!booking.flight_number) {
      violations.push('缺少航班号信息');
      score -= 20;
    }

    if (!booking.flight_date) {
      violations.push('缺少航班日期信息');
      score -= 20;
    }

    if (booking.flight_date) {
      const flightDate = new Date(booking.flight_date);
      const now = new Date();
      if (flightDate < now) {
        violations.push('航班日期已过去');
        score -= 15;
      }
    }

    const companions = await this.companionRepo.findByBookingId(bookingId);
    if (companions.length > 0) {
      const unverifiedCount = companions.filter(c => !c.is_verified).length;
      if (unverifiedCount > 0) {
        violations.push(`${unverifiedCount}位同行人未通过身份核验`);
        score -= unverifiedCount * 5;
      }
    }

    score = Math.max(0, score);

    return {
      eligible: score >= 60,
      score,
      violations,
      canSubmit: booking.status === 'draft' || violations.length === 0
    };
  }
}
