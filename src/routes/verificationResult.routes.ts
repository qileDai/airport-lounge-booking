import { Router, Request, Response } from 'express';
import { VerificationResultRepository } from '../repositories/verificationResult.repository';
import { asyncHandler, successResponse, paginatedResponse } from '../utils/apiResponse';

const router = Router();
const repository = new VerificationResultRepository();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await repository.findAll(page, limit);
  res.json(paginatedResponse(result.data, page, limit, result.total));
}));

router.get('/member/:memberId', asyncHandler(async (req: Request, res: Response) => {
  const results = await repository.findByMemberId(req.params.memberId);
  res.json(successResponse(results));
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const result = await repository.findById(req.params.id);
  if (!result) throw new Error('核验结果不存在');
  res.json(successResponse(result));
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const result = await repository.create(req.body);
  res.status(201).json(successResponse(result, '核验结果创建成功'));
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const result = await repository.update(req.params.id, req.body);
  if (!result) throw new Error('核验结果不存在');
  res.json(successResponse(result, '核验结果更新成功'));
}));

router.get('/statistics/summary', asyncHandler(async (req: Request, res: Response) => {
  const stats = await repository.getStatistics();
  res.json(successResponse(stats));
}));

export default router;
