import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/apiResponse';
import { isProduction } from '../config/env';
import { ForbiddenError, UnauthorizedError } from '../utils/AppError';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Cross-site cookie rules: a cookie can only be sent on a cross-origin
 * request (frontend and backend on different domains — e.g. Vercel +
 * Render) if `sameSite: 'none'`, and browsers require `secure: true`
 * whenever `sameSite: 'none'` is used. In development, frontend and
 * backend are effectively same-site (both on localhost), so `lax` +
 * non-secure works over plain HTTP. Getting this pairing wrong is the
 * single most common reason a login flow works locally and silently
 * fails after deployment — the cookie is set, but the browser never
 * sends it back.
 */
function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: REFRESH_COOKIE_MAX_AGE,
    path: '/api/auth',
  });
}

export const registrationDisabled = catchAsync(async (_req: Request, _res: Response) => {
  throw new ForbiddenError('Registration Disabled');
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const { tokens, user } = await authService.login({ username, password });

  setRefreshCookie(res, tokens.refreshToken);

  sendSuccess(res, 200, { accessToken: tokens.accessToken, user });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw new UnauthorizedError('No refresh token provided');

  const tokens = await authService.refresh(token);
  setRefreshCookie(res, tokens.refreshToken);

  sendSuccess(res, 200, { accessToken: tokens.accessToken });
});

export const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
  });
  sendSuccess(res, 200, { loggedOut: true });
});

// export const me = catchAsync(async (req: Request, res: Response) => {
//   if (!req.user) throw new UnauthorizedError('Authentication required');
//   const user = await authService.me(req.user.sub);
//   sendSuccess(res, 200, user);
// });
export const me = catchAsync(async (req: Request, res: Response) => {
  const authUser = (req as any).user;

  if (!authUser) {
    throw new UnauthorizedError("Authentication required");
  }

  const user = await authService.me(authUser.sub);

  sendSuccess(res, 200, user);
});