// components
import { useEffect, useRef, useState } from 'react';
import { redirect, useFetcher, useNavigation, Link } from '@remix-run/react';
import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { toast } from 'react-toastify';
import { Eye, EyeOff, User, Lock, Grid3X3 } from 'lucide-react';

import { authenticator, logout } from '~/services/auth.server';
import { isExpired } from '~/utils';
import {
  deleteAuthCookie,
  parseAuthCookie,
  serializeAuthCookie,
} from '~/services/cookie.server';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await parseAuthCookie(request);
  const url = new URL(request.url);
  const redirectUrl = url.searchParams.get('redirect') || '/erp';

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
  const redicrectUrl = url.searchParams.get('redirect') || '/erp';
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

  useFetcherResponseHandler(fetcher as any);

  const [fingerprint, setFingerprint] = useState('');

  useEffect(() => {
    // Initialize the agent at application startup.
    // If you're using an ad blocker or Brave/Firefox, this import will not work.
    // Please use the NPM package instead: https://t.ly/ORyXk
    const fpPromise = import('@fingerprintjs/fingerprintjs').then(
      (FingerprintJS) => FingerprintJS.load(),
    );

    // Get the visitor identifier when you need it.
    fpPromise
      .then((fp) => fp.get())
      .then((result) => {
        // This is the visitor identifier:
        const visitorId = result.visitorId;
        setFingerprint(visitorId);
      });
  }, []);

  return (
    <div className='min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8'>
      <div className='w-full max-w-md mx-auto'>
        <Card className='border-0 shadow-xl bg-white/95 backdrop-blur-sm'>
          <CardHeader className='space-y-4 pb-2 md:pb-6'>
            {/* Title Section */}
            <div className='text-center space-y-2'>
              <CardTitle className='text-2xl sm:text-3xl font-bold text-red-900'>
                Đăng nhập
              </CardTitle>
              <CardDescription className='text-sm sm:text-base text-gray-600'>
                Đăng nhập để truy cập vào trang quản lý Nhân viên.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className='space-y-6'>
            <fetcher.Form method='POST' className='space-y-5'>
              {/* Username Field */}
              <div className='space-y-2'>
                <Label
                  htmlFor='username'
                  className='text-sm sm:text-base font-medium text-gray-900'
                >
                  Username
                </Label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5' />
                  <Input
                    id='username'
                    type='text'
                    name='username'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder='Nhập tên đăng nhập hoặc email'
                    className='pl-10 sm:pl-12 text-base h-12 sm:h-10'
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <Label
                    htmlFor='password'
                    className='text-sm sm:text-base font-medium text-gray-900'
                  >
                    Password
                  </Label>
                </div>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5' />
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    name='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Enter your password'
                    className='pl-10 sm:pl-12 pr-10 sm:pr-12 text-base h-12 sm:h-10'
                    required
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1 text-gray-400 hover:text-gray-600'
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <Eye className='w-4 h-4 sm:w-5 sm:h-5' />
                    ) : (
                      <EyeOff className='w-4 h-4 sm:w-5 sm:h-5' />
                    )}
                  </Button>
                </div>
              </div>

              <input type='hidden' name='fingerprint' value={fingerprint} />

              {/* Submit Button */}
              <Button
                type='submit'
                className='w-full'
                disabled={loading || !username || !password}
              >
                {loading ? (
                  <div className='flex items-center space-x-2'>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    <span>Đang đăng nhập...</span>
                  </div>
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </fetcher.Form>
          </CardContent>

          <CardFooter className='bg-gray-50/50 border-t border-gray-100'>
            <div className='w-full text-center'>
              <p className='text-xs sm:text-sm text-gray-600'>
                Không có tài khoản?{' '}
                <Link
                  to='#'
                  prefetch='intent'
                  className='text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors'
                >
                  Liên hệ admin
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className='mt-6 sm:mt-8 text-center space-y-3'>
          <p className='text-xs sm:text-sm text-gray-500'>
            &copy; 2025 Cube Lawfirm ERP
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
