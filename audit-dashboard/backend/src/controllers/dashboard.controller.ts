import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/apiResponse';

export const getStats = catchAsync(async (req: Request, res: Response) => {
  const dateFrom = req.query.dateFrom as unknown as Date | undefined;
  const dateTo = req.query.dateTo as unknown as Date | undefined;
  const stats = await dashboardService.getStats(dateFrom, dateTo);
  sendSuccess(res, 200, stats);
});

export const getCharts = catchAsync(async (req: Request, res: Response) => {
  const dateFrom = req.query.dateFrom as unknown as Date | undefined;
  const dateTo = req.query.dateTo as unknown as Date | undefined;
  const granularity = (req.query.granularity as 'day' | 'hour') || 'day';
  const charts = await dashboardService.getCharts(dateFrom, dateTo, granularity);
  sendSuccess(res, 200, charts);
});

export const getActivity = catchAsync(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 20;
  const activity = await dashboardService.getActivity(limit);
  sendSuccess(res, 200, activity);
});
