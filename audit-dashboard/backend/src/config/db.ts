import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

mongoose.set('strictQuery', true);

export async function connectDatabase(retryCount = 0): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      logger.warn(
        `MongoDB connection failed. Retry ${retryCount + 1}/${MAX_RETRIES} in ${RETRY_DELAY_MS}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDatabase(retryCount + 1);
    }
    logger.error('MongoDB connection failed after max retries', error);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', err);
});

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
