import { data, LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import { deleteImage, updateImage } from '~/services/image.server';

export const action = async ({ request, params }: LoaderFunctionArgs) => {
  const { id } = params;
  if (!id) throw new Response('Image not found', { status: 404 });

  const { session, headers } = await isAuthenticated(request);
  if (!session) {
    return data({ success: false, message: 'Unauthorized' }, { headers });
  }

  try {
    switch (request.method) {
      case 'PUT': {
        const formData = new URLSearchParams(await request.text());
        // const name = formData.get('name');
        const title = formData.get('title');
        const type = formData.get('type');
        const isPublic = formData.get('isPublic');
        const link = formData.get('link');
        const description = formData.get('description');
        const order = formData.get('order');

        await updateImage(
          id,
          { title, type, isPublic, link, description, order },
          session,
        );

        return data(
          {
            toast: { message: 'Cập nhật thành công', type: 'success' },
          },
          { headers },
        );
      }

      case 'DELETE': {
        await deleteImage(id, session);

        return data(
          {
            imageId: id,
            toast: { message: 'Xóa ảnh thành công', type: 'success' },
          },
          { headers },
        );
      }

      default:
        throw new Response('Method not allowed', { status: 405 });
    }
  } catch (error: any) {
    return data(
      {
        toast: { message: error.message, type: 'error' },
      },
      { headers },
    );
  }
};
