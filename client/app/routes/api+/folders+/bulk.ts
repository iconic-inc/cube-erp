import { ActionFunctionArgs, data } from '@remix-run/node';
import { IActionFunctionReturn } from '~/interfaces/app.interface';

import { isAuthenticated } from '~/services/auth.server';
import { getUnauthorizedActionResponse } from '~/services/cookie.server';
import {
  bulkDeleteDocumentFolder,
  createDocumentFolder,
} from '~/services/documentFolder.server';

export const action = async ({
  request,
}: ActionFunctionArgs): IActionFunctionReturn => {
  const { session, headers } = await isAuthenticated(request);
  if (!session) return getUnauthorizedActionResponse(data, headers);

  switch (request.method) {
    case 'DELETE':
      try {
        const formData = await request.formData();
        const folderIds = formData.getAll('itemIds') as string[];
        await bulkDeleteDocumentFolder(folderIds, session);
        return data(
          {
            success: true,
            toast: {
              type: 'success',
              message: 'Xóa thư mục thành công',
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
              message: e.message || 'Có lỗi xảy ra khi xóa thư mục',
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
