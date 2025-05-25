import { ActionFunctionArgs, redirect } from '@remix-run/node';
import { isAuthenticated, logout } from '~/services/auth.server';
import { deleteAuthCookie, parseAuthCookie } from '~/services/cookie.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  const auth = await parseAuthCookie(request);
  if (!auth) {
    return null;
  }

  const url = new URL(request.url);
  const redirectUrl = url.searchParams.get('redirect');

  try {
    // delete keyToken in database
    await logout(auth).catch((error) => {
      console.error('Logout error:', error);
    });

    // Clear session data
    return redirect(`/erp/login?redirect=${redirectUrl}`, {
      headers: {
        'Set-Cookie': await deleteAuthCookie(),
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
    throw redirect(`/erp/login?redirect=${redirectUrl}`, {
      headers: {
        'Set-Cookie': await deleteAuthCookie(),
      },
    });
  }
};
