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
            <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white p-3 sm:p-6 rounded-t-xl'>
              <div className='flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4'>
                <div className='w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0'>
                  <FileText className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
                </div>
                <div className='flex-1 text-center sm:text-left'>
                  <CardTitle className='text-white text-xl sm:text-3xl font-bold break-words'>
                    {document.doc_name}
                  </CardTitle>
                  <div className='flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 mt-2'>
                    <p className='text-amber-100 text-base sm:text-lg'>
                      ID: {document.id}
                    </p>
                    <Badge
                      variant={document.doc_isPublic ? 'default' : 'secondary'}
                      className={`text-sm sm:text-sm px-2 sm:px-3 py-1 rounded-full ${
                        document.doc_isPublic
                          ? 'bg-green-500 text-white'
                          : 'bg-yellow-500 text-white'
                      }`}
                    >
                      {document.doc_isPublic ? (
                        <>
                          <Globe className='w-3 h-3 mr-1' />
                          <span className=''>Công khai</span>
                        </>
                      ) : (
                        <>
                          <Lock className='w-3 h-3 mr-1' />
                          <span className=''>Hạn chế</span>
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className='p-3 sm:p-6 space-y-4 sm:space-y-6'>
              {/* Basic Information */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
                <div className='space-y-3 sm:space-y-4'>
                  <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
                    <FileText className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                    <span className='hidden sm:inline'>Thông tin cơ bản</span>
                    <span className='sm:hidden'>Thông tin</span>
                  </h3>

                  <div className='space-y-2 sm:space-y-3'>
                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2'>
                        <Globe className='w-4 h-4 sm:w-4 sm:h-4 text-gray-400' />
                        <span className='text-sm sm:text-sm text-gray-500'>
                          Trạng thái:
                        </span>
                      </div>
                      <Badge
                        variant={
                          document.doc_isPublic ? 'default' : 'destructive'
                        }
                        className={`${document.doc_isPublic ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'} hover:bg-unset text-sm w-fit`}
                      >
                        <span className=''>
                          {document.doc_isPublic
                            ? 'Công khai'
                            : 'Hạn chế truy cập'}
                        </span>
                      </Badge>
                    </div>

                    <div className='flex flex-col space-y-2'>
                      <div className='flex items-center space-x-2'>
                        <ExternalLink className='w-4 h-4 sm:w-4 sm:h-4 text-gray-400' />
                        <span className='text-sm sm:text-sm text-gray-500'>
                          Đường dẫn:
                        </span>
                      </div>
                      <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2'>
                        <span className='text-sm sm:text-sm font-medium text-blue-600 break-all flex-1'>
                          {document.doc_url}
                        </span>
                        <Button
                          size='sm'
                          onClick={() => handleDownload(document)}
                          className='bg-green-600 hover:bg-green-700 text-white text-sm sm:text-sm w-full sm:w-auto'
                        >
                          <Download className='w-4 h-4 sm:w-4 sm:h-4 mr-1' />
                          {downloaded ? 'Đã tải!' : 'Tải'}
                        </Button>
                      </div>
                    </div>

                    {doc_createdBy && (
                      <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                        <div className='flex items-center space-x-2'>
                          <User className='w-4 h-4 sm:w-4 sm:h-4 text-gray-400' />
                          <span className='text-sm sm:text-sm text-gray-500'>
                            <span className=''>Người tạo:</span>
                          </span>
                        </div>
                        <Link
                          to={`/erp/employees/${doc_createdBy.id}`}
                          className='text-sm sm:text-sm font-medium text-blue-600 hover:underline break-words'
                        >
                          {doc_createdBy.emp_user.usr_firstName}{' '}
                          {doc_createdBy.emp_user.usr_lastName}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Metadata */}
                <div className='space-y-3 sm:space-y-4'>
                  <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
                    <Calendar className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                    <span className='hidden sm:inline'>
                      Thông tin thời gian
                    </span>
                    <span className='sm:hidden'>Thời gian</span>
                  </h3>

                  <div className='space-y-2 sm:space-y-3'>
                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2'>
                        <Calendar className='w-4 h-4 sm:w-4 sm:h-4 text-gray-400' />
                        <span className='text-sm sm:text-sm text-gray-500'>
                          <span className=''>Ngày tạo:</span>
                        </span>
                      </div>
                      <span className='text-sm sm:text-sm font-medium'>
                        {document.createdAt
                          ? format(
                              new Date(document.createdAt),
                              'dd/MM/yyyy HH:mm',
                              { locale: vi },
                            )
                          : 'Không có thông tin'}
                      </span>
                    </div>

                    <div className='flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3'>
                      <div className='flex items-center space-x-2'>
                        <Calendar className='w-4 h-4 sm:w-4 sm:h-4 text-gray-400' />
                        <span className='text-sm sm:text-sm text-gray-500'>
                          <span className=''>Cập nhật lúc:</span>
                        </span>
                      </div>
                      <span className='text-sm sm:text-sm font-medium'>
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
                <div className='space-y-2 sm:space-y-3'>
                  <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
                    <FileText className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                    <span className='hidden sm:inline'>Mô tả tài liệu</span>
                    <span className='sm:hidden'>Mô tả</span>
                  </h3>
                  <div className='bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200'>
                    <TextRenderer content={document.doc_description} />
                  </div>
                </div>
              )}

              {/* Access Control */}
              {doc_whiteList && doc_whiteList.length > 0 && (
                <div className='space-y-3 sm:space-y-4'>
                  <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
                    <Users className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                    <span className=''>Quyền truy cập</span>
                  </h3>
                  {document.doc_isPublic ? (
                    <div className='bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200'>
                      <div className='flex items-center space-x-2'>
                        <Globe className='w-4 h-4 sm:w-5 sm:h-5 text-green-600' />
                        <p className='text-green-800 font-medium text-base sm:text-base'>
                          <span className='hidden sm:inline'>
                            Tài liệu công khai
                          </span>
                          <span className='sm:hidden'>Công khai</span>
                        </p>
                      </div>
                      <p className='text-green-700 text-sm sm:text-sm mt-2'>
                        <span className='hidden sm:inline'>
                          Tất cả nhân viên trong hệ thống đều có thể truy cập
                          tài liệu này.
                        </span>
                        <span className='sm:hidden'>
                          Tất cả nhân viên có thể truy cập.
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
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
              <div className='flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200'>
                <Button
                  asChild
                  variant={'primary'}
                  className='w-full sm:w-auto text-sm sm:text-sm'
                >
                  <Link to='./edit'>
                    <Edit className='w-4 h-4 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                    <span className='hidden sm:inline'>Chỉnh sửa tài liệu</span>
                    <span className='sm:hidden'>Chỉnh sửa</span>
                  </Link>
                </Button>

                <Button
                  onClick={() => handleDownload(document)}
                  className='inline-flex items-center justify-center w-full sm:w-auto px-3 sm:px-4 py-2 bg-green-600 text-white text-sm sm:text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                >
                  <Download className='w-4 h-4 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                  {downloaded ? (
                    <>
                      <span className='hidden sm:inline'>Đã tải xuống!</span>
                      <span className='sm:hidden'>Đã tải!</span>
                    </>
                  ) : (
                    <>
                      <span className='hidden sm:inline'>Tải xuống</span>
                      <span className='sm:hidden'>Tải</span>
                    </>
                  )}
                </Button>

                <Button
                  asChild
                  variant={'secondary'}
                  className='w-full sm:w-auto text-sm sm:text-sm'
                >
                  <Link to='/erp/documents'>
                    <ArrowLeft className='w-4 h-4 sm:w-4 sm:h-4 mr-1 sm:mr-2' />
                    <span className='hidden sm:inline'>Quay lại danh sách</span>
                    <span className='sm:hidden'>Quay lại</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }}
    </Defer>
  );
}
