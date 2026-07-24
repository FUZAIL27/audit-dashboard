import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // `CLIENT_ORIGIN` is the canonical name used throughout this codebase;
  // `FRONTEND_URL` is accepted as an alias so deployment platforms that
  // were configured with that name (Render, etc.) keep working without
  // renaming the env var there. Comma-separated values allow multiple
  // allowed origins (e.g. a stable domain + a Vercel preview URL).
  CLIENT_ORIGIN: z.string().optional(),
  FRONTEND_URL: z.string().optional(),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(5),

  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(25),
  UPLOAD_BATCH_SIZE: z.coerce.number().default(1000),

  // Single-admin bootstrap. Defaults match the spec exactly so a fresh
  // deployment is usable immediately; override both in any real
  // deployment — a startup warning fires if the defaults are still in use
  // under NODE_ENV=production.
  ADMIN_USERNAME: z.string().min(1).default('admin'),
  ADMIN_PASSWORD: z.string().min(1).default('Admin@123'),
});

type Env = z.infer<typeof envSchema> & { CLIENT_ORIGINS: string[] };

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment configuration:');
    // eslint-disable-next-line no-console
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  const raw = parsed.data.CLIENT_ORIGIN ?? parsed.data.FRONTEND_URL ?? 'http://localhost:5173';
  const CLIENT_ORIGINS = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return { ...parsed.data, CLIENT_ORIGINS };
}

export const env = loadEnv();
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

if (
  isProduction &&
  (env.ADMIN_USERNAME === 'admin' || env.ADMIN_PASSWORD === 'Admin@123')
) {
  // eslint-disable-next-line no-console
  console.warn(
    '⚠️  ADMIN_USERNAME/ADMIN_PASSWORD are still set to their defaults in production. ' +
      'Set both explicitly and rotate the password after first login.'
  );
}
