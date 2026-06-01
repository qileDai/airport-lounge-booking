import { Router, Request, Response } from 'express';
import { RuleConfigRepository } from '../repositories/ruleConfig.repository';
import { asyncHandler, successResponse } from '../utils/apiResponse';

const router = Router();
const repository = new RuleConfigRepository();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const activeOnly = req.query.activeOnly === 'true';
  const rules = await repository.findAll(activeOnly);
  res.json(successResponse(rules));
}));

router.get('/category/:category', asyncHandler(async (req: Request, res: Response) => {
  const rules = await repository.findByCategory(req.params.category);
  res.json(successResponse(rules));
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const rule = await repository.findById(req.params.id);
  if (!rule) throw new Error('规则配置不存在');
  res.json(successResponse(rule);
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const rule = await repository.create(req.body);
  res.status(201).json(successResponse(rule, '规则配置创建成功'));
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const rule = await repository.update(req.params.id, req.body);
  if (!rule) throw new Error('规则配置不存在');
  res.json(successResponse(rule, '规则配置更新成功'));
}));

export default router;
