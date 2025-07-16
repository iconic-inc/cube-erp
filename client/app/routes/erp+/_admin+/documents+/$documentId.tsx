import { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { data, useLoaderData, useNavigate } from '@remix-run/react';
import { parseAuthCookie } from '~/services/cookie.server';
import { deleteDocument, getDocumentById } from '~/services/document.server';
import { isAuthenticated } from '~/services/auth.server';
import ContentHeader from '~/components/ContentHeader';
import DocumentDetail from './_components/DocumentDetail';
import { Edit } from 'lucide-react';
import { canAccessDocumentManagement } from '~/utils/permission';

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
        backHandler={() => navigate('/erp/documents')}
      />

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
