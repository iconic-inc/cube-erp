import { CUSTOMER } from '~/constants/customer.constant';
import { ICustomer } from '~/interfaces/customer.interface';
import { toVnDateString } from '~/utils';
import { Card, CardContent } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';

export default function CustomerProfileHeader({
  customer,
}: {
  customer: ICustomer;
}) {
  return (
    <Card>
      <CardContent className='flex flex-col md:flex-row gap-6 pt-6 items-start md:items-center'>
        <div className='relative'>
          <img
            src={
              // customer.cus_avatar?.img_url ||
              '/assets/user-avatar-placeholder.jpg'
            }
            alt={customer.cus_firstName}
            className='w-24 h-24 rounded-full object-cover border-4 border-white shadow-md'
          />
          {/* <div className='absolute bottom-0 right-0 bg-green-500 h-4 w-4 rounded-full border-2 border-white'></div> */}
        </div>

        <div className='flex-1'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between mb-2'>
            <h2 className='text-2xl font-bold mb-1 sm:mb-0'>{`${customer.cus_lastName} ${customer.cus_firstName}`}</h2>

            <div className='flex gap-4'>
              <div className='flex items-center gap-2'>
                <span>Nguồn khách:</span>
                <Badge className='bg-blue-500 text-white'>
                  {customer.cus_source || 'N/A'}
                </Badge>
              </div>

              <div className='flex items-center gap-2'>
                <span>Kênh liên hệ:</span>
                <Badge className='bg-green-500 text-white'>
                  {customer.cus_contactChannel || 'N/A'}
                </Badge>
              </div>
            </div>
          </div>

          <div className='text-gray-500 mb-4'>
            {`${
              customer.cus_sex === CUSTOMER.SEX.MALE ? 'Nam' : 'Nữ'
            } · ${customer.cus_code}`}
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2'>
            <div className='flex items-center text-gray-600'>
              <span className='material-symbols-outlined text-gray-400 mr-2'>
                mail
              </span>
              <a
                href={`mailto:${customer.cus_email}`}
                className='text-sm hover:underline'
              >
                {customer.cus_email}
              </a>
            </div>

            <div className='flex items-center text-gray-600'>
              <span className='material-symbols-outlined text-gray-400 mr-2'>
                phone
              </span>
              <a
                href={`tel:${customer.cus_msisdn}`}
                className='text-sm hover:underline'
              >
                {customer.cus_msisdn}
              </a>
            </div>

            <div className='flex items-center text-gray-600'>
              <span className='material-symbols-outlined text-gray-400 mr-2'>
                calendar_today
              </span>
              <span className='text-sm'>
                {customer.cus_birthDate
                  ? toVnDateString(customer.cus_birthDate)
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
