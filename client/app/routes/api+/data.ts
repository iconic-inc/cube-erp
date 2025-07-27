import { LoaderFunctionArgs } from '@remix-run/node';

import { getUsers } from '~/services/user.server';
import { getImages } from '~/services/image.server';
import { getDocuments } from '~/services/document.server';
import { parseAuthCookie } from '~/services/cookie.server';

const services = {
  // getUsers,
  getImages,
  getDocuments,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await parseAuthCookie(request);
  if (!session) {
    throw new Response(null, { status: 401, statusText: 'Unauthorized' });
  }
  const url = new URL(request.url);
  const getter = url.searchParams.get('getter') as string;
  const limit = parseInt(url.searchParams.get('limit') || '10', 10) || 10;
  const page = parseInt(url.searchParams.get('page') || '1', 10) || 1;

  if (!getter || !(getter in services)) {
    throw new Response(null, { status: 400, statusText: 'Invalid request' });
  }

  const data = await services[getter as keyof typeof services](
    new URLSearchParams([
      ['limit', limit.toString()],
      ['page', page.toString()],
    ]),
    session,
  );

  return Response.json(data);
};
