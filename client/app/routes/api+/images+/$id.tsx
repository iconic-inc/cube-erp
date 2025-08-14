import { data, LoaderFunctionArgs } from '@remix-run/node';
import { IActionFunctionReturn } from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';
import { getUnauthorizedActionResponse } from '~/services/cookie.server';
import { deleteImage, updateImage } from '~/services/image.server';

export const action = async ({
  request,
  params,
}: LoaderFunctionArgs): IActionFunctionReturn<{ imageId: string }> => {
  const { id } = params;
  if (!id)
    return data(
      { success: false, toast: { type: 'error', message: 'Image not found' } },
      { status: 404 },
    );

  const { session, headers } = await isAuthenticated(request);
  if (!session) return getUnauthorizedActionResponse(data, headers);

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
            success: true,
            toast: { message: 'Cập nhật thành công', type: 'success' },
          },
          { headers },
        );
      }

      case 'DELETE': {
        await deleteImage(id, session);

        return data(
          {
            data: { imageId: id },
            success: true,
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
        success: false,
        toast: { message: error.message, type: 'error' },
      },
      { headers },
    );
  }
};
