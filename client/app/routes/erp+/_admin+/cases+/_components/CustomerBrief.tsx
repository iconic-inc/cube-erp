import { ICustomerBrief } from '~/interfaces/customer.interface';

export default function CustomerBrief({
  customer,
}: {
  customer?: ICustomerBrief;
}) {
  if (!customer) {
    return null;
  }

  return (
    <div className='p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm'>
      <h4 className='text-xl font-bold text-green-800 mb-3 flex items-center'>
        <span className='text-green-600 mr-2'>&#128100;</span> Chi tiết Khách
        hàng
      </h4>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm'>
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
          {customer.cus_email || 'N/A'}
        </p>
        <p>
          <span className='font-bold text-gray-700'>Số điện thoại:</span>{' '}
          {customer.cus_msisdn}
        </p>
      </div>
    </div>
  );
}
