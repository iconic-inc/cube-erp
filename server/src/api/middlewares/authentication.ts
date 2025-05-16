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

async function authentication(req: Request, res: Response, next: NextFunction) {
  /**
   *    1. Check if userId is missing
   *    2. Check KeyToken in DB
   *    3. Verify accessToken
   *    4. Check user in DB
   *    5. Check accessToken in DB
   *    6. All passed => return
   */

  // 1
  const userId = req.headers[HEADER.CLIENT_ID] as string;
  if (!userId) throw new BadRequestError('Invalid request');

  // 2
  const keyToken = await findByUserId(userId, 'browserId');
  if (!keyToken) throw new NotFoundError('KeyStore Not Found');

  // 3
  const accessToken = req.headers[HEADER.AUTHORIZATION] as string;
  if (!accessToken) throw new UnauthorizedError('Invalid request');

  const payload = parseJwt(accessToken);
  if (payload.userId !== userId) throw new UnauthorizedError('Invalid token');

  // 6
  req.keyToken = keyToken;

  return next();
}

export { authenticationV2 };
