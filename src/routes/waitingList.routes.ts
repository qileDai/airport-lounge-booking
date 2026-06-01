import { Router, Request, Response } from 'express';
import { WaitingListAdmissionService } from '../services/waitingListAdmission.service';
import { PriorityCalculationService } from '../services/priorityCalculation.service';
import { asyncHandler, successResponse, paginatedResponse, ApiError } from '../utils/apiResponse';

const router = Router();
const admissionService = new WaitingListAdmissionService();
const priorityService = new PriorityCalculationService();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await admissionService.getWaitingList(status, page, limit);
  res.json(paginatedResponse(result.data, page, limit, result.total));
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const waitingRepo = (await import('../repositories/waitingList.repository')).default;
  const repo = new waitingRepo();
  const item = await repo.findById(req.params.id);
  if (!item) throw new Error('候补记录不存在');
  res.json(successResponse(item));
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const item = await admissionService.addToWaitingList(req.body);
  res.status(201).json(successResponse(item, '已加入候补名单'));
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const reason = req.body.reason || '用户主动取消';
  const item = await admissionService.removeFromWaitingList(req.params.id, reason);
  res.json(successResponse(item, '已从候补名单移除'));
}));

router.get('/member/:memberId/position', asyncHandler(async (req: Request, res: Response) => {
  const position = await admissionService.getQueuePosition(req.params.memberId);
  res.json(successResponse(position));
}));

router.post('/admission/process', asyncHandler(async (req: Request, res: Response) => {
  const { flightPeriodId, availableSlots } = req.body;
  
  if (!flightPeriodId) throw new ApiError(400, '缺少航班时段ID');
  if (!availableSlots) throw new ApiError(400, '缺少可用名额数');
  
  const result = await admissionService.processAdmission(flightPeriodId, availableSlots);
  res.json(successResponse(result, `成功安排 ${result.admitted.length} 人入场`));
}));

router.post('/priority/calculate-all', asyncHandler(async (req: Request, res: Response) => {
  const results = await priorityService.calculateAllWaitingPriorities();
  res.json(successResponse(results, `已计算 ${results.length} 条候补记录的优先级`));
}));

router.post('/priority/calculate/:memberId', asyncHandler(async (req: Request, res: Response) => {
  const result = await priorityService.calculatePriority({
    member_id: req.params.memberId,
    flight_period_id: req.body.flight_period_id
  });
  res.json(successResponse(result));
}));

router.post('/admission/auto-admit', asyncHandler(async (req: Request, res: Response) => {
  const count = req.body.count || 1;
  const admitted = await priorityService.admitFromWaitingList(count);
  res.json(successResponse(admitted, `已通知 ${admitted.length} 位候补用户入场`));
}));

export default router;
