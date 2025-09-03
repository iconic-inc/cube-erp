import { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { data, Link, useLoaderData, useNavigate } from '@remix-run/react';
import { parseAuthCookie } from '~/services/cookie.server';
import { deleteDocument, getDocumentById } from '~/services/document.server';
import { isAuthenticated } from '~/services/auth.server';
import ContentHeader from '~/components/ContentHeader';
import DocumentDetail from './_components/DocumentDetail';
import { ChevronRight, Edit } from 'lucide-react';
import { canAccessDocumentManagement } from '~/utils/permission';
import Defer from '~/components/Defer';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (!canAccessDocumentManagement(user?.user.usr_role)) {
    throw new Response('Bạn không có quyền truy cập vào trang này.', {
      status: 403,
    });
  }

  // Fetch document details from the API
  const documentId = params.documentId as string;
  const document = getDocumentById(documentId, user!).catch((error) => {
    console.error('Error fetching document:', error.message);
    return {
      success: false,
      message:
        (error.message as string) || 'Có lỗi xảy ra khi lấy thông tin tài liệu',
    };
  });

  return { document };
};

export default function DocumentDetailPage() {
  const { document } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  return (
    <div className='space-y-4 sm:space-y-6 min-h-screen'>
      <ContentHeader
        title='Chi tiết tài liệu'
        actionContent={
          <>
            <Edit className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
            <span className='hidden sm:inline'>Sửa tài liệu</span>
            <span className='sm:hidden'>Sửa</span>
          </>
        }
        actionHandler={() => {
          navigate(`./edit`);
        }}
      />

      <div className='flex items-center'>
        <Link
          to='/erp/documents'
          className='mr-2 text-gray-900 hover:text-gray-500'
        >
          Danh sách thư mục
        </Link>
        <Defer resolve={document}>
          {({ doc_parent: folder }) => (
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
      </div>

      <DocumentDetail documentPromise={document} />
    </div>
  );
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { session, headers } = await isAuthenticated(request);

  switch (request.method) {
    case 'DELETE':
      await deleteDocument(params.documentId!, session!);
      return data(
        {
          toast: {
            type: 'success' as const,
            message: 'Xóa nhân viên thành công',
          },
        },
        { headers },
      );

    default:
      return data(
        {
          toast: {
            type: 'error' as const,
            message: 'Phương thức không hợp lệ',
          },
        },
        {
          status: 405,
          statusText: 'Method Not Allowed',
        },
      );
  }
};
