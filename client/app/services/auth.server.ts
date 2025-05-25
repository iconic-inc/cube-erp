import { Authenticator } from 'remix-auth';
import { Strategy } from 'remix-auth/strategy';
import { FormStrategy } from 'remix-auth-form';

import { fetcher } from '.';
import { ISessionUser } from '~/interfaces/auth.interface';
import {
  deleteAuthCookie,
  parseAuthCookie,
  serializeAuthCookie,
} from './cookie.server';
import { isExpired } from '~/utils';

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
const authenticator = new Authenticator<ISessionUser>();

export namespace RefreshTokenStrategy {
  /**
   * This interface declares what the developer will receive from the strategy
   * to verify the user identity in their system.
   */
  export interface VerifyOptions {
    request: Request;
  }
}

// Refresh token strategy
class RefreshTokenStrategy<U> extends Strategy<
  U,
  RefreshTokenStrategy.VerifyOptions
> {
  name = 'refresh-token';

  async authenticate(request: Request): Promise<U> {
    return this.verify({ request });
  }
}

authenticator.use(
  new RefreshTokenStrategy(async ({ request }) => {
    const res = await refreshTokenHandler(request);

    return res as ISessionUser;
  }),
  'refresh-token',
);

authenticator.use(
  new FormStrategy<ISessionUser>(async ({ form }) => {
    try {
      const username = form.get('username') as string;
      const password = form.get('password') as string;
      const fingerprint = form.get('fingerprint') as string;

      const user = await login(username, password, fingerprint);

      return user;
    } catch (error: any) {
      console.log('authenticate error: ', error.data);
      throw error;
    }
  }),
  // each strategy has a name and can be changed to use another one
  // same strategy multiple times, especially useful for the OAuth2 strategy.
  'user-pass',
);

/**
 *
 * @param request
 * @returns \{ session: ISessionUser | null; headers: HeadersInit }
 * @description Checks if the user is authenticated by looking for a valid session cookie.
 * @note Only uses in action functions.
 */
const isAuthenticated = async (
  request: Request,
): Promise<{ session: ISessionUser | null; headers: HeadersInit }> => {
  const cookie = await parseAuthCookie(request);

  if (!cookie) {
    return { session: null, headers: {} };
  }

  const { user, tokens } = cookie;
  if (!isExpired(tokens.accessToken)) {
    return { session: { user, tokens }, headers: {} };
  }

  // Access token expired → try refresh
  if (!isExpired(tokens.refreshToken)) {
    try {
      const refreshed = await authenticator.authenticate(
        'refresh-token',
        request,
      );
      const newCookie = await serializeAuthCookie(refreshed);
      return {
        session: { user: refreshed.user, tokens: refreshed.tokens },
        headers: { 'Set-Cookie': newCookie },
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  }

  // Both tokens invalid or refresh failed
  return {
    session: null,
    headers: {
      'Set-Cookie': await deleteAuthCookie(),
    },
  };
};

const login = async (username: string, password: string, browserId: string) => {
  const res = await fetcher<ISessionUser>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ username, password, browserId }),
  });

  return res;
};

const logout = async (request: ISessionUser) => {
  await fetcher<any>('/auth/signout', {
    method: 'POST',
    request,
  });
};

const refreshTokenHandler = async (request: Request) => {
  const cookie = await parseAuthCookie(request);

  const res = await fetcher<ISessionUser>('/auth/refresh-token', {
    method: 'POST',
    headers: {
      'x-refresh-token': cookie?.tokens.refreshToken || '',
      'x-client-id': cookie?.user.id || '',
    },
  });

  return res;
};

export { authenticator, logout, isAuthenticated };
