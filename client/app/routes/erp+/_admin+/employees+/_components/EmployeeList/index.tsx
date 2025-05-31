import { Link, useFetcher } from '@remix-run/react';
import { useEffect, useRef } from 'react';
import Defer from '~/components/Defer';
import { IEmployee } from '~/interfaces/employee.interface';
import { action } from '../../$employeeId';
import { toast } from 'react-toastify';

export default function EmployeeList({
  employees,
}: {
  employees: Promise<IEmployee[]>;
}) {
  const fetcher = useFetcher<typeof action>();

  const toastIdRef = useRef<any>(null);

  useEffect(() => {
    switch (fetcher.state) {
      case 'submitting':
        toastIdRef.current = toast.loading('Đang xử lý...', {
          autoClose: false,
        });
        // Xóa lỗi khi bắt đầu submit
        break;

      case 'idle':
        if (fetcher.data?.toast && toastIdRef.current) {
          const { toast: toastData } = fetcher.data;
          toast.update(toastIdRef.current, {
            render: toastData.message,
            type: toastData.type || 'success', // Default to 'success' if type is not provided
            autoClose: 3000,
            isLoading: false,
          });

          toastIdRef.current = null;

          break;
        }
        if (toastIdRef.current) {
          toast.update(toastIdRef.current, {
            render: 'Có lỗi xảy ra',
            type: 'error',
            autoClose: 3000,
            isLoading: false,
          });
          toastIdRef.current = null;
        }
        break;
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    className='mr-2 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500'
                  />
                  Nhân sự
                </div>
              </th>

              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                <div className='flex items-center'>
                  Mã nhân viên
                  <span className='material-symbols-outlined text-xs ml-1'>
                    unfold_more
                  </span>
                </div>
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                <div className='flex items-center'>
                  Phòng ban
                  <span className='material-symbols-outlined text-xs ml-1'>
                    unfold_more
                  </span>
                </div>
              </th>

              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                <div className='flex items-center'>
                  Trạng thái
                  <span className='material-symbols-outlined text-xs ml-1'>
                    unfold_more
                  </span>
                </div>
              </th>

              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Sđt
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            <Defer
              resolve={employees}
              fallback={
                <tr>
                  <td
                    colSpan={6}
                    className='px-6 py-4 text-center text-sm text-gray-500'
                  >
                    Loading...
                  </td>
                </tr>
              }
            >
              {(data) => {
                if (data.length === 0)
                  return (
                    <tr>
                      <td
                        colSpan={6}
                        className='px-6 py-4 text-center text-sm text-gray-500'
                      >
                        No employees found
                      </td>
                    </tr>
                  );

                return data.map((employee) => (
                  <tr
                    key={employee.id}
                    className='hover:bg-gray-50 transition-all'
                  >
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <input
                          type='checkbox'
                          className='mr-3 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500'
                        />

                        <Link
                          to={`/erp/employees/${employee.id}`}
                          className='flex items-center flex-grow text-gray-900 hover:text-red-500'
                        >
                          <div className='flex-shrink-0 h-10 w-10'>
                            <img
                              className='h-10 w-10 rounded-full object-cover'
                              src={
                                employee.emp_user.usr_avatar?.img_url ||
                                '/assets/user-avatar-placeholder.jpg'
                              }
                              alt=''
                            />
                          </div>
                          <div className='ml-4'>
                            <div className='text-sm font-medium'>
                              {employee.emp_user.usr_firstName}{' '}
                              {employee.emp_user.usr_lastName}
                            </div>
                            <div className='text-sm text-gray-500'>
                              {employee.emp_user.usr_email}
                            </div>
                          </div>
                        </Link>
                      </div>
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {employee.emp_code}
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800'>
                        {employee.emp_department}
                      </span>
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          employee.emp_user.usr_status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {employee.emp_user.usr_status || 'Unknown'}
                      </span>
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {employee.emp_user.usr_msisdn || 'Not provided'}
                    </td>

                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex justify-end space-x-2'>
                        <Link
                          to={`/erp/employees/${employee.id}`}
                          className='text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-all'
                        >
                          <span className='material-symbols-outlined text-sm'>
                            visibility
                          </span>
                        </Link>

                        <Link
                          to={`/erp/employees/${employee.id}/edit`}
                          className='text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-50 transition-all'
                        >
                          <span className='material-symbols-outlined text-sm'>
                            edit
                          </span>
                        </Link>

                        <button
                          className='text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-all'
                          onClick={async () => {
                            if (
                              confirm(
                                'Bạn có chắc chắn muốn xóa nhân viên này không?',
                              )
                            ) {
                              // Handle delete action here
                              await fetcher.submit(
                                { id: employee.id },
                                {
                                  method: 'delete',
                                  action: `/erp/employees/${employee.id}`,
                                },
                              );
                            }
                          }}
                        >
                          <span className='material-symbols-outlined text-sm'>
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ));
              }}
            </Defer>
          </tbody>
        </table>
      </div>
    </div>
  );
}
