import { createCookie } from '@remix-run/node';
import { ISessionUser } from '~/interfaces/auth.interface';

const authCookie = createCookie('_auth', {
  sameSite: 'lax', // this helps with CSRF
  path: '/', // remember to add this so the cookie will work in all routes
  httpOnly: true, // for security reasons, make this cookie http only
  secrets: [process.env.SESSION_SECRET || 's3cr3t'], // replace this with an actual secret
  secure: process.env.NODE_ENV === 'production', // enable this in prod only
  maxAge: 7 * 60 * 24 * 30, // 7 days
});

export const deleteAuthCookie = () => {
  return authCookie.serialize(null, {
    maxAge: -1,
  });
};

export const serializeAuthCookie = (data: ISessionUser) => {
  return authCookie.serialize(data);
};

export const parseAuthCookie = async (request: Request) => {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookie = await authCookie.parse(cookieHeader);
  if (!cookie) return null;

  return cookie as ISessionUser;
};
