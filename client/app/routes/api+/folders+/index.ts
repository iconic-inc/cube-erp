import { ActionFunctionArgs, data } from '@remix-run/node';
import { IActionFunctionReturn } from '~/interfaces/app.interface';

import { isAuthenticated } from '~/services/auth.server';
import { getUnauthorizedActionResponse } from '~/services/cookie.server';
import { createDocumentFolder } from '~/services/documentFolder.server';

export const action = async ({
  request,
}: ActionFunctionArgs): IActionFunctionReturn => {
  const { session, headers } = await isAuthenticated(request);
  if (!session) return getUnauthorizedActionResponse(data, headers);

  switch (request.method) {
    case 'POST':
      try {
        const formData = await request.formData();
        const name = formData.get('name') as string;

        await createDocumentFolder({ name }, session);
        return data(
          {
            success: true,
            toast: {
              type: 'success',
              message: 'Tạo thư mục thành công',
            },
          },
          { headers },
        );
      } catch (e: any) {
        return data(
          {
            success: false,
            toast: {
              type: 'error',
              message: e.message || 'Có lỗi xảy ra khi tạo thư mục',
            },
          },
          { headers, status: 500 },
        );
      }

    default:
      return data(
        {
          success: false,
          toast: {
            type: 'error',
            message: 'Method not allowed',
          },
        },
        {
          status: 405,
          headers,
        },
      );
  }
};
