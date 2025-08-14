import { Link } from '@remix-run/react';
import BriefEmployeeCard from '~/components/BriefEmployeeCard';
import Defer from '~/components/Defer';
import LoadingCard from '~/components/LoadingCard';
import ErrorCard from '~/components/ErrorCard';
import TextRenderer from '~/components/TextRenderer';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
  CASE_SERVICE,
  CASE_STATUS_BADGE_CLASSES,
} from '~/constants/caseService.constant';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { ICaseService } from '~/interfaces/case.interface';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  FileText,
  Calendar,
  IdCard,
  Users,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '~/components/ui/button';

export default function CaseDetail({
  casePromise,
}: {
  casePromise: ILoaderDataPromise<ICaseService>;
}) {
  return (
    <Defer resolve={casePromise} fallback={<LoadingCard />}>
      {(caseService) => {
        if (!caseService || 'success' in caseService) {
          return (
            <ErrorCard
              message={
                caseService &&
                'message' in caseService &&
                typeof caseService.message === 'string'
                  ? caseService.message
                  : 'Đã xảy ra lỗi khi tải dữ liệu Hồ sơ vụ việc'
              }
            />
          );
        }

        return (
          <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
            <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 rounded-t-xl'>
              <div className='flex items-center space-x-3 sm:space-x-4'>
                <div className='w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center'>
                  <FileText className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
                </div>
                <div className='min-w-0 flex-1'>
                  <CardTitle className='text-white text-xl sm:text-2xl lg:text-3xl font-bold truncate'>
                    {caseService.case_code}
                  </CardTitle>
                  <p className='text-yellow-300 text-sm sm:text-base lg:text-lg truncate'>
                    Khách hàng: {caseService.case_customer.cus_firstName}{' '}
                    {caseService.case_customer.cus_lastName}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
              {/* Basic Information */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
                <div className='space-y-3 sm:space-y-4'>
                  <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
                    <FileText className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                    Thông tin cơ bản
                  </h3>

                  <div className='space-y-2 sm:space-y-3'>
                    <div className='flex items-start space-x-2 sm:space-x-3'>
                      <IdCard className='w-4 h-4 text-gray-400 mt-0.5' />
                      <div className='min-w-0 flex-1'>
                        <span className='text-xs sm:text-sm text-gray-500 block'>
                          Mã hồ sơ:
                        </span>
                        <span className='text-sm sm:text-base font-medium break-all'>
                          {caseService.case_code}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-start space-x-2 sm:space-x-3'>
                      <Users className='w-4 h-4 text-gray-400 mt-0.5' />
                      <div className='min-w-0 flex-1'>
                        <span className='text-xs sm:text-sm text-gray-500 block'>
                          Khách hàng:
                        </span>
                        <Link
                          to={`/erp/customers/${caseService.case_customer.id}`}
                          className='text-sm sm:text-base font-medium break-words'
                          prefetch='intent'
                        >
                          {caseService.case_customer.cus_firstName}{' '}
                          {caseService.case_customer.cus_lastName}
                        </Link>
                      </div>
                    </div>

                    <div className='flex items-start space-x-2 sm:space-x-3'>
                      <User className='w-4 h-4 text-gray-400 mt-0.5' />
                      <div className='min-w-0 flex-1'>
                        <span className='text-xs sm:text-sm text-gray-500 block'>
                          Luật sư chính:
                        </span>
                        <span className='text-sm sm:text-base font-medium break-words'>
                          {caseService.case_leadAttorney
                            ? `${caseService.case_leadAttorney.emp_user.usr_firstName} ${caseService.case_leadAttorney.emp_user.usr_lastName}`
                            : 'Chưa có luật sư chính'}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-start space-x-2 sm:space-x-3'>
                      <AlertCircle className='w-4 h-4 text-gray-400 mt-0.5' />
                      <div className='min-w-0 flex-1'>
                        <span className='text-xs sm:text-sm text-gray-500 block'>
                          Trạng thái:
                        </span>
                        <Badge
                          className={`text-xs sm:text-sm mt-1 ${CASE_STATUS_BADGE_CLASSES[caseService.case_status]}`}
                        >
                          {CASE_SERVICE.STATUS[caseService.case_status]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Case Timeline */}
                <div className='space-y-3 sm:space-y-4'>
                  <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
                    <Calendar className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                    Thông tin thời gian
                  </h3>

                  <div className='space-y-2 sm:space-y-3'>
                    <div className='flex items-start space-x-2 sm:space-x-3'>
                      <Clock className='w-4 h-4 text-gray-400 mt-0.5' />
                      <div className='min-w-0 flex-1'>
                        <span className='text-xs sm:text-sm text-gray-500 block'>
                          Ngày bắt đầu:
                        </span>
                        <span className='text-sm sm:text-base font-medium'>
                          {caseService.case_startDate
                            ? format(
                                new Date(caseService.case_startDate),
                                'dd/MM/yyyy',
                                { locale: vi },
                              )
                            : 'Chưa có thông tin'}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-start space-x-2 sm:space-x-3'>
                      <CheckCircle className='w-4 h-4 text-gray-400 mt-0.5' />
                      <div className='min-w-0 flex-1'>
                        <span className='text-xs sm:text-sm text-gray-500 block'>
                          Ngày kết thúc:
                        </span>
                        <span className='text-sm sm:text-base font-medium'>
                          {caseService.case_endDate
                            ? format(
                                new Date(caseService.case_endDate),
                                'dd/MM/yyyy',
                                { locale: vi },
                              )
                            : 'Chưa kết thúc'}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-start space-x-2 sm:space-x-3'>
                      <Calendar className='w-4 h-4 text-gray-400 mt-0.5' />
                      <div className='min-w-0 flex-1'>
                        <span className='text-xs sm:text-sm text-gray-500 block'>
                          Ngày tạo:
                        </span>
                        <span className='text-sm sm:text-base font-medium'>
                          {caseService.createdAt
                            ? format(
                                new Date(caseService.createdAt),
                                'dd/MM/yyyy HH:mm',
                                { locale: vi },
                              )
                            : 'Không có thông tin'}
                        </span>
                      </div>
                    </div>

                    <div className='flex items-start space-x-2 sm:space-x-3'>
                      <Calendar className='w-4 h-4 text-gray-400 mt-0.5' />
                      <div className='min-w-0 flex-1'>
                        <span className='text-xs sm:text-sm text-gray-500 block'>
                          Cập nhật lúc:
                        </span>
                        <span className='text-sm sm:text-base font-medium'>
                          {caseService.updatedAt
                            ? format(
                                new Date(caseService.updatedAt),
                                'dd/MM/yyyy HH:mm',
                                { locale: vi },
                              )
                            : 'Không có thông tin'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {caseService.case_notes && (
                <div className='space-y-2 sm:space-y-3'>
                  <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
                    <FileText className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                    Ghi chú
                  </h3>
                  <div className='bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200'>
                    <TextRenderer content={caseService.case_notes} />
                  </div>
                </div>
              )}

              {/* Legal Team & Assignees */}
              {(caseService.case_leadAttorney ||
                caseService.case_assignees?.length) && (
                <div className='space-y-6'>
                  <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center'>
                    <Users className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                    Người thực hiện
                  </h3>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
                    {caseService.case_leadAttorney && (
                      <BriefEmployeeCard
                        key={caseService.case_leadAttorney.id}
                        employee={caseService.case_leadAttorney}
                        highlighted
                        highlightText='Luật sư chính'
                      />
                    )}
                    {caseService.case_assignees?.map((assignee) => (
                      <BriefEmployeeCard
                        key={assignee.id}
                        employee={assignee}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200'>
                <Button
                  variant={'primary'}
                  asChild
                  className='justify-center sm:justify-start'
                >
                  <Link to='./edit' prefetch='intent'>
                    <Edit className='w-4 h-4' />
                    <span className='hidden sm:inline'>Chỉnh sửa hồ sơ</span>
                    <span className='sm:hidden'>Chỉnh sửa</span>
                  </Link>
                </Button>

                <Button
                  variant={'secondary'}
                  asChild
                  className='justify-center sm:justify-start'
                >
                  <Link to='/erp/cases' prefetch='intent'>
                    <ArrowLeft className='w-4 h-4' />
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
