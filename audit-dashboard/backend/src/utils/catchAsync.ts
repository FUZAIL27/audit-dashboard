import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Wraps an async controller/middleware so any rejected promise is
 * forwarded to Express's error-handling middleware instead of crashing
 * the process or requiring a try/catch in every controller.
 */
export function catchAsync(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
