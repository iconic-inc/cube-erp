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
      <CardHeader className='bg-gradient-to-r from-green-600 to-emerald-700 text-white py-4 flex flex-row items-center justify-between'>
        <div>
          <CardTitle className='text-white text-xl font-bold'>
            Hồ sơ Dịch vụ
          </CardTitle>
          <CardDescription className='text-green-100 mt-1'>
            Danh sách hồ sơ dịch vụ của khách hàng
          </CardDescription>
        </div>
        <Link to={`/erp/crm/cases/new?customerId=${customerId}`}>
          <Button
            variant='secondary'
            size='sm'
            className='bg-white text-green-700 hover:bg-green-50'
          >
            <Plus className='w-4 h-4 mr-1' />
            Tạo hồ sơ mới
          </Button>
        </Link>
      </CardHeader>
      <CardContent className='p-6'>
        <Defer resolve={customerCaseServicesPromise}>
          {(caseServicesData) => {
            const caseServices = caseServicesData.data || [];

            if (caseServices.length === 0) {
              return (
                <div className='text-center py-8 text-gray-500'>
                  <p className='text-lg'>Chưa có hồ sơ dịch vụ nào</p>
                  <p className='text-sm mt-2'>
                    Tạo hồ sơ dịch vụ mới để bắt đầu quản lý công việc
                  </p>
                </div>
              );
            }

            return (
              <div className='space-y-4'>
                {caseServices.map((caseService) => (
                  <div
                    key={caseService.id}
                    className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                  >
                    <div className='flex items-center justify-between mb-3'>
                      <div className='flex items-center gap-3'>
                        <h3 className='font-semibold text-lg text-gray-800'>
                          {caseService.case_code}
                        </h3>
                        <Badge
                          variant={
                            caseService.case_status === 'in_progress'
                              ? 'default'
                              : caseService.case_status === 'completed'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {caseService.case_status === 'in_progress'
                            ? 'Đang xử lý'
                            : caseService.case_status === 'completed'
                              ? 'Hoàn thành'
                              : caseService.case_status === 'open'
                                ? 'Mở'
                                : 'Đóng'}
                        </Badge>
                      </div>
                      <Link to={`/erp/crm/cases/${caseService.id}`}>
                        <Button variant='outline' size='sm'>
                          Xem chi tiết
                        </Button>
                      </Link>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600'>
                      <div>
                        <span className='font-medium'>Ngày tạo:</span>{' '}
                        {formatDate(caseService.createdAt, 'DD/MM/YYYY')}
                      </div>
                      <div>
                        <span className='font-medium'>Cập nhật:</span>{' '}
                        {formatDate(caseService.updatedAt, 'DD/MM/YYYY')}
                      </div>
                      <div>
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
