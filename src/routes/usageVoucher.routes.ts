import { Router, Request, Response } from 'express';
import { UsageVoucherRepository } from '../repositories/usageVoucher.repository';
import { asyncHandler, successResponse, paginatedResponse } from '../utils/apiResponse';

const router = Router();
const repository = new UsageVoucherRepository();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  const result = await repository.findAll(page, limit);
  res.json(paginatedResponse(result.data, page, limit, result.total));
}));

router.get('/booking/:bookingId', asyncHandler(async (req: Request, res: Response) => {
  const vouchers = await repository.findByBookingId(req.params.bookingId);
  res.json(successResponse(vouchers));
}));

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const voucher = await repository.findById(req.params.id);
  if (!voucher) throw new Error('使用凭证不存在');
  res.json(successResponse(voucher));
}));

router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const voucher = await repository.create(req.body);
  res.status(201).json(successResponse(voucher, '使用凭证创建成功'));
}));

router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const voucher = await repository.update(req.params.id, req.body);
  if (!voucher) throw new Error('使用凭证不存在');
  res.json(successResponse(voucher, '使用凭证更新成功'));
}));

export default router;
