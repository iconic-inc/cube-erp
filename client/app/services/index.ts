import { ISessionUser } from '~/interfaces/auth.interface';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const headers = {
  'x-api-key': process.env.API_APIKEY || '',
  credentials: 'include',
};

const fetcher = async <T = any>(
  path: string,
  options?: RequestInit & {
    request?: ISessionUser;
  },
): Promise<T> => {
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    method: 'GET',
    ...options,
    headers: {
      ...headers,
      ...(options?.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      'x-client-id': options?.request?.user?.id || '',
      Authorization: 'Bearer ' + options?.request?.tokens?.accessToken || '',
      // 'x-refresh-token': options?.request?.tokens?.refreshToken || '',
      ...options?.headers,
    },
  }).catch((error) => {
    console.log('fetch error');
    console.error(error);

    throw new Response('Lỗi hệ thống', {
      status: 500,
    });
  });
  if (!response) {
    console.log('fetch error');
    console.error('No response');

    throw new Response('Lỗi hệ thống', {
      status: 500,
    });
  }

  const data = (await response.json()) as {
    metadata: any;
    errors?: {
      status?: number;
      message?: string;
    };
  };

  if (response.ok) {
    console.log(
      '%s %s \x1b[32m%s\x1b[0m',
      options?.method || 'GET',
      path,
      response.status,
    );
  } else {
    console.log(
      '%s %s \x1b[31m%s\x1b[0m',
      options?.method || 'GET',
      path,
      response.status,
    );
  }

  if (data.errors) {
    throw new Error(data.errors.message || response.statusText);
  }
  return data.metadata;
};

export { fetcher };
