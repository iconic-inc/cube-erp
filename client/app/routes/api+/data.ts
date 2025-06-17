import { LoaderFunctionArgs } from '@remix-run/node';

import { getUsers } from '~/services/user.server';
import { getImages } from '~/services/image.server';

const services = {
  getUsers,
  getImages,
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const getter = url.searchParams.get('getter') as string;

  if (!getter || !(getter in services)) {
    throw new Response(null, { status: 400, statusText: 'Invalid request' });
  }

  const data = await services[getter as keyof typeof services]();

  return Response.json(data);
};
