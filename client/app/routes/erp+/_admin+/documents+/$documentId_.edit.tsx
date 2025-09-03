import { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { data, useLoaderData } from '@remix-run/react';

import {
  deleteDocument,
  getDocumentById,
  updateDocument,
} from '~/services/document.server';
import { isAuthenticated } from '~/services/auth.server';
import { parseAuthCookie } from '~/services/cookie.server';
import { getEmployees } from '~/services/employee.server';
import { canAccessDocumentManagement } from '~/utils/permission';
import { IActionFunctionReturn } from '~/interfaces/app.interface';
import DocumentDetailForm from './_components/DocumentDetailForm';
import { getDocumentFolders } from '~/services/documentFolder.server';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (!canAccessDocumentManagement(user?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const url = new URL(request.url);

  try {
    // Fetch document details from the API
    const documentId = params.documentId as string;
    const document = await getDocumentById(documentId, user!);
    const employeesPromise = getEmployees(url.searchParams, user!).catch(
      (e) => {
        console.error('Error fetching employees:', e);
        return {
          success: false,
          message: 'Xảy ra lỗi khi lấy danh sách nhân viên',
        };
      },
    );
    const foldersPromise = getDocumentFolders(url.searchParams,user!).catch((e) => {
      console.error('Error fetching document folders:', e);
      return {
        success: false,
        message: 'Xảy ra lỗi khi lấy danh sách thư mục tài liệu',
      };
    });

    return { document, employeesPromise, foldersPromise };
  } catch (error) {
    console.error('Error fetching document:', error);
    throw new Response('Document not found', {
      status: 404,
      statusText: 'Not Found',
    });
  }
};

export default function DocumentDetailPage() {
  const { document, employeesPromise, foldersPromise } =
    useLoaderData<typeof loader>();

  return (
    <DocumentDetailForm
      document={document}
      employeesPromise={employeesPromise}
      foldersPromise={foldersPromise}
    />
  );
}

export const action = async ({
  request,
  params,
}: ActionFunctionArgs): IActionFunctionReturn => {
  const { session, headers } = await isAuthenticated(request);

  switch (request.method) {
    case 'DELETE':
      await deleteDocument(params.documentId!, session!);
      return data(
        {
          success: true,
          toast: {
            type: 'success',
            message: 'Xóa Tài liệu thành công',
          },
          redirectTo: `/erp/documents`,
        },
        { headers },
      );

    case 'PUT':
      const formData = await request.formData();
      const name = formData.get('name')?.toString().trim();
      const parent = formData.get('parent')?.toString().trim();
      const description = formData.get('description')?.toString().trim();
      const whiteList = formData.get('whiteList')
        ? JSON.parse(formData.get('whiteList')!.toString())
        : [];
      const isPublic = formData.get('isPublic') === 'true';
      const documentId = params.documentId as string;
      if (!name) {
        return data(
          {
            success: false,
            toast: {
              type: 'error' as const,
              message: 'Vui lòng nhập tên tài liệu',
            },
          },
          { status: 400, headers },
        );
      }
      if (!parent) {
        return data(
          {
            success: false,
            toast: {
              type: 'error' as const,
              message: 'Vui lòng chọn thư mục cha',
            },
          },
          { status: 400, headers },
        );
      }
      try {
        await updateDocument(
          documentId,
          { name, description, whiteList, isPublic, parent },
          session!,
        );
        return data(
          {
            success: true,
            toast: {
              type: 'success',
              message: 'Cập nhật tài liệu thành công',
            },
            redirectTo: `/erp/documents/${documentId}`,
          },
          { headers },
        );
      } catch (error: any) {
        console.error('Error updating document:', error);
        return data(
          {
            success: false,
            toast: {
              type: 'error',
              message:
                error.message ||
                'Đã xảy ra lỗi khi cập nhật tài liệu. Vui lòng thử lại sau.',
            },
          },
          { headers, status: 500, statusText: 'Internal Server Error' },
        );
      }

    default:
      return data(
        {
          success: false,
          toast: {
            type: 'error',
            message: 'Phương thức không hợp lệ',
          },
        },
        {
          headers,
          status: 405,
          statusText: 'Method Not Allowed',
        },
      );
  }
};
