import morgan, { StreamOptions } from 'morgan';
import { logger } from '../utils/logger';

const stream: StreamOptions = {
  write: (message: string) => logger.info(message.trim()),
};

export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);
