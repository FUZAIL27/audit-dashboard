import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';
import { requestLogger } from './middlewares/requestLogger.middleware';
import { generalRateLimiter } from './middlewares/rateLimiter.middleware';

export function createApp(): Application {
  const app = express();

  // Render, Vercel, and most PaaS platforms terminate TLS at a reverse
  // proxy in front of the app and forward requests over plain HTTP with
  // an `X-Forwarded-*` header trail. Without this, Express doesn't trust
  // those headers: `req.ip` resolves to the proxy's internal IP (breaking
  // IP-based rate limiting) and `req.secure` is always false (breaking any
  // secure-cookie logic that inspects it). `express-rate-limit` in
  // particular throws a hard validation error under this exact
  // misconfiguration once `X-Forwarded-For` is present but trust proxy
  // isn't — which fails every rate-limited route (including login) in
  // production while working fine locally, since there's no proxy in the
  // way on localhost. `1` trusts exactly one hop (the platform's own
  // proxy), which is the correct, safe value for this kind of deployment.
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet());

  // CORS — only the configured origin(s), with credentials enabled so the
  // httpOnly refresh cookie can be sent cross-site. `env.CLIENT_ORIGINS`
  // supports a comma-separated list so a stable production domain and a
  // preview-deployment domain can both be allowed at once.
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        // Same-origin requests, curl, server-to-server health checks, etc.
        // don't send an Origin header at all — allow those through.
        if (!requestOrigin || env.CLIENT_ORIGINS.includes(requestOrigin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin "${requestOrigin}" is not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // Strip Mongo operator injection ($, .) from req.body/query/params
  app.use(mongoSanitize());

  app.use(requestLogger);
  app.use('/api', generalRateLimiter);

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
