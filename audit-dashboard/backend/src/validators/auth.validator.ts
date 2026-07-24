import { body } from 'express-validator';

export const loginValidator = [
  body('username').trim().isLength({ min: 1, max: 128 }).withMessage('Username is required'),
  body('password').isString().isLength({ min: 1 }).withMessage('Password is required'),
];
