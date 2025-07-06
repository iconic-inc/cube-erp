import { useState } from 'react';
import { Link } from '@remix-run/react';
import Defer from '~/components/Defer';
import LoadingCard from '~/components/LoadingCard';
import ErrorCard from '~/components/ErrorCard';
import { IDocument } from '~/interfaces/document.interface';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import TextRenderer from '~/components/TextRenderer';
import BriefEmployeeCard from '~/components/BriefEmployeeCard';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  FileText,
  Calendar,
  User,
  Download,
  Globe,
  Lock,
  Users,
  Edit,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';

export default function DocumentDetail({
  documentPromise,
}: {
  documentPromise: ILoaderDataPromise<IDocument>;
}) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = (document: IDocument) => {
    if (document?.doc_url) {
      // Prevent browser from opening the file by using fetch first
      fetch(document.doc_url)
        .then((response) => response.blob())
        .then((blob) => {
          // Create a blob URL for the file
          const blobUrl = URL.createObjectURL(blob);

          // Create a temporary link element to trigger the download
          const link = window.document.createElement('a');
          link.href = blobUrl;
          link.download = document.doc_name || 'document.pdf'; // Use document name or default to 'document.pdf'
          link.style.display = 'none';
          window.document.body.appendChild(link);
          link.click();

          // Clean up
          window.document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl); // Release the blob URL

          setDownloaded(true);
          setTimeout(() => setDownloaded(false), 2000); // Reset downloaded state after 2 seconds
        })
        .catch((error) => {
          console.error('Error downloading the file:', error);
          alert('Không thể tải xuống tập tin. Vui lòng thử lại sau.');
        });
    }
  };

  return (
    <Defer resolve={documentPromise} fallback={<LoadingCard />}>
      {(document) => {
        if (!document || 'success' in document) {
          return (
            <ErrorCard
              message={
                document &&
                'message' in document &&
                typeof document.message === 'string'
                  ? document.message
                  : 'Đã xảy ra lỗi khi tải dữ liệu tài liệu'
              }
            />
          );
        }

        const { doc_createdBy, doc_whiteList } = document;

        return (
          <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
            <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-6 rounded-t-xl'>
              <div className='flex items-center space-x-4'>
                <div className='w-16 h-16 bg-white/20 rounded-full flex items-center justify-center'>
                  <FileText className='w-8 h-8 text-white' />
                </div>
                <div className='flex-1'>
                  <CardTitle className='text-white text-3xl font-bold'>
                    {document.doc_name}
                  </CardTitle>
                  <div className='flex items-center space-x-3 mt-2'>
                    <p className='text-amber-100 text-lg'>ID: {document.id}</p>
                    <Badge
                      variant={document.doc_isPublic ? 'default' : 'secondary'}
                      className={`text-sm px-3 py-1 rounded-full ${
                        document.doc_isPublic
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {document.doc_isPublic ? (
                        <>
                          <Globe className='w-3 h-3 mr-1' />
                          Công khai
                        </>
                      ) : (
                        <>
                          <Lock className='w-3 h-3 mr-1' />
                          Hạn chế
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className='p-6 space-y-6'>
              {/* Basic Information */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <FileText className='w-5 h-5 mr-2' />
                    Thông tin cơ bản
                  </h3>

                  <div className='space-y-3'>
                    <div className='flex items-center space-x-3'>
                      <FileText className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Loại tài liệu:
                      </span>
                      <span className='text-sm font-medium'>
                        {document.doc_type || 'Chưa phân loại'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Globe className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Trạng thái:</span>
                      <Badge
                        variant={
                          document.doc_isPublic ? 'default' : 'secondary'
                        }
                        className='text-sm'
                      >
                        {document.doc_isPublic
                          ? 'Công khai'
                          : 'Hạn chế truy cập'}
                      </Badge>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <ExternalLink className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Đường dẫn:</span>
                      <div className='flex items-center space-x-2 flex-1 truncate'>
                        <span className='text-sm font-medium text-blue-600 truncate flex-1'>
                          {document.doc_url}
                        </span>
                        <Button
                          size='sm'
                          onClick={() => handleDownload(document)}
                          className='bg-green-600 hover:bg-green-700 text-white'
                        >
                          <Download className='w-3 h-3 mr-1' />
                          {downloaded ? 'Đã tải!' : 'Tải'}
                        </Button>
                      </div>
                    </div>

                    {doc_createdBy && (
                      <div className='flex items-center space-x-3'>
                        <User className='w-4 h-4 text-gray-400' />
                        <span className='text-sm text-gray-500'>
                          Người tạo:
                        </span>
                        <Link
                          to={`/erp/employees/${doc_createdBy.id}`}
                          className='text-sm font-medium text-blue-600 hover:underline'
                        >
                          {doc_createdBy.emp_user.usr_firstName}{' '}
                          {doc_createdBy.emp_user.usr_lastName}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Metadata */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <Calendar className='w-5 h-5 mr-2' />
                    Thông tin thời gian
                  </h3>

                  <div className='space-y-3'>
                    <div className='flex items-center space-x-3'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Ngày tạo:</span>
                      <span className='text-sm font-medium'>
                        {document.createdAt
                          ? format(
                              new Date(document.createdAt),
                              'dd/MM/yyyy HH:mm',
                              { locale: vi },
                            )
                          : 'Không có thông tin'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Cập nhật lúc:
                      </span>
                      <span className='text-sm font-medium'>
                        {document.updatedAt
                          ? format(
                              new Date(document.updatedAt),
                              'dd/MM/yyyy HH:mm',
                              { locale: vi },
                            )
                          : 'Không có thông tin'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {document.doc_description && (
                <div className='space-y-3'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <FileText className='w-5 h-5 mr-2' />
                    Mô tả tài liệu
                  </h3>
                  <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                    <TextRenderer content={document.doc_description} />
                  </div>
                </div>
              )}

              {/* Access Control */}
              {doc_whiteList && doc_whiteList.length > 0 && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <Users className='w-5 h-5 mr-2' />
                    Quyền truy cập
                  </h3>
                  {document.doc_isPublic ? (
                    <div className='bg-green-50 rounded-lg p-4 border border-green-200'>
                      <div className='flex items-center space-x-2'>
                        <Globe className='w-5 h-5 text-green-600' />
                        <p className='text-green-800 font-medium'>
                          Tài liệu công khai
                        </p>
                      </div>
                      <p className='text-green-700 text-sm mt-2'>
                        Tất cả nhân viên trong hệ thống đều có thể truy cập tài
                        liệu này.
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

              {/* Actions */}
              <div className='flex flex-wrap gap-3 pt-4 border-t border-gray-200'>
                <Button asChild variant={'primary'}>
                  <Link to='./edit'>
                    <Edit className='w-4 h-4 mr-2' />
                    Chỉnh sửa tài liệu
                  </Link>
                </Button>

                <Button
                  onClick={() => handleDownload(document)}
                  className='inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                >
                  <Download className='w-4 h-4 mr-2' />
                  {downloaded ? 'Đã tải xuống!' : 'Tải xuống'}
                </Button>

                <Link
                  to='/erp/documents'
                  className='inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                >
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  Quay lại danh sách
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      }}
    </Defer>
  );
}
