import { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { data, useLoaderData, useNavigate } from '@remix-run/react';
import { parseAuthCookie } from '~/services/cookie.server';
import { deleteDocument, getDocumentById } from '~/services/document.server';
import { isAuthenticated } from '~/services/auth.server';
import ContentHeader from '~/components/ContentHeader';
import DocumentDetail from './_components/DocumentDetail';
import { Edit } from 'lucide-react';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);
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
    <div className='w-full space-y-6'>
      <ContentHeader
        title='Chi tiết tài liệu'
        actionContent={
          <>
            <Edit className='w-4 h-4 mr-1' />
            Sửa tài liệu
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
