import { LoaderFunctionArgs } from '@remix-run/node';
import { getImage } from '~/services/image.server';

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const image = await getImage(params.name || '');

  return image;
};
