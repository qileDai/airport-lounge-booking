import { Router, Request, Response } from 'express';
import { CompanionRepository } from '../repositories/companion.repository';
import { asyncHandler, successResponse, paginatedResponse } from '../utils/apiResponse';

const router = Router();
const repository = new CompanionRepository();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await repository.findAll(page, limit);
  res.json(paginatedResponse(result.data, page, limit, result.total));
}));

router.get('/booking/:bookingId', asyncHandler(async (req: Request, res: Response) => {
  const companions = await repository.findByBookingId(req.params.bookingId);
  res.json(successResponse(companions));
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const companion = await repository.findById(req.params.id);
  if (!companion) throw new Error('同行人记录不存在');
  res.json(successResponse(companion));
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const companion = await repository.create(req.body);
  res.status(201).json(successResponse(companion, '同行人添加成功'));
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const companion = await repository.update(req.params.id, req.body);
  if (!companion) throw new Error('同行人记录不存在');
  res.json(successResponse(companion, '同行人更新成功'));
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await repository.delete(req.params.id);
  res.json(successResponse(null, '同行人删除成功'));
}));

export default router;
