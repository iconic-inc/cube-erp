import { useState } from 'react';
import { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';

import { IDocument } from '~/interfaces/document.interface';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { formatDate } from '~/utils';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import { deleteDocument, getDocumentById } from '~/services/document.server';
import { isAuthenticated } from '~/services/auth.server';
import { data, useLoaderData, useNavigate } from '@remix-run/react';
import { parseAuthCookie } from '~/services/cookie.server';
import ContentHeader from '~/components/ContentHeader';
import Defer from '~/components/Defer';
import { Pen, Pencil, XCircle } from 'lucide-react';
import TextRenderer from '~/components/TextRenderer';
import BriefEmployeeCard from '~/components/BriefEmployeeCard';

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
  const [downloaded, setDownloaded] = useState(false);
  const navigate = useNavigate();

  const handleDownload = (document: IDocument) => {
    if (document?.doc_url) {
      // Create a temporary link element to trigger the download
      const link = window.document.createElement('a');
      link.href = document.doc_url;
      link.download = document.doc_name || 'document.pdf'; // Use document name or default to 'document.pdf'
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000); // Reset downloaded state after 2 seconds
    }
  };

  return (
    <div className='w-full space-y-6'>
      <ContentHeader
        title='Chi tiết tài liệu'
        actionContent={
          <>
            <Pencil />
            <span className='hidden md:inline'>Sửa tài liệu</span>
          </>
        }
        actionHandler={() => {
          // Navigate to the edit page
          navigate(`./edit`);
        }}
        actionVariant={'primary'}
        backHandler={() => navigate('/erp/documents')}
      />

      <Defer
        resolve={document}
        fallback={
          <div className='flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900'>
            <p className='text-lg text-gray-700 dark:text-gray-300'>
              Loading document details...
            </p>
          </div>
        }
      >
        {(document) => {
          const { doc_createdBy, doc_whiteList } = document;
          const creatorUser = doc_createdBy?.emp_user;

          return (
            <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
              <CardHeader className='bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-6 rounded-t-xl'>
                <CardTitle className='text-white text-3xl font-bold flex items-center justify-between'>
                  {document.doc_name}
                  <Badge
                    variant={document.doc_isPublic ? 'default' : 'secondary'}
                    className={`ml-3 text-sm px-3 py-1 rounded-full hover:bg-unset ${document.doc_isPublic ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}
                  >
                    {document.doc_isPublic ? 'Công khai' : 'Hạn chế'}
                  </Badge>
                </CardTitle>
                <CardDescription className='text-purple-100 mt-2 space-x-4'>
                  <span>ID: {document.id}</span>
                  {document.doc_type && (
                    <span className='mr-4'>
                      Loại tài liệu: {document.doc_type}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className='p-6 space-y-6'>
                <div>
                  <Label
                    htmlFor='docDescription'
                    className='text-gray-700 font-semibold mb-2 block'
                  >
                    Mô tả
                  </Label>
                  <div className='rounded-lg border border-gray-300 p-2 bg-gray-50 text-gray-800 break-words'>
                    <TextRenderer
                      content={document.doc_description || 'Chưa có mô tả'}
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor='docUrl'
                    className='text-gray-700 font-semibold mb-2 block'
                  >
                    Đường dẫn
                  </Label>
                  <div className='flex items-center space-x-2'>
                    <Input
                      id='docUrl'
                      value={document.doc_url}
                      readOnly
                      className='flex-grow bg-white border-gray-300 focus:ring-purple-500'
                    />
                    <Button
                      onClick={() => handleDownload(document)}
                      className='bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-md'
                    >
                      {downloaded ? 'Đã tải!' : 'Tải xuống'}
                    </Button>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <Label className='text-gray-700 font-semibold mb-2 block'>
                      Tạo lúc
                    </Label>
                    <Input
                      value={formatDate(
                        document.createdAt,
                        'HH:mm - DD/MM/YYYY',
                      )}
                      readOnly
                      className='bg-white border-gray-300'
                    />
                  </div>
                  <div>
                    <Label className='text-gray-700 font-semibold mb-2 block'>
                      Cập nhật lần cuối lúc
                    </Label>
                    <Input
                      value={formatDate(
                        document.updatedAt,
                        'HH:mm - DD/MM/YYYY',
                      )}
                      readOnly
                      className='bg-white border-gray-300'
                    />
                  </div>
                </div>

                {creatorUser && (
                  <div className='border-t border-gray-200 pt-6'>
                    <h4 className='text-xl font-bold text-gray-800 mb-4 flex items-center'>
                      <span className='text-purple-600 mr-2'>&#9432;</span>{' '}
                      Người tạo
                    </h4>
                    <div className='flex items-center space-x-4 p-4 bg-purple-50 rounded-lg shadow-sm border border-purple-200'>
                      <Avatar className='h-14 w-14 border-2 border-purple-400'>
                        <AvatarImage
                          src={creatorUser.usr_avatar?.img_url}
                          alt={`${creatorUser.usr_firstName} ${creatorUser.usr_lastName} Avatar`}
                        />

                        <AvatarFallback>{`${creatorUser.usr_firstName[0]}${creatorUser.usr_lastName[0]}`}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className='text-lg font-semibold text-gray-900'>
                          {creatorUser.usr_firstName} {creatorUser.usr_lastName}
                        </p>
                        <p className='text-sm text-gray-600'>
                          @{creatorUser.usr_username} (
                          {doc_createdBy.emp_position})
                        </p>
                        <p className='text-sm text-gray-500'>
                          {creatorUser.usr_email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {doc_whiteList && doc_whiteList.length > 0 && (
                  <div className='border-t border-gray-200 pt-6'>
                    <h4 className='text-xl font-bold text-gray-800 mb-4 flex items-center'>
                      <span className='text-indigo-600 mr-2'>&#128274;</span>{' '}
                      Danh sách nhân viên được phép truy cập
                    </h4>
                    {document.doc_isPublic ? (
                      <div className='mt-4 p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50'>
                        <p className='text-gray-600'>
                          Tài liệu này đang ở chế độ công khai. Tất cả nhân viên
                          trong hệ thống đều có thể truy cập tài liệu này.
                        </p>
                      </div>
                    ) : (
                      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {doc_whiteList.map((employee) => (
                          <BriefEmployeeCard
                            employee={employee}
                            key={employee.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        }}
      </Defer>
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
