import { Link } from '@remix-run/react';
import Defer from '~/components/Defer';
import ErrorCard from '~/components/ErrorCard';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { ILoaderDataPromise } from '~/interfaces/app.interface';
import { IListResponse } from '~/interfaces/response.interface';
import { ICaseService } from '~/interfaces/case.interface';
import { formatDate } from '~/utils';
import { Plus } from 'lucide-react';
import {
  CASE_SERVICE,
  CASE_STATUS_BADGE_CLASSES,
} from '~/constants/caseService.constant';

interface CustomerCaseServiceListProps {
  customerId: string;
  customerCaseServicesPromise: ILoaderDataPromise<IListResponse<ICaseService>>;
}

export default function CustomerCaseServiceList({
  customerId,
  customerCaseServicesPromise,
}: CustomerCaseServiceListProps): JSX.Element {
  return (
    <Card className='rounded-xl overflow-hidden shadow-lg border border-gray-200'>
      <CardHeader className='bg-gradient-to-r from-red-900 to-red-800 text-white py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0'>
        <div className='text-center sm:text-left w-full'>
          <CardTitle className='text-white text-lg sm:text-xl lg:text-2xl font-bold'>
            Hồ sơ Dịch vụ
          </CardTitle>
          <CardDescription className='text-yellow-400 text-sm sm:text-base mt-1'>
            Danh sách hồ sơ dịch vụ của khách hàng
          </CardDescription>
        </div>
        <Button
          variant='secondary'
          size='sm'
          className='bg-white text-red-700 hover:bg-red-50 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 w-fit m-auto sm:m-0'
          asChild
        >
          <Link to={`/erp/crm/cases/new?customerId=${customerId}`}>
            <Plus className='w-3 h-3 sm:w-4 sm:h-4 mr-1' />
            <span className='hidden sm:inline'>Tạo hồ sơ mới</span>
            <span className='sm:hidden'>Tạo mới</span>
          </Link>
        </Button>
      </CardHeader>
      <CardContent className='p-4 sm:p-6'>
        <Defer resolve={customerCaseServicesPromise}>
          {(caseServicesData) => {
            const caseServices = caseServicesData.data || [];

            if (caseServices.length === 0) {
              return (
                <div className='text-center py-6 sm:py-8 text-gray-500'>
                  <p className='text-base sm:text-lg'>
                    Chưa có hồ sơ dịch vụ nào
                  </p>
                  <p className='text-sm sm:text-base mt-2'>
                    Tạo hồ sơ dịch vụ mới để bắt đầu quản lý công việc
                  </p>
                </div>
              );
            }

            return (
              <div className='space-y-3 sm:space-y-4'>
                {caseServices.map((caseService) => (
                  <div
                    key={caseService.id}
                    className='border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow'
                  >
                    <div className='flex flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0'>
                      <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3'>
                        <h3 className='font-semibold text-base sm:text-lg text-gray-800'>
                          {caseService.case_code}
                        </h3>
                        <Badge
                          className={`text-xs sm:text-sm w-fit ${CASE_STATUS_BADGE_CLASSES[caseService.case_status]}`}
                        >
                          {CASE_SERVICE.STATUS[caseService.case_status]}
                        </Badge>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        className='text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 w-fit'
                        asChild
                      >
                        <Link to={`/erp/crm/cases/${caseService.id}`}>
                          <span className=''>Xem chi tiết</span>
                        </Link>
                      </Button>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-sm text-gray-600'>
                      <div>
                        <span className='font-medium'>Ngày tạo:</span>{' '}
                        {formatDate(caseService.createdAt, 'DD/MM/YYYY')}
                      </div>
                      <div>
                        <span className='font-medium'>Cập nhật:</span>{' '}
                        {formatDate(caseService.updatedAt, 'DD/MM/YYYY')}
                      </div>
                      <div className='sm:col-span-2 lg:col-span-1'>
                        <span className='font-medium'>Mã khách hàng:</span>{' '}
                        {caseService.case_customer?.cus_code}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          }}
        </Defer>
      </CardContent>
    </Card>
  );
}
