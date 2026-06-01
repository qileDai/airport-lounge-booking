import { Router, Request, Response } from 'express';
import { StatisticsAggregationService } from '../services/statisticsAggregation.service';
import { asyncHandler, successResponse } from '../utils/apiResponse';

const router = Router();
const service = new StatisticsAggregationService();

router.get('/verification', asyncHandler(async (req: Request, res: Response) => {
  const stats = await service.getVerificationStatistics({
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    batchId: req.query.batchId as string,
    ownerName: req.query.ownerName as string
  });
  res.json(successResponse(stats));
}));

router.get('/usage-rate', asyncHandler(async (req: Request, res: Response) => {
  const stats = await service.getUsageRateStatistics();
  res.json(successResponse(stats));
}));

router.get('/daily/:date', asyncHandler(async (req: Request, res: Response) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.params.date)) {
    throw new Error('日期格式不正确，请使用 YYYY-MM-DD 格式');
  }
  
  const summary = await service.getDailySummary(req.params.date);
  res.json(successResponse(summary));
}));

export default router;
