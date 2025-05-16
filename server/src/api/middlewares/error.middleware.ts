import { NextFunction, Request, Response } from 'express';

import { ErrorBase, NotFoundError, InternalServerError } from '../core/errors';
// import { logger } from '../loggers/logger.log';
import logger from '../loggers/discord.log';

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
  if (!(error instanceof ErrorBase)) {
    error = new InternalServerError(err.message);
  }

  // logger.error(err.message, {
  //   context: req.path,
  //   metadata: error.serializeError(),
  //   requestId: req.requestId,
  // });
  logger.sendFormatLog({
    title: `${req.method.toUpperCase()} ${req.url} (${req.requestId})`,
    code: req.method === 'GET' ? req.query : req.body,
    message: error.message + '\n' + error.stack?.substring(0, 1000),
  });

  res.status(error.status).json({
    errors: error.serializeError(),
  });
};
