import type { Response } from 'express';
import type { ErrorResponseDto } from '../contracts/index.js';

export const sendSuccess = <T>(res: Response<T>, statusCode: number, body: T): void => {
  res.status(statusCode).json(body);
};

export const sendError = (res: Response<ErrorResponseDto>, statusCode: number, error: string): void => {
  res.status(statusCode).json({ error });
};
