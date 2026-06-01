import { Router, Request, Response } from 'express';
import { MemberRightsService } from '../services/memberRights.service';
import { asyncHandler, successResponse, paginatedResponse, ApiError } from '../utils/apiResponse';

const router = Router();
const service = new MemberRightsService();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await service.getAll(page, limit);
  res.json(paginatedResponse(result.data, page, limit, result.total));
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const member = await service.getById(req.params.id);
  res.json(successResponse(member));
}));

router.get('/code/:code', asyncHandler(async (req: Request, res: Response) => {
  const member = await service.getByCode(req.params.code);
  res.json(successResponse(member));
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const member = await service.create(req.body);
  res.status(201).json(successResponse(member, '会员权益创建成功'));
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const member = await service.update(req.params.id, req.body);
  res.json(successResponse(member, '会员权益更新成功'));
}));

router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  await service.delete(req.params.id);
  res.json(successResponse(null, '会员权益删除成功'));
}));

router.get('/status/:status', asyncHandler(async (req: Request, res: Response) => {
  const members = await service.getByStatus(req.params.status);
  res.json(successResponse(members));
}));

router.get('/level/:level', asyncHandler(async (req: Request, res: Response) => {
  const members = await service.getByLevel(req.params.level);
  res.json(successResponse(members));
}));

router.get('/:id/expiry-check', asyncHandler(async (req: Request, res: Response) => {
  const result = await service.checkExpiry(req.params.id);
  res.json(successResponse(result));
}));

export default router;
