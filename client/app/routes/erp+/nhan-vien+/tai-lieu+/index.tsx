import { ActionFunctionArgs, data, LoaderFunctionArgs } from '@remix-run/node';
import { Link, useFetcher, useLoaderData, useNavigate } from '@remix-run/react';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  deleteMultipleDocuments,
  // deleteMultipleDocuments,
  getDocuments,
  uploadDocument,
} from '~/services/document.server';
import ContentHeader from '~/components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';
import { IDocument } from '~/interfaces/document.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { IListColumn } from '~/interfaces/app.interface';
import { isAuthenticated } from '~/services/auth.server';
import List from '~/components/List';
import { toast } from 'react-toastify';
import { IEmployee } from '~/interfaces/employee.interface';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = Number(url.searchParams.get('limit')) || 10;
  const searchQuery = url.searchParams.get('search') || '';

  const sortBy = url.searchParams.get('sortBy') || 'createdAt';
  const sortOrder =
    (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';

  // Build a clean query object that matches the expected API format
  const query: any = {};

  // Search query - used for name, phone, email search
  if (searchQuery) {
    query.search = searchQuery;
  }
  // Pagination options
  const options = {
    page,
    limit,
    sortBy,
    sortOrder,
  };

  return {
    documentsPromise: getDocuments({ ...query }, options, user!).catch((e) => {
      console.error(e);
      return {
        data: [],
        pagination: {
          totalPages: 0,
          page: 1,
          limit: 10,
          total: 0,
        },
      } as IListResponse<IDocument>;
    }),
  };
};

export default function HRMDocuments() {
  const { documentsPromise } = useLoaderData<typeof loader>();

  const [visibleColumns, setVisibleColumns] = useState<
    IListColumn<IDocument>[]
  >([
    {
      key: 'doc_name',
      title: 'Tên tài liệu',
      visible: true,
      sortField: 'doc_name',
      render: (item: IDocument) => (
        <Link
          to={`/erp/nhan-vien/documents/${item.id}`}
          className='text-blue-600 hover:underline'
        >
          {item.doc_name}
        </Link>
      ),
    },
    {
      key: 'doc_url',
      title: 'Đường dẫn',
      visible: true,
      sortField: 'doc_url',
      render: (item: IDocument) => (
        <a
          href={item.doc_url}
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-600 hover:underline'
        >
          {item.doc_url}
        </a>
      ),
    },
    {
      key: 'doc_createdBy',
      title: 'Người tạo',
      visible: true,
      sortField: 'doc_createdBy',
      render: (item: IDocument) => {
        if (typeof item.doc_createdBy === 'string') {
          return item.doc_createdBy; // Assuming it's just a string ID
        }
        return (
          <Link
            to={`/erp/nhan-vien/employees/${item.doc_createdBy.id}`}
            className='text-blue-600 hover:underline'
          >
            {item.doc_createdBy.emp_user.usr_firstName}{' '}
            {item.doc_createdBy.emp_user.usr_lastName}
          </Link>
        );
      },
    },
    {
      key: 'doc_whiteList',
      title: 'Được phép truy cập',
      visible: true,
      render: (item: IDocument) => {
        if (typeof item.doc_whiteList === 'string') {
          return item.doc_whiteList; // Assuming it's just a string ID
        }
        return (
          <span>
            {item.doc_whiteList.map((emp) => (
              <Link
                key={emp.id}
                to={`/erp/nhan-vien/employees/${emp.id}`}
                className='text-blue-600 hover:underline'
              >
                {emp.emp_user.usr_firstName} {emp.emp_user.usr_lastName}
              </Link>
            ))}
          </span>
        );
      },
    },
  ]);
  const uploadFetcher = useFetcher<typeof action>();
  const toastIdRef = useRef<any>(null);

  const navigate = useNavigate();

  const addNewHandler = () => {
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

      toastIdRef.current = toast.loading('Đang tải lên...');
      uploadFetcher.submit(formData, {
        method: 'POST',
        encType: 'multipart/form-data',
      });
    };

    input.style.display = 'none';
    input.click();
  };

  useEffect(() => {
    if (uploadFetcher.data) {
      if (uploadFetcher.data.success) {
        toastIdRef.current = toast.update(toastIdRef.current, {
          render: 'Tải lên thành công',
          type: 'success',
          autoClose: 3000,
          isLoading: false,
        });
      } else {
        toastIdRef.current = toast.update(toastIdRef.current, {
          render:
            uploadFetcher.data.toast.message || 'Có lỗi xảy ra khi tải lên',
          type: 'error',
          autoClose: 3000,
          isLoading: false,
        });
      }
    }
  }, [uploadFetcher.data]);

  return (
    <div className='space-y-4 md:space-y-6 min-h-screen'>
      {/* Content Header */}
      <ContentHeader
        title='Trang chủ'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>add</span>
            Thêm tài liệu
          </>
        }
        actionHandler={() => addNewHandler()}
      />

      {/* Document Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'></div>

      <List<IDocument>
        itemsPromise={documentsPromise}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        addNewHandler={addNewHandler}
        name='Tài liệu'
      />
    </div>
  );
}

export const action = async ({ request }: ActionFunctionArgs) => {
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
    switch (request.method) {
      case 'DELETE':
        const formData = await request.formData();
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
        // Handle export action
        const body = await request.formData();

        try {
          const files = body.getAll('document') as File[];
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

          const formData = new FormData();

          for (let i = 0; i < files.length; i++) {
            formData.append('documents', files[i]);
          }
          const documents = await uploadDocument(formData, session!);

          return data(
            {
              documents,
              success: true,
              toast: {
                message: 'Upload Tài liệu thành công!',
                type: 'success',
              },
            },
            { headers },
          );
        } catch (error: any) {
          console.error(error);
          return data(
            {
              success: false,
              toast: { message: error.message, type: 'error' },
            },
            { headers },
          );
        }

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
