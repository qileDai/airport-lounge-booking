import { Router, Request, Response } from 'express';
import { ExceptionEventRepository } from '../repositories/exceptionEvent.repository';
import { ExceptionDetectionService } from '../services/exceptionDetection.service';
import { asyncHandler, successResponse, paginatedResponse } from '../utils/apiResponse';

const router = Router();
const repository = new ExceptionEventRepository();
const detectionService = new ExceptionDetectionService();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await repository.findAll(page, limit, status);
  res.json(paginatedResponse(result.data, page, limit, result.total));
}));

router.get('/open', asyncHandler(async (req: Request, res: Response) => {
  const openExceptions = await repository.findOpenExceptions();
  res.json(successResponse(openExceptions));
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const exception = await repository.findById(req.params.id);
  if (!exception) throw new Error('异常事件不存在');
  res.json(successResponse(exception);
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const exception = await repository.create(req.body);
  res.status(201).json(successResponse(exception, '异常事件创建成功'));
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const exception = await repository.update(req.params.id, req.body);
  if (!exception) throw new Error('异常事件不存在');
  res.json(successResponse(exception, '异常事件更新成功'));
}));

router.get('/statistics/summary', asyncHandler(async (req: Request, res: Response) => {
  const stats = await repository.getStatistics();
  res.json(successResponse(stats));
}));

router.post('/check/member/:memberId', asyncHandler(async (req: Request, res: Response) => {
  const result = await detectionService.checkMemberExceptions(req.params.memberId);
  res.json(successResponse(result));
}));

router.post('/check/batch-expiry', asyncHandler(async (req: Request, res: Response) => {
  const result = await detectionService.batchCheckExpiry();
  res.json(successResponse(result, `检查完成：发现 ${result.exceptionsFound} 个异常`));
}));

export default router;
