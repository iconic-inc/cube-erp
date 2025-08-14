import { Link, useFetcher } from '@remix-run/react';
import { ChevronsUpDown, Eye, Edit, Trash2 } from 'lucide-react';

import Defer from '~/components/Defer';
import { IEmployee } from '~/interfaces/employee.interface';
import { action } from '../../routes/erp+/_admin+/employees+/$employeeId';
import { useFetcherResponseHandler } from '~/hooks/useFetcherResponseHandler';

export default function EmployeeList({
  employees,
}: {
  employees: Promise<IEmployee[]>;
}) {
  const fetcher = useFetcher<typeof action>();

  useFetcherResponseHandler(fetcher);

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
                  Nhân viên
                </div>
              </th>

              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                <div className='flex items-center'>
                  Mã nhân viên
                  <ChevronsUpDown className='w-3 h-3 ml-1' />
                </div>
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                <div className='flex items-center'>
                  Phòng ban
                  <ChevronsUpDown className='w-3 h-3 ml-1' />
                </div>
              </th>

              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                <div className='flex items-center'>
                  Trạng thái
                  <ChevronsUpDown className='w-3 h-3 ml-1' />
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
                          prefetch='intent'
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
                          prefetch='intent'
                          className='text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-all'
                        >
                          <Eye className='w-4 h-4' />
                        </Link>

                        <Link
                          to={`/erp/employees/${employee.id}/edit`}
                          prefetch='intent'
                          className='text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-50 transition-all'
                        >
                          <Edit className='w-4 h-4' />
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
                          <Trash2 className='w-4 h-4' />
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
