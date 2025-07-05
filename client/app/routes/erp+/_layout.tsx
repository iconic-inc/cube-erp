import { LoaderFunctionArgs, redirect, data } from '@remix-run/node';
import { Outlet, useNavigation } from '@remix-run/react';
import HandsomeError from '~/components/HandsomeError';
import LoadingOverlay from '~/components/LoadingOverlay';
import { logout } from '~/services/auth.server';
import { deleteAuthCookie, parseAuthCookie } from '~/services/cookie.server';
import { isExpired } from '~/utils';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const auth = await parseAuthCookie(request);
  try {
    if (['/erp/login', '/erp/logout'].includes(url.pathname)) {
      return {};
    }

    if (!auth) {
      return redirect('/erp/login' + `?redirect=${url.pathname}`);
    }

    const { user, tokens } = auth;

    if (isExpired(tokens.accessToken)) {
      console.log('access token expired');

      return redirect('/erp/login' + `?redirect=${url.pathname}`);
    }

    return {};
  } catch (error) {
    console.log(error);
    // delete keyToken in database
    if (auth)
      await logout(auth).catch((error) => {
        console.error('Logout error:', error);
      });

    // Clear session data
    return redirect(`/erp/login`, {
      headers: {
        'Set-Cookie': await deleteAuthCookie(),
      },
    });
  }

  return {};
};

export const ErrorBoundary = () => <HandsomeError basePath='/erp' />;

export default function RootHRMLayout() {
  const navigation = useNavigation();

  return (
    <>
      <Outlet />

      {navigation.state === 'loading' && <LoadingOverlay />}
    </>
  );
}
