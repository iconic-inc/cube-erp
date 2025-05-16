// components
import { useEffect, useRef, useState } from 'react';
import { redirect, useFetcher, useNavigation } from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { toast } from 'react-toastify';

import { authenticator, isAuthenticated, logout } from '~/services/auth.server';
import { isExpired } from '~/utils';
import {
  deleteAuthCookie,
  serializeAuthCookie,
} from '~/services/cookie.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await isAuthenticated(request);
  const url = new URL(request.url);
  const redirectUrl = url.searchParams.get('redirect') || '/admin';

  // If the user is already authenticated
  if (auth) {
    const { user, tokens } = auth;

    // Check if the access token is expired
    if (isExpired(tokens.accessToken)) {
      console.log('access token expired');

      // If the refresh token is also expired, destroy the session and redirect to login
      if (isExpired(tokens.refreshToken)) {
        console.log('refresh token expired');
        return new Response(null, {
          headers: {
            'Set-Cookie': await deleteAuthCookie(),
          },
          status: 302,
          statusText: 'Redirecting to login',
        });
      }

      try {
        // If the access token is expired but the refresh token is valid, handle refresh token
        const tokenRefresh = await authenticator.authenticate(
          'refresh-token',
          request,
        );

        return redirect(redirectUrl, {
          headers: {
            'Set-Cookie': await serializeAuthCookie(tokenRefresh),
          },
        });
      } catch (err: any) {
        console.error('Error refreshing token:', err);
        await logout(auth).catch((error) => {
          console.error('Logout error:', error);
        });
        return new Response(err.message, {
          headers: {
            'Set-Cookie': await deleteAuthCookie(),
          },
          status: err.status || 500,
          statusText: err.statusText || 'Internal Server Error',
        });
      }
    }

    // If the user is authenticated and the access token is valid, redirect to the specified URL
    throw redirect(redirectUrl);
  }
  // If the user is not authenticated, return an empty object
  // This will allow the login page to render without any data
  return {};
};

export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const redicrectUrl = url.searchParams.get('redirect') || '/admin';
  try {
    const auth = await authenticator.authenticate('user-pass', request);

    return redirect(redicrectUrl, {
      headers: {
        'Set-Cookie': await serializeAuthCookie(auth),
      },
    });
  } catch (err: any) {
    if (err instanceof Response) {
      throw err;
    }

    return {
      toast: {
        message: err.message,
        type: 'error',
      },
    };
  }
}

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetcher = useFetcher<typeof action>();
  const toastIdRef = useRef<any>(null);
  const navigation = useNavigation();

  useEffect(() => {
    switch (navigation.state) {
      case 'loading':
        toast.dismiss();
        break;

      default:
        break;
    }
  }, [navigation.state]);

  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        toastIdRef.current = toast.loading('Loading...', {
          autoClose: false,
        });
        setLoading(true);
        break;

      case 'idle':
        if (fetcher.data?.toast && toastIdRef.current) {
          const { toast: toastData } = fetcher.data as any;
          toast.update(toastIdRef.current, {
            render: toastData.message,
            type: toastData.type || 'success', // Default to 'success' if type is not provided
            autoClose: 3000,
            isLoading: false,
          });
          toastIdRef.current = null;
          setLoading(false);
          break;
        }

        toast.update(toastIdRef.current, {
          render: fetcher.data?.toast.message,
          autoClose: 3000,
          isLoading: false,
          type: 'error',
        });
        setLoading(false);
        break;
    }
  }, [fetcher.state]);

  const [fingerprint, setFingerprint] = useState('');

  useEffect(() => {
    import('@thumbmarkjs/thumbmarkjs').then((module) => {
      module
        .getFingerprint()
        .then((result) => {
          setFingerprint(result);
        })
        .catch((error) => {
          console.error('Error getting fingerprint:', error);
        });
    });
  }, []);

  return (
    <div className='h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4 md:p-6 overflow-y-auto'>
      <div className='w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1'>
        <div className='p-6 md:p-8'>
          <div className='flex items-center justify-center mb-8'>
            <div className='bg-blue-500 text-white p-1.5 rounded-md'>
              <span className='material-symbols-outlined text-xs'>
                grid_view
              </span>
            </div>
            <span className='text-blue-500 font-bold ml-2 text-xl'>
              Iconic Inc.
            </span>
          </div>

          <h1 className='text-2xl font-bold text-center mb-6 text-gray-800'>
            Đăng nhập
          </h1>
          <p className='text-center text-gray-500 mb-8'>
            Đăng nhập để truy cập vào trang quản lý nhân sự.
          </p>

          <fetcher.Form method='POST' className='space-y-5'>
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-gray-700'>
                Username
              </label>
              <div className='relative'>
                <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400'>
                  <span className='material-symbols-outlined text-sm'>
                    person
                  </span>
                </span>
                <input
                  type='text'
                  name='username'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder='Nhập tên đăng nhập hoặc email'
                  className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-1 
                  focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 focus-visible:outline-none'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <label className='block text-sm font-medium text-gray-700'>
                  Password
                </label>
                <a
                  href='#'
                  className='text-xs text-blue-500 hover:text-blue-600 hover:underline transition-all'
                >
                  Forgot password?
                </a>
              </div>
              <div className='relative'>
                <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400'>
                  <span className='material-symbols-outlined text-sm'>
                    lock
                  </span>
                </span>
                <input
                  type='password'
                  placeholder='Enter your password'
                  name='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-1 
                  focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 focus-visible:outline-none'
                />
                <button
                  type='button'
                  className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-all'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <span className='material-symbols-outlined text-normal'>
                      visibility
                    </span>
                  ) : (
                    <span className='material-symbols-outlined text-normal'>
                      visibility_off
                    </span>
                  )}
                </button>
              </div>
            </div>

            <input type='hidden' name='fingerprint' value={fingerprint} />

            <button
              type='submit'
              className='w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium shadow-sm hover:shadow transform hover:-translate-y-0.5 transition-all duration-300'
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Đăng nhập'}
            </button>
          </fetcher.Form>
        </div>

        <div className='bg-gray-50 p-6 text-center border-t border-gray-100'>
          <p className='text-sm text-gray-600'>
            Không có tài khoản?{' '}
            <a
              href='#'
              className='text-blue-500 font-medium hover:text-blue-600 hover:underline transition-all'
            >
              Liên hệ admin
            </a>
          </p>
        </div>
      </div>

      <div className='mt-6 text-center'>
        <p className='text-xs text-gray-500'>&copy; Iconic Inc.</p>
        <div className='flex items-center justify-center mt-2 space-x-3'>
          <a
            href='#'
            className='text-xs text-gray-500 hover:text-gray-700 hover:underline transition-all'
          >
            Privacy Policy
          </a>
          <span className='text-gray-400'>•</span>
          <a
            href='#'
            className='text-xs text-gray-500 hover:text-gray-700 hover:underline transition-all'
          >
            Terms of Service
          </a>
          <span className='text-gray-400'>•</span>
          <a
            href='#'
            className='text-xs text-gray-500 hover:text-gray-700 hover:underline transition-all'
          >
            Help Center
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
