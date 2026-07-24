import multer from 'multer';
import { Request } from 'express';
import { env } from '../config/env';

const ALLOWED_EXTENSIONS = ['csv', 'json', 'xlsx', 'xls'];

const storage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void {
  const ext = file.originalname.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    callback(new Error(`Unsupported file extension ".${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
    return;
  }
  callback(null, true);
}

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
    files: 1,
  },
}).single('file');
