import { FlightPeriodRepository } from '../repositories/flightPeriod.repository';
import { BookingRecordRepository } from '../repositories/bookingRecord.repository';
import { IFlightPeriod, IBookingRecord } from '../models/entities';

export interface ArchiveResult {
  archivedCount: number;
  snapshotData: Array<{
    periodId: string;
    code: string;
    finalUsedCount: number;
    capacity: number;
    utilizationRate: number
  }>;
}

export class FlightPeriodArchiveService {
  private flightRepo: FlightPeriodRepository;
  private bookingRepo: BookingRecordRepository;

  constructor() {
    this.flightRepo = new FlightPeriodRepository();
    this.bookingRepo = new BookingRecordRepository();
  }

  async archiveExpiredPeriods(beforeDate?: string): Promise<ArchiveResult> {
    const dateToUse = beforeDate || new Date().toISOString();
    
    const allPeriods = await this.flightRepo.findAll(1, 9999);
    const expiredPeriods = allPeriods.data.filter(p => 
      p.departure_time < dateToUse && p.status !== 'archived'
    );

    const snapshotData: ArchiveResult['snapshotData'] = [];

    for (const period of expiredPeriods) {
      const bookings = await this.bookingRepo.findByMemberId(period.id);
      
      snapshotData.push({
        periodId: period.id,
        code: period.code,
        finalUsedCount: period.used_count,
        capacity: period.capacity,
        utilizationRate: period.capacity > 0 ? Math.round((period.used_count / period.capacity) * 10000) / 100 : 0
      });
    }

    const archivedCount = await this.flightRepo.archiveByDate(dateToUse);

    return {
      archivedCount,
      snapshotData
    };
  }

  async createSnapshot(periodId: string): Promise<{
    period: IFlightPeriod;
    relatedBookings: IBookingRecord[];
    utilizationRate: number;
    timestamp: string
  }> {
    const period = await this.flightRepo.findById(periodId);
    if (!period) {
      throw new Error('航班时段不存在');
    }

    const allBookings = await this.bookingRepo.findAll(1, 9999);
    const relatedBookings = allBookings.data.filter(b => 
      b.flight_number === period.flight_number &&
      b.flight_date?.split('T')[0] === period.departure_time.split('T')[0]
    );

    return {
      period,
      relatedBookings,
      utilizationRate: period.capacity > 0 ? Math.round((period.used_count / period.capacity) * 10000) / 100 : 0,
      timestamp: new Date().toISOString()
    };
  }

  async getUtilizationReport(params: {
    startDate?: string;
    endDate?: string;
    airportCode?: string
  }): Promise<{
    totalPeriods: number;
    averageUtilization: number;
    peakPeriods: Array<{
      code: string;
      flightNumber: string;
      utilizationRate: number
    }>;
    lowPeriods: Array<{
      code: string;
      flightNumber: string;
      utilizationRate: number
    }>
  }> {
    const allPeriods = await this.flightRepo.findAll(1, 9999);
    let filtered = allPeriods.data;

    if (params.startDate) {
      filtered = filtered.filter(p => p.departure_time >= params.startDate!);
    }
    if (params.endDate) {
      filtered = filtered.filter(p => p.departure_time <= params.endDate!);
    }
    if (params.airportCode) {
      filtered = filtered.filter(p => p.airport_code === params.airportCode);
    }

    const periodsWithData = filtered.filter(p => p.capacity > 0);
    const totalUtilization = periodsWithData.reduce((sum, p) => 
      sum + (p.used_count / p.capacity), 0
    );

    const withRates = periodsWithData.map(p => ({
      code: p.code,
      flightNumber: p.flight_number,
      utilizationRate: Math.round((p.used_count / p.capacity) * 10000) / 100
    }));

    withRates.sort((a, b) => b.utilizationRate - a.utilizationRate);

    return {
      totalPeriods: filtered.length,
      averageUtilization: periodsWithData.length > 0 
        ? Math.round((totalUtilization / periodsWithData.length) * 10000) / 100 
        : 0,
      peakPeriods: withRates.filter(p => p.utilizationRate >= 80).slice(0, 5),
      lowPeriods: withRates.filter(p => p.utilizationRate < 40).slice(0, 5)
    };
  }
}
