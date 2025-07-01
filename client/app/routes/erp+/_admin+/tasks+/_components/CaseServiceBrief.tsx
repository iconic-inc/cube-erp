import { Link } from '@remix-run/react';
import { BookUser } from 'lucide-react';
import { Button } from '~/components/ui/button';
import {
  CASE_SERVICE,
  CASE_STATUS_BADGE_CLASSES,
} from '~/constants/caseService.constant';
import { ICaseServiceBrief } from '~/interfaces/case.interface';

export default function CaseServiceBrief({
  caseService,
}: {
  caseService?: ICaseServiceBrief;
}) {
  if (!caseService) {
    return null;
  }

  const { case_customer: customer } = caseService;

  return (
    <div className='w-full p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm'>
      <div className='flex justify-between items-center'>
        <h4 className='text-xl font-bold text-green-800 mb-3 flex items-center'>
          <BookUser className='mr-2' />
          Chi tiết Hồ sơ vụ việc
        </h4>

        <Button variant='primary' asChild>
          <Link to={`/erp/crm/cases/${caseService.id}`}>Xem chi tiết</Link>
        </Button>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm'>
        <p>
          <span className='font-bold text-gray-700'>Mã Hồ sơ:</span>{' '}
          {caseService.case_code}
        </p>
        <p>
          <span className='font-bold text-gray-700'>Trạng thái:</span>{' '}
          <span
            className={`w-fit ${CASE_STATUS_BADGE_CLASSES[caseService.case_status]}`}
          >
            {CASE_SERVICE.STATUS[caseService.case_status]}
          </span>
        </p>

        <p>
          <span className='font-bold text-gray-700'>Mã Khách hàng:</span>{' '}
          {customer.cus_code}
        </p>
        <p className='truncate'>
          <span className='font-bold text-gray-700'>Họ và tên:</span>{' '}
          {customer.cus_firstName} {customer.cus_lastName}
        </p>
        <p>
          <span className='font-bold text-gray-700'>Email:</span>{' '}
          {customer.cus_email}
        </p>
        <p>
          <span className='font-bold text-gray-700'>Số điện thoại:</span>{' '}
          {customer.cus_msisdn}
        </p>
      </div>
    </div>
  );
}
