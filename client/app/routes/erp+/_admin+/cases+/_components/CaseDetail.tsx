import { Link } from '@remix-run/react';
import { useState } from 'react';
import BriefEmployeeCard from '~/components/BriefEmployeeCard';
import Defer from '~/components/Defer';
import LoadingCard from '~/components/LoadingCard';
import ErrorCard from '~/components/ErrorCard';
import TextRenderer from '~/components/TextRenderer';
import TextAreaInput from '~/components/TextAreaInput';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  CASE_SERVICE,
  CASE_STATUS_BADGE_CLASSES,
} from '~/constants/caseService.constant';
import { ILoaderDataPromise, IResolveError } from '~/interfaces/app.interface';
import {
  ICaseService,
  InstallmentPlanItem,
  IncurredCost,
} from '~/interfaces/case.interface';
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
  Calculator,
  CreditCard,
  DollarSign,
  TrendingUp,
  PieChart,
  Plus,
} from 'lucide-react';
import { Button } from '~/components/ui/button';
import CaseParticipantList from './CaseParticipantList';
import CaseInstallmentList from './CaseInstallmentList';
import CaseIncurredCostList from './CaseIncurredCostList';
import { isResolveError } from '~/lib';

export default function CaseDetail({
  caseService,
}: {
  caseService: ICaseService | IResolveError;
}) {
  if (isResolveError(caseService)) {
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
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 rounded-t-xl animate-in slide-in-from-top-3 duration-400'>
        <div className='flex items-center space-x-3 sm:space-x-4'>
          <div className='w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center animate-in scale-in-0 duration-500 delay-200 transition-transform hover:scale-110'>
            <FileText className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
          </div>
          <div className='min-w-0 flex-1 animate-in slide-in-from-left-3 duration-500 delay-100'>
            <CardTitle className='text-white text-xl sm:text-2xl lg:text-3xl font-bold truncate'>
              {caseService.case_code}
            </CardTitle>
            <p className='text-yellow-300 text-sm sm:text-base lg:text-lg truncate animate-in slide-in-from-left-2 duration-400 delay-300'>
              Khách hàng: {caseService.case_customer.cus_firstName}{' '}
              {caseService.case_customer.cus_lastName}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-4 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in-0 duration-600 delay-200'>
        {/* Basic Information */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
          <div className='space-y-3 sm:space-y-4 animate-in slide-in-from-left-2 duration-500 delay-300'>
            <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center transition-colors duration-200 hover:text-primary'>
              <FileText className='w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-transform duration-200 hover:scale-110' />
              Thông tin cơ bản
            </h3>

            <div className='space-y-2 sm:space-y-3'>
              <div className='flex items-start space-x-2 sm:space-x-3 animate-in slide-in-from-left-1 duration-400 delay-400 transition-all duration-200 hover:bg-gray-50 rounded-lg p-2 -ml-2'>
                <IdCard className='w-4 h-4 text-gray-400 mt-0.5 transition-colors duration-200 hover:text-primary' />
                <div className='min-w-0 flex-1'>
                  <span className='text-sm sm:text-base text-gray-500 block'>
                    Mã hồ sơ:
                  </span>
                  <span className='text-sm sm:text-base font-medium break-all'>
                    {caseService.case_code}
                  </span>
                </div>
              </div>

              <div className='flex items-start space-x-2 sm:space-x-3 animate-in slide-in-from-left-1 duration-400 delay-450 transition-all duration-200 hover:bg-gray-50 rounded-lg p-2 -ml-2'>
                <Users className='w-4 h-4 text-gray-400 mt-0.5 transition-colors duration-200 hover:text-primary' />
                <div className='min-w-0 flex-1'>
                  <span className='text-sm sm:text-base text-gray-500 block'>
                    Khách hàng:
                  </span>
                  <Link
                    to={`/erp/customers/${caseService.case_customer.id}`}
                    className='text-sm sm:text-base font-medium break-words transition-all duration-200 hover:text-primary hover:underline'
                    prefetch='intent'
                  >
                    {caseService.case_customer.cus_firstName}{' '}
                    {caseService.case_customer.cus_lastName}
                  </Link>
                </div>
              </div>

              <div className='flex items-start space-x-2 sm:space-x-3 animate-in slide-in-from-left-1 duration-400 delay-500 transition-all duration-200 hover:bg-gray-50 rounded-lg p-2 -ml-2'>
                <AlertCircle className='w-4 h-4 text-gray-400 mt-0.5 transition-colors duration-200 hover:text-primary' />
                <div className='min-w-0 flex-1'>
                  <span className='text-sm sm:text-base text-gray-500 block'>
                    Trạng thái:
                  </span>
                  <Badge
                    className={`text-sm sm:text-base mt-1 transition-all duration-200 hover:scale-105 ${CASE_STATUS_BADGE_CLASSES[caseService.case_status]}`}
                  >
                    {CASE_SERVICE.STATUS[caseService.case_status]}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Case Timeline */}
          <div className='space-y-3 sm:space-y-4 animate-in slide-in-from-right-2 duration-500 delay-350'>
            <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center transition-colors duration-200 hover:text-primary'>
              <Calendar className='w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-transform duration-200 hover:scale-110' />
              Thông tin thời gian
            </h3>

            <div className='space-y-2 sm:space-y-3'>
              <div className='flex items-start space-x-2 sm:space-x-3 animate-in slide-in-from-right-1 duration-400 delay-450 transition-all duration-200 hover:bg-gray-50 rounded-lg p-2 -ml-2'>
                <Clock className='w-4 h-4 text-gray-400 mt-0.5 transition-colors duration-200 hover:text-primary' />
                <div className='min-w-0 flex-1'>
                  <span className='text-sm sm:text-base text-gray-500 block'>
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

              <div className='flex items-start space-x-2 sm:space-x-3 animate-in slide-in-from-right-1 duration-400 delay-500 transition-all duration-200 hover:bg-gray-50 rounded-lg p-2 -ml-2'>
                <CheckCircle className='w-4 h-4 text-gray-400 mt-0.5 transition-colors duration-200 hover:text-green-500' />
                <div className='min-w-0 flex-1'>
                  <span className='text-sm sm:text-base text-gray-500 block'>
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

              <div className='flex items-start space-x-2 sm:space-x-3 animate-in slide-in-from-right-1 duration-400 delay-550 transition-all duration-200 hover:bg-gray-50 rounded-lg p-2 -ml-2'>
                <Calendar className='w-4 h-4 text-gray-400 mt-0.5 transition-colors duration-200 hover:text-primary' />
                <div className='min-w-0 flex-1'>
                  <span className='text-sm sm:text-base text-gray-500 block'>
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

              <div className='flex items-start space-x-2 sm:space-x-3 animate-in slide-in-from-right-1 duration-400 delay-600 transition-all duration-200 hover:bg-gray-50 rounded-lg p-2 -ml-2'>
                <Calendar className='w-4 h-4 text-gray-400 mt-0.5 transition-colors duration-200 hover:text-primary' />
                <div className='min-w-0 flex-1'>
                  <span className='text-sm sm:text-base text-gray-500 block'>
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
          <div className='space-y-2 sm:space-y-3 animate-in slide-in-from-bottom-3 fade-in-0 duration-500 delay-400'>
            <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center transition-colors duration-200 hover:text-primary'>
              <FileText className='w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-transform duration-200 hover:scale-110' />
              Ghi chú
            </h3>
            <div className='bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200 transition-all duration-200 hover:bg-gray-100 hover:shadow-md'>
              <TextRenderer content={caseService.case_notes} />
            </div>
          </div>
        )}

        {/* Financial Summary */}
        {caseService.case_totalsCache && (
          <div className='space-y-3 sm:space-y-4 animate-in slide-in-from-bottom-3 fade-in-0 duration-500 delay-450'>
            <h3 className='text-base sm:text-lg font-semibold text-gray-900 flex items-center transition-colors duration-200 hover:text-primary'>
              <PieChart className='w-4 h-4 sm:w-5 sm:h-5 mr-2 transition-transform duration-200 hover:scale-110 hover:rotate-12' />
              Tổng quan tài chính
            </h3>
            <div className='bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200 transition-all duration-300 hover:bg-green-100 hover:shadow-lg animate-in scale-in-0 duration-400 delay-500'>
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
                <div className='flex items-center space-x-2 animate-in slide-in-from-left-1 duration-300 delay-550 transition-all duration-200 hover:scale-105'>
                  <DollarSign className='w-4 h-4 text-green-600 transition-transform duration-200 hover:scale-125' />
                  <div>
                    <span className='text-xs text-gray-500 block'>
                      Giá cơ bản
                    </span>
                    <span className='text-sm font-medium text-green-700'>
                      {caseService.case_pricing.baseAmount.toLocaleString(
                        'vi-VN',
                      )}{' '}
                      VNĐ
                    </span>
                  </div>
                </div>

                {caseService.case_pricing.discounts !== 0 && (
                  <div className='flex items-center space-x-2 animate-in slide-in-from-left-1 duration-300 delay-600 transition-all duration-200 hover:scale-105'>
                    <TrendingUp className='w-4 h-4 text-red-600 transition-transform duration-200 hover:scale-125' />
                    <div>
                      <span className='text-xs text-gray-500 block'>
                        Giảm giá
                      </span>
                      <span className='text-sm font-medium text-red-700'>
                        {caseService.case_pricing.discounts?.toLocaleString(
                          'vi-VN',
                        )}{' '}
                        VNĐ
                      </span>
                    </div>
                  </div>
                )}

                {caseService.case_pricing.addOns !== 0 && (
                  <div className='flex items-center space-x-2 animate-in slide-in-from-left-1 duration-300 delay-650 transition-all duration-200 hover:scale-105'>
                    <PieChart className='w-4 h-4 text-blue-600 transition-transform duration-200 hover:scale-125 hover:rotate-12' />
                    <div>
                      <span className='text-xs text-gray-500 block'>
                        Phụ phí
                      </span>
                      <span className='text-sm font-medium text-blue-700'>
                        {caseService.case_pricing.addOns?.toLocaleString(
                          'vi-VN',
                        )}{' '}
                        VNĐ
                      </span>
                    </div>
                  </div>
                )}

                {caseService.case_pricing.taxes &&
                  caseService.case_pricing.taxes.length > 0 && (
                    <div className='flex items-center space-x-2 animate-in slide-in-from-left-1 duration-300 delay-700 transition-all duration-200 hover:scale-105'>
                      <Calculator className='w-4 h-4 text-purple-600 transition-transform duration-200 hover:scale-125' />
                      <div>
                        <span className='text-xs text-gray-500 block'>
                          Thuế
                        </span>
                        <div className='space-y-1'>
                          {caseService.case_pricing.taxes.map((tax, index) => (
                            <div
                              key={index}
                              className='text-sm font-medium text-purple-700'
                            >
                              {tax.name}:{' '}
                              {tax.mode === 'PERCENT'
                                ? `${tax.value}%`
                                : `${tax.value.toLocaleString('vi-VN')} VNĐ`}
                            </div>
                          ))}

                          <div className='text-sm font-medium text-purple-900'>
                            Tổng thuế:{' '}
                            {caseService.case_totalsCache.taxComputed.toLocaleString(
                              'vi-VN',
                            )}{' '}
                            VNĐ
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div className='bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200 transition-all duration-300 hover:bg-blue-100 hover:shadow-lg animate-in scale-in-0 duration-400 delay-550'>
              {/* Progress bar for payment completion */}
              {caseService.case_totalsCache.scheduled > 0 && (
                <div className='mb-4 animate-in slide-in-from-bottom-2 duration-400 delay-600'>
                  <div className='flex justify-between text-sm text-gray-600 mb-1'>
                    <span>Tiến độ thanh toán</span>
                    <span>
                      {(
                        (caseService.case_totalsCache.paid /
                          caseService.case_totalsCache.scheduled) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-green-500 h-2 rounded-full transition-all duration-300'
                      style={{
                        width: `${Math.min((caseService.case_totalsCache.paid / caseService.case_totalsCache.scheduled) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
                <div className='text-center p-3 bg-white rounded-lg shadow-sm'>
                  <div className='text-lg font-bold text-blue-600'>
                    {caseService.case_totalsCache.scheduled.toLocaleString(
                      'vi-VN',
                    )}{' '}
                    VNĐ
                  </div>
                  <div className='text-xs text-gray-500'>Tổng kế hoạch</div>
                </div>

                <div className='text-center p-3 bg-white rounded-lg shadow-sm'>
                  <div className='text-lg font-bold text-green-600'>
                    {caseService.case_totalsCache.paid.toLocaleString('vi-VN')}{' '}
                    VNĐ
                  </div>
                  <div className='text-xs text-gray-500'>Đã thanh toán</div>
                </div>

                <div className='text-center p-3 bg-white rounded-lg shadow-sm'>
                  <div className='text-lg font-bold text-purple-600'>
                    {caseService.case_totalsCache.netFinal.toLocaleString(
                      'vi-VN',
                    )}{' '}
                    VNĐ
                  </div>
                  <div className='text-xs text-gray-500'>Lợi nhuận ròng</div>
                </div>
              </div>

              {/* Additional financial metrics if available */}
              {(caseService.case_totalsCache.incurredCostTotal > 0 ||
                caseService.case_totalsCache.commissionTotal > 0) && (
                <div className='mt-4 pt-4 border-t border-blue-200 animate-in slide-in-from-bottom-2 duration-400 delay-650'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {caseService.case_totalsCache.incurredCostTotal > 0 && (
                      <div className='text-center p-2 bg-red-50 rounded-lg border border-red-400 transition-all duration-200 hover:bg-red-100 hover:scale-105 animate-in scale-in-0 duration-300'>
                        <div className='text-sm font-bold text-red-600'>
                          {caseService.case_totalsCache.incurredCostTotal.toLocaleString(
                            'vi-VN',
                          )}{' '}
                          VNĐ
                        </div>
                        <div className='text-xs text-red-500'>
                          Chi phí phát sinh
                        </div>
                      </div>
                    )}

                    {caseService.case_totalsCache.commissionTotal > 0 && (
                      <div className='text-center p-2 bg-yellow-50 rounded-lg border border-yellow-400 transition-all duration-200 hover:bg-yellow-100 hover:scale-105 animate-in scale-in-0 duration-300'>
                        <div className='text-sm font-bold text-yellow-600'>
                          {caseService.case_totalsCache.commissionTotal.toLocaleString(
                            'vi-VN',
                          )}{' '}
                          VNĐ
                        </div>
                        <div className='text-xs text-yellow-600'>Hoa hồng</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Next due date alert */}
              {caseService.case_totalsCache.nextDueDate && (
                <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg transition-all duration-200 hover:bg-yellow-100 hover:shadow-md animate-in slide-in-from-left-2 duration-400 delay-800'>
                  <div className='flex items-center space-x-2'>
                    <AlertCircle className='w-4 h-4 text-yellow-600 transition-transform duration-200 hover:scale-125' />
                    <span className='text-sm font-medium text-yellow-800'>
                      Ngày đến hạn tiếp theo:{' '}
                      {format(
                        new Date(caseService.case_totalsCache.nextDueDate),
                        'dd/MM/yyyy',
                        { locale: vi },
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Overdue alert */}
              {caseService.case_totalsCache.overdueCount > 0 && (
                <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg transition-all duration-200 hover:bg-red-100 hover:shadow-md animate-in slide-in-from-right-2 duration-400 delay-850'>
                  <div className='flex items-center space-x-2'>
                    <AlertCircle className='w-4 h-4 text-red-600 transition-transform duration-200 hover:scale-125 animate-pulse' />
                    <span className='text-sm font-medium text-red-800'>
                      Có {caseService.case_totalsCache.overdueCount} kỳ thanh
                      toán quá hạn
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className='animate-in slide-in-from-left-3 duration-500 delay-500'>
          <CaseInstallmentList
            caseId={caseService.id}
            installments={caseService.case_installments || []}
          />
        </div>

        <div className='animate-in slide-in-from-right-3 duration-500 delay-550'>
          <CaseIncurredCostList
            caseId={caseService.id}
            incurredCosts={caseService.case_incurredCosts || []}
          />
        </div>

        <div className='animate-in slide-in-from-left-3 duration-500 delay-600'>
          <CaseParticipantList
            caseId={caseService.id}
            caseParticipants={caseService.case_participants as any}
          />
        </div>

        {/* Actions */}
        <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200 animate-in slide-in-from-bottom-3 fade-in-0 duration-500 delay-650'>
          <Button
            variant={'primary'}
            asChild
            className='justify-center sm:justify-start transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95'
          >
            <Link to='./edit' prefetch='intent'>
              <Edit className='w-4 h-4 transition-transform duration-200 hover:rotate-12' />
              <span className='hidden sm:inline'>Chỉnh sửa hồ sơ</span>
              <span className='sm:hidden'>Chỉnh sửa</span>
            </Link>
          </Button>

          <Button
            variant={'secondary'}
            asChild
            className='justify-center sm:justify-start transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95'
          >
            <Link to='/erp/cases' prefetch='intent'>
              <ArrowLeft className='w-4 h-4 transition-transform duration-200 hover:-translate-x-1' />
              <span className='hidden sm:inline'>Quay lại danh sách</span>
              <span className='sm:hidden'>Quay lại</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
