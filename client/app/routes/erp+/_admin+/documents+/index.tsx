import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { Link, useFetcher, useLoaderData } from '@remix-run/react';
import { ChevronRight, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

import {
  deleteMultipleDocuments,
  getDocuments,
  uploadDocument,
} from '~/services/document.server';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { IActionFunctionReturn } from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';
import { canAccessDocumentManagement } from '~/utils/permission';
import { getEmployees } from '~/services/employee.server';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';
import DocumentList from './_components/DocumentList';
import {
  getDocumentFolderById,
  getDocumentFolders,
} from '~/services/documentFolder.server';
import DocumentFolderList from '~/components/FolderList';
import Defer from '~/components/Defer';
import { useState } from 'react';
import { NewDocumentFolderFormPopup } from './_components/NewDocumentFolderFormPopup';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (!user || !canAccessDocumentManagement(user?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  const url = new URL(request.url);
  const parent = url.searchParams.get('parent') || '';

  if (!parent) {
    return {
      foldersPromise: getDocumentFolders(url.searchParams, user).catch((e) => {
        console.error(e);
        return {
          data: [],
          pagination: {
            totalPages: 0,
            page: 1,
            limit: 10,
            total: 0,
          },
        };
      }),
    };
  }

  return {
    parent,
    folderPromise: getDocumentFolderById(parent, user).catch((e) => {
      console.log(e);
      return null;
    }),
    documentsPromise: getDocuments(url.searchParams, user).catch((e) => {
      console.error(e);
      return {
        data: [],
        pagination: {
          totalPages: 0,
          page: 1,
          limit: 10,
          total: 0,
        },
      };
    }),
    employeesPromise: getEmployees(
      new URLSearchParams([['limit', '1000']]),
      user,
    ).catch((e) => {
      console.error(e);
      return {
        data: [],
        pagination: {
          totalPages: 0,
          page: 1,
          limit: 10,
          total: 0,
        },
      };
    }),
  };
};

export default function HRMDocuments() {
  const {
    parent,
    documentsPromise,
    employeesPromise,
    foldersPromise,
    folderPromise,
  } = useLoaderData<typeof loader>();

  const uploadFetcher = useFetcher<typeof action>();

  const addNewHandler = (parent?: string) => {
    if (!parent) {
      toast.error('Vui lòng chọn một thư mục để thêm tài liệu');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) {
        toast.error('Vui lòng chọn ít nhất một tài liệu để tải lên');
        return;
      }

      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('document', files[i]);
      }
      formData.set('parent', parent);

      uploadFetcher.submit(formData, {
        method: 'POST',
        encType: 'multipart/form-data',
        // action: '/api/documents/upload',
      });
    };

    input.style.display = 'none';
    input.click();
  };

  useFetcherResponseHandler(uploadFetcher);

  const [showNewFolderPopup, setShowNewFolderPopup] = useState(false);

  return (
    <div className='space-y-4 sm:space-y-6 min-h-screen p-2 sm:p-4'>
      {/* Content Header */}
      <ContentHeader
        title={parent ? 'Danh sách tài liệu' : 'Danh sách thư mục'}
        actionContent={
          parent ? (
            <>
              <Plus className='w-3 h-3 sm:w-4 sm:h-4' />
              <span className='hidden sm:inline'>Thêm tài liệu</span>
              <span className='sm:hidden'>Thêm</span>
            </>
          ) : (
            <>
              <Plus className='w-3 h-3 sm:w-4 sm:h-4' />
              <span className='hidden sm:inline'>Thêm thư mục</span>
              <span className='sm:hidden'>Thêm</span>
            </>
          )
        }
        actionHandler={() => {
          if (parent) {
            return addNewHandler(parent);
          }
          setShowNewFolderPopup(true);
        }}
      />

      <div className='flex items-center'>
        <Link
          to='/erp/documents'
          className='mr-2 text-gray-900 hover:text-gray-500'
        >
          Danh sách thư mục
        </Link>
        {folderPromise && (
          <Defer resolve={folderPromise}>
            {(folder) => (
              <div key={folder?.id} className='flex items-center'>
                <ChevronRight className='mx-2 text-gray-900' size={16} />
                <Link
                  to={`/erp/documents?parent=${folder?.id}`}
                  className='text-gray-900 hover:text-gray-500'
                >
                  {folder?.fol_name}
                </Link>
              </div>
            )}
          </Defer>
        )}
      </div>

      {foldersPromise && (
        <DocumentFolderList
          foldersPromise={foldersPromise}
          addNewHandler={() => setShowNewFolderPopup(true)}
        />
      )}

      {documentsPromise && employeesPromise && (
        <DocumentList
          documentsPromise={documentsPromise}
          employeesPromise={employeesPromise}
          addNewHandler={() => addNewHandler(parent)}
        />
      )}

      {showNewFolderPopup && (
        <NewDocumentFolderFormPopup
          open={showNewFolderPopup}
          setOpen={setShowNewFolderPopup}
        />
      )}
    </div>
  );
}

export const action = async ({
  request,
}: ActionFunctionArgs): IActionFunctionReturn => {
  const { session, headers } = await isAuthenticated(request);
  if (!session) {
    return data(
      {
        success: false,
        toast: {
          type: 'error',
          message: 'Bạn cần đăng nhập để thực hiện hành động này',
        },
      },
      { headers },
    );
  }

  try {
    const formData = await request.formData();
    switch (request.method) {
      case 'DELETE':
        const documentIdsString = formData.get('itemIds') as string;
        if (!documentIdsString) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có tài liệu nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }

        const documentIds = JSON.parse(documentIdsString);
        if (!Array.isArray(documentIds) || documentIds.length === 0) {
          return data(
            {
              success: false,
              toast: {
                message: 'Không có tài liệu nào được chọn để xóa',
                type: 'error',
              },
            },
            { headers },
          );
        }
        // Call the bulk delete function
        await deleteMultipleDocuments(documentIds, session);

        return data(
          {
            success: true,
            toast: {
              message: `Đã xóa ${documentIds.length} tài liệu thành công`,
              type: 'success',
            },
          },
          { headers },
        );

      case 'POST':
        const files = formData.getAll('document') as File[];
        const parent = formData.get('parent')?.toString().trim();
        if (!files.length) {
          // throw new Error('Vui lòng chọn ít nhất một tài liệu để tải lên');
          return data(
            {
              success: false,
              toast: {
                message: 'Vui lòng chọn ít nhất một tài liệu để tải lên',
                type: 'error',
              },
            },
            { headers, status: 400 },
          );
        }
        if (!parent) {
          return data(
            {
              success: false,
              toast: {
                message: 'Vui lòng chọn một thư mục để tải tài liệu',
                type: 'error',
              },
            },
            { headers, status: 400 },
          );
        }

        const payload = new FormData();
        for (let i = 0; i < files.length; i++) {
          payload.append('documents', files[i]);
        }
        payload.set('parent', parent);
        await uploadDocument(payload, session!);

        return data(
          {
            success: true,
            toast: {
              message: 'Upload Tài liệu thành công!',
              type: 'success',
            },
          },
          { headers },
        );

      default:
        return data(
          {
            success: false,
            toast: { message: 'Phương thức không hợp lệ', type: 'error' },
          },

          { headers },
        );
    }
  } catch (error: any) {
    console.error('Action error:', error);
    return data(
      {
        success: false,
        toast: {
          message: error.message || 'Có lỗi xảy ra khi thực hiện hành động',
          type: 'error',
        },
      },
      { headers },
    );
  }
};
