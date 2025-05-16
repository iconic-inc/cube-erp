import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useNavigation,
} from '@remix-run/react';
import Defer from '~/components/Defer';

import HandsomeError from '~/components/HandsomeError';
import LoadingOverlay from '~/components/LoadingOverlay';
import { isAuthenticated, logout } from '~/services/auth.server';
import { deleteAuthCookie } from '~/services/cookie.server';
import { isExpired } from '~/utils';
import Sidebar from './_components/SideBar';
import { getCurrentUser } from '~/services/user.server';
import CustomButton from '~/widgets/CustomButton';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const auth = await isAuthenticated(request);

  try {
    if (['/admin/login', '/admin/logout'].includes(url.pathname)) {
      return {};
    }

    if (!auth) {
      return redirect('/admin/login' + `?redirect=${url.pathname}`);
    }

    const { user, tokens } = auth;

    if (isExpired(tokens.accessToken)) {
      console.log('access token expired');

      return redirect('/admin/login' + `?redirect=${url.pathname}`);
    }

    if (
      !url.pathname.includes('/admin/nhan-vien') &&
      !['admin'].includes(user.usr_role.slug)
    )
      return redirect('/admin/nhan-vien');

    const foundUser = getCurrentUser(auth);
    return { user: foundUser };
  } catch (error) {
    console.log(error);
    // delete keyToken in database
    if (auth)
      await logout(auth).catch((error) => {
        console.error('Logout error:', error);
      });

    // Clear session data
    return redirect(`/admin/login`, {
      headers: {
        'Set-Cookie': await deleteAuthCookie(),
      },
    });
  }
};

export const ErrorBoundary = () => <HandsomeError basePath='/admin' />;

export default function RootAdminLayout() {
  const navigation = useNavigation();
  const location = useLocation();
  const isLoginPage = location.pathname === '/admin/login';

  const { user } = useLoaderData<typeof loader>();

  return (
    <main>
      {isLoginPage ? (
        <Outlet />
      ) : (
        <div className='h-screen bg-gray-50 flex flex-col lg:flex-row overflow-hidden'>
          <Sidebar />

          <div className='flex-1 p-4 md:p-6 lg:ml-[240px] mt-4 lg:mt-0 overflow-y-auto'>
            {/* Top Navigation */}
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
              <div className='flex items-center space-x-4 ml-auto'>
                <Defer resolve={user}>
                  {(user) => (
                    <Link
                      to='/admin/profile'
                      className='flex items-center cursor-pointer hover:bg-gray-100 p-1 rounded-md transition-all duration-200'
                    >
                      <div className='w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold uppercase'>
                        {user?.usr_firstName[0]}
                      </div>

                      <div className='ml-2 hidden sm:block overflow-hidden'>
                        <div className='text-sm font-medium truncate'>{`${user?.usr_firstName} ${user?.usr_lastName}`}</div>
                        <div className='text-xs text-gray-500 truncate'>
                          {user?.usr_role.name}
                        </div>
                      </div>
                    </Link>
                  )}
                </Defer>
              </div>
            </div>

            <Outlet />
          </div>
        </div>
      )}

      {navigation.state === 'loading' && <LoadingOverlay />}
    </main>
  );
}
