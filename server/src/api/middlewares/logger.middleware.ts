import { NextFunction, Request, Response } from 'express';
import { logger } from '../loggers/logger.log';

function logRequest(req: Request, res: Response, next: NextFunction) {
  logger.info(`Request:::: ${req.method.toUpperCase()} ${req.baseUrl}`, {
    context: req.path,
    metadata: {
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
    },
    requestId: req.requestId,
  });

  next();
}

export { logRequest };
