import { MemberRightsRepository } from '../repositories/memberRights.repository';
import { IMemberRights } from '../models/entities';
import { CreateMemberRightsDTO, UpdateMemberRightsDTO } from '../schemas/memberRights.dto';

export class MemberRightsService {
  private repository: MemberRightsRepository;

  constructor() {
    this.repository = new MemberRightsRepository();
  }

  async getAll(page = 1, limit = 10) {
    return this.repository.findAll(page, limit);
  }

  async getById(id: string) {
    const member = await this.repository.findById(id);
    if (!member) {
      throw new Error('会员权益记录不存在');
    }
    return member;
  }

  async getByCode(code: string) {
    const member = await this.repository.findByCode(code);
    if (!member) {
      throw new Error('会员权益记录不存在');
    }
    return member;
  }

  async create(data: CreateMemberRightsDTO): Promise<IMemberRights> {
    const existing = await this.repository.findByCode(data.code);
    if (existing) {
      throw new Error(`编号 ${data.code} 已存在`);
    }

    if (new Date(data.valid_to) <= new Date(data.valid_from)) {
      throw new Error('有效期结束时间必须晚于开始时间');
    }

    return this.repository.create({
      ...data,
      status: data.status || 'active',
      remaining_quota: data.remaining_quota ?? data.total_quota ?? 0,
      total_quota: data.total_quota ?? 0
    });
  }

  async update(id: string, data: UpdateMemberRightsDTO): Promise<IMemberRights> {
    const existing = await this.getById(id);
    
    if (data.valid_from && data.valid_to && new Date(data.valid_to) <= new Date(data.valid_from)) {
      throw new Error('有效期结束时间必须晚于开始时间');
    }

    if (data.remaining_quota !== undefined && data.total_quota !== undefined) {
      if (data.remaining_quota > data.total_quota) {
        throw new Error('剩余额度不能超过总额度');
      }
    }

    return this.repository.update(id, data) as Promise<IMemberRights>;
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repository.delete(id);
  }

  async getByStatus(status: string): Promise<IMemberRights[]> {
    return this.repository.findByStatus(status);
  }

  async getByLevel(level: string): Promise<IMemberRights[]> {
    return this.repository.findByMemberLevel(level);
  }

  async checkExpiry(memberId: string): Promise<{
    isExpired: boolean;
    daysUntilExpiry: number;
    member: IMemberRights
  }> {
    const member = await this.getById(memberId);
    const now = new Date();
    const expiryDate = new Date(member.valid_to);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      isExpired: daysUntilExpiry < 0,
      daysUntilExpiry,
      member
    };
  }
}
