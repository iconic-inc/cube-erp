import { NextFunction, Request, Response } from 'express';

import {
  ErrorBase,
  NotFoundError,
  InternalServerError,
  BadRequestError,
} from '../core/errors';
import { logger } from '../loggers/logger.log';
import { MulterError } from 'multer';
import { EntityTooLargeError } from '../core/errors/TooLargeError';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  throw new NotFoundError(
    `Not found:::: ${req.method.toUpperCase()} ${req.baseUrl}`
  );
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err as ErrorBase;

  if (error instanceof MulterError) {
    // Handle Multer errors specifically
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        error = new EntityTooLargeError(
          'File quá lớn. Vui lòng tải lên file nhỏ hơn.'
        );
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        error = new BadRequestError('File không hợp lệ.');
        break;
      default:
        error = new InternalServerError(error.message);
    }
  } else if (!(error instanceof ErrorBase)) {
    error = new InternalServerError(err.message);
  }

  logger.error(err.message, {
    context: req.path,
    metadata: error.serializeError(),
    requestId: req.requestId,
  });

  res.status(error.status).json({
    errors: error.serializeError(),
  });
};
