import { ActionFunctionArgs, data } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import {
  attachDocumentsToCase,
  detachDocumentsFromCase,
} from '~/services/case.server';
export const action = async ({ request, params }: ActionFunctionArgs) => {
  const caseId = params.caseId;
  if (!caseId) {
    return data(
      {
        success: false,
        toast: {
          message: 'ID hồ sơ không hợp lệ',
          type: 'error',
        },
      },
      { headers: new Headers() },
    );
  }

  const { session, headers } = await isAuthenticated(request);

  try {
    const body = await request.formData();

    switch (request.method) {
      case 'POST':
        const documentIds = JSON.parse(body.get('documentIds') as string);

        await attachDocumentsToCase(caseId, documentIds, session!);

        return data(
          {
            success: true,
            toast: {
              message: 'Tài liệu đã được gán thành công',
              type: 'success',
            },
          },
          { headers },
        );

      case 'DELETE':
        const itemIds = body.get('itemIds') as string; // fetched from ListConfirmModal
        if (!itemIds) {
          return data(
            {
              success: false,
              toast: {
                message: 'Vui lòng chọn tài liệu để gỡ.',
                type: 'error',
              },
            },
            { headers, status: 400 },
          );
        }
        const ids = JSON.parse(itemIds) as string[];
        if (!ids.length) {
          return data(
            {
              success: false,
              toast: {
                message: 'Vui lòng chọn tài liệu để gỡ.',
                type: 'error',
              },
            },
            { headers, status: 400 },
          );
        }

        await detachDocumentsFromCase(caseId, ids, session!);

        return data(
          {
            success: true,
            toast: {
              message: 'Tài liệu đã được gỡ thành công',
              type: 'success',
            },
          },
          { headers },
        );

      default:
        return data(
          {
            toast: {
              message: 'Phương thức không hợp lệ',
              type: 'error',
            },
          },
          { headers, status: 405 },
        );
    }
  } catch (error: any) {
    console.error('Error attaching documents to case:', error);
    return data(
      {
        success: false,
        toast: {
          message: error.message || 'Có lỗi xảy ra khi gán tài liệu',
          type: 'error',
        },
      },
      { headers },
    );
  }
};
