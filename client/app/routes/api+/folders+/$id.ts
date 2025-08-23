import { ActionFunctionArgs, data } from '@remix-run/node';
import { IActionFunctionReturn } from '~/interfaces/app.interface';

import { isAuthenticated } from '~/services/auth.server';
import { getUnauthorizedActionResponse } from '~/services/cookie.server';
import {
  deleteDocumentFolder,
  updateDocumentFolder,
} from '~/services/documentFolder.server';

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): IActionFunctionReturn => {
  const { session, headers } = await isAuthenticated(request);
  if (!session) return getUnauthorizedActionResponse(data, headers);

  const folderId = params.id;
  if (!folderId) {
    return data(
      {
        success: false,
        toast: {
          type: 'error',
          message: 'Thư mục không hợp lệ',
        },
      },
      { headers, status: 400 },
    );
  }
  switch (request.method) {
    case 'DELETE':
      try {
        await deleteDocumentFolder(folderId, session);
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

    case 'PUT':
      const formData = await request.formData();
      const folderData = Object.fromEntries(formData);
      await updateDocumentFolder(folderId, folderData, session);
      return data(
        {
          success: true,
          toast: {
            type: 'success',
            message: 'Cập nhật thư mục thành công',
          },
        },
        { headers },
      );

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
