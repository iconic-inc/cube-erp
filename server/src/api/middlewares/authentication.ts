import { NextFunction, Request, Response } from 'express';

import { HEADER } from '../constants';
import { parseJwt, verifyJwt } from '../helpers/jwt.helper';
import { findByUserId } from '../services/keyToken.service';
import { NotFoundError } from '../core/errors/NotFoundError';
import { IKeyToken } from '../interfaces/keyToken.interface';
import { BadRequestError, UnauthorizedError } from '../core/errors';
import { IUserJWTPayload } from '../interfaces/user.interface';

declare global {
  namespace Express {
    interface Request {
      keyToken: IKeyToken;
      user: IUserJWTPayload;
      refreshToken: string;
    }
  }
}

async function authenticationV2(
  req: Request,
  res: Response,
  next?: NextFunction
) {
  const clientId = req.headers[HEADER.CLIENT_ID] as string;
  const accessToken = req.headers[HEADER.AUTHORIZATION] as string;
  if (!clientId) throw new UnauthorizedError('Invalid request');

  if (!accessToken) throw new UnauthorizedError('Invalid request');

  const token = accessToken.startsWith('Bearer ')
    ? accessToken.slice(7, accessToken.length)
    : accessToken;
  const { userId, browserId } = parseJwt(token);
  if (clientId !== userId) throw new UnauthorizedError('Invalid token');

  const keyToken = await findByUserId(userId, browserId);
  if (!keyToken) throw new BadRequestError('Invalid request');
  const { email } = verifyJwt(token, keyToken.publicKey);

  req.user = { userId, email, browserId };
  req.keyToken = keyToken;

  if (next) return next();
}

export { authenticationV2 };
