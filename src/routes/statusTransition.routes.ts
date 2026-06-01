import { Router, Request, Response } from 'express';
import { StatusTransitionService } from '../services/statusTransition.service';
import { asyncHandler, successResponse, paginatedResponse, ApiError } from '../utils/apiResponse';

const router = Router();
const service = new StatusTransitionService();

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const transition = await service.transition(req.body);
  res.status(201).json(successResponse(transition, '状态流转成功'));
}));

router.get('/audit-log', asyncHandler(async (req: Request, res: Response) => {
  const entityType = req.query.entityType as string;
  const entityId = req.query.entityId as string;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  
  const result = await service.getAuditLog({
    entityType,
    entityId,
    page,
    limit
  });
  res.json(paginatedResponse(result.data, page, limit, result.total));
}));

router.get('/history/:entityType/:entityId', asyncHandler(async (req: Request, res: Response) => {
  const history = await service.getEntityHistory(
    req.params.entityType,
    req.params.entityId
  );
  res.json(successResponse(history));
}));

router.get('/allowed-transitions/:entityType/:currentStatus', asyncHandler(async (req: Request, res: Response) => {
  const allowed = service.getAllowedTransitions(
    req.params.entityType,
    req.params.currentStatus
  );
  res.json(successResponse({
    entityType: req.params.entityType,
    currentStatus: req.params.currentStatus,
    allowedTransitions: allowed
  }));
}));

export default router;
