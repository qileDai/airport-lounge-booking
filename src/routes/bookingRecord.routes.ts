import { Router, Request, Response } from 'express';
import { BookingRecordService } from '../services/bookingRecord.service';
import { asyncHandler, successResponse, paginatedResponse, ApiError } from '../utils/apiResponse';

const router = Router();
const service = new BookingRecordService();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await service.getAll(page, limit);
  res.json(paginatedResponse(result.data, page, limit, result.total));
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const booking = await service.getById(req.params.id);
  res.json(successResponse(booking));
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const booking = await service.create(req.body);
  res.status(201).json(successResponse(booking, '预约记录创建成功'));
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const booking = await service.update(req.params.id, req.body);
  res.json(successResponse(booking, '预约记录更新成功'));
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await service.delete(req.params.id);
  res.json(successResponse(null, '预约记录删除成功'));
}));

router.post('/batch-import/precheck', asyncHandler(async (req: Request, res: Response) => {
  if (!req.body.records || !Array.isArray(req.body.records)) {
    throw new ApiError(400, '请提供有效的预约记录数组');
  }
  
  const results = await service.batchImportPrecheck(req.body);
  res.json(successResponse(results, '批量预检完成'));
}));

router.get('/:id/eligibility-verify', asyncHandler(async (req: Request, res: Response) => {
  const result = await service.verifyEligibility(req.params.id);
  res.json(successResponse(result));
}));

export default router;
