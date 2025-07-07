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
                  : 'Đã xảy ra lỗi khi tải dữ liệu hồ sơ dịch vụ'
              }
            />
          );
        }

        return (
          <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
            <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-6 rounded-t-xl'>
              <div className='flex items-center space-x-4'>
                <div className='w-16 h-16 bg-white/20 rounded-full flex items-center justify-center'>
                  <FileText className='w-8 h-8 text-white' />
                </div>
                <div>
                  <CardTitle className='text-white text-3xl font-bold'>
                    {caseService.case_code}
                  </CardTitle>
                  <p className='text-yellow-500 text-lg'>
                    Khách hàng: {caseService.case_customer.cus_firstName}{' '}
                    {caseService.case_customer.cus_lastName}
                  </p>
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
                      <IdCard className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Mã hồ sơ:</span>
                      <span className='text-sm font-medium'>
                        {caseService.case_code}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Users className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Khách hàng:</span>
                      <span className='text-sm font-medium'>
                        {caseService.case_customer.cus_firstName}{' '}
                        {caseService.case_customer.cus_lastName}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <User className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Luật sư chính:
                      </span>
                      <span className='text-sm font-medium'>
                        {caseService.case_leadAttorney
                          ? `${caseService.case_leadAttorney.emp_user.usr_firstName} ${caseService.case_leadAttorney.emp_user.usr_lastName}`
                          : 'Chưa có luật sư chính'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <AlertCircle className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Trạng thái:</span>
                      <Badge
                        className={`text-sm ${CASE_STATUS_BADGE_CLASSES[caseService.case_status]}`}
                      >
                        {CASE_SERVICE.STATUS[caseService.case_status]}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Case Timeline */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <Calendar className='w-5 h-5 mr-2' />
                    Thông tin thời gian
                  </h3>

                  <div className='space-y-3'>
                    <div className='flex items-center space-x-3'>
                      <Clock className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Ngày bắt đầu:
                      </span>
                      <span className='text-sm font-medium'>
                        {caseService.case_startDate
                          ? format(
                              new Date(caseService.case_startDate),
                              'dd/MM/yyyy',
                              { locale: vi },
                            )
                          : 'Chưa có thông tin'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <CheckCircle className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>
                        Ngày kết thúc:
                      </span>
                      <span className='text-sm font-medium'>
                        {caseService.case_endDate
                          ? format(
                              new Date(caseService.case_endDate),
                              'dd/MM/yyyy',
                              { locale: vi },
                            )
                          : 'Chưa kết thúc'}
                      </span>
                    </div>

                    <div className='flex items-center space-x-3'>
                      <Calendar className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-500'>Ngày tạo:</span>
                      <span className='text-sm font-medium'>
                        {caseService.createdAt
                          ? format(
                              new Date(caseService.createdAt),
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

              {/* Notes */}
              {caseService.case_notes && (
                <div className='space-y-3'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <FileText className='w-5 h-5 mr-2' />
                    Ghi chú
                  </h3>
                  <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                    <TextRenderer content={caseService.case_notes} />
                  </div>
                </div>
              )}

              {/* Legal Team & Assignees */}
              {(caseService.case_leadAttorney ||
                caseService.case_assignees?.length) && (
                <div className='space-y-8'>
                  <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                    <Users className='w-5 h-5 mr-2' />
                    Người thực hiện
                  </h3>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
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
              <div className='flex flex-wrap gap-3 pt-4 border-t border-gray-200'>
                <Button variant={'primary'} asChild>
                  <Link to='./edit'>
                    <Edit />
                    Chỉnh sửa hồ sơ
                  </Link>
                </Button>

                <Button variant={'secondary'} asChild>
                  <Link to='/erp/crm/cases'>
                    <ArrowLeft />
                    Quay lại danh sách
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
