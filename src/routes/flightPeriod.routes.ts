import { Router, Request, Response } from 'express';
import { FlightPeriodRepository } from '../repositories/flightPeriod.repository';
import { FlightPeriodArchiveService } from '../services/flightPeriodArchive.service';
import { asyncHandler, successResponse, paginatedResponse } from '../utils/apiResponse';

const router = Router();
const repository = new FlightPeriodRepository();
const archiveService = new FlightPeriodArchiveService();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await repository.findAll(page, limit);
  res.json(paginatedResponse(result.data, page, limit, result.total));
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const period = await repository.findById(req.params.id);
  if (!period) throw new Error('航班时段不存在');
  res.json(successResponse(period));
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const period = await repository.create(req.body);
  res.status(201).json(successResponse(period, '航班时段创建成功'));
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const period = await repository.update(req.params.id, req.body);
  if (!period) throw new Error('航班时段不存在');
  res.json(successResponse(period, '航班时段更新成功'));
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await repository.delete(req.params.id);
  res.json(successResponse(null, '航班时段删除成功'));
}));

router.post('/archive/expired', asyncHandler(async (req: Request, res: Response) => {
  const beforeDate = req.body.beforeDate;
  const result = await archiveService.archiveExpiredPeriods(beforeDate);
  res.json(successResponse(result, `已归档 ${result.archivedCount} 个过期时段`));
}));

router.get('/:id/snapshot', asyncHandler(async (req: Request, res: Response) => {
  const snapshot = await archiveService.createSnapshot(req.params.id);
  res.json(successResponse(snapshot));
}));

router.get('/reports/utilization', asyncHandler(async (req: Request, res: Response) => {
  const report = await archiveService.getUtilizationReport({
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    airportCode: req.query.airportCode as string
  });
  res.json(successResponse(report));
}));

export default router;
