import { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import Defer from '~/components/Defer';
import { getEmployees } from '~/services/employee.server';
import EmployeeList from './_components/EmployeeList';
import ContentHeader from '../_components/ContentHeader';
import { parseAuthCookie } from '~/services/cookie.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const user = await parseAuthCookie(request);

    return {
      employees: getEmployees(user!).catch((e) => {
        console.error(e);

        return [];
      }),
    };
  } catch (error) {
    console.error(error);

    return { employees: Promise.resolve([]) };
  }
};

export default function HRMEmployees() {
  const { employees } = useLoaderData<typeof loader>();

  const navigate = useNavigate();

  return (
    <>
      {/* Content Header */}
      <ContentHeader
        title='Trang chủ'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>add</span>
            Thêm nhân sự
          </>
        }
        actionHandler={() => navigate('/erp/employees/new')}
      />

      {/* Employee Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <Defer resolve={employees}>
          {(data) => (
            <>
              <div className='bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-blue-500 transform hover:-translate-y-1'>
                <div className='flex justify-between items-start'>
                  <div>
                    <p className='text-gray-500 text-sm mb-1'>Tổng nhân sự</p>
                    <h3 className='text-2xl font-bold'>{data.length}</h3>
                    {/* <p className='text-xs text-green-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                arrow_upward
                </span>
                12 new this month
                </p> */}
                  </div>
                  <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
                    <span className='material-symbols-outlined text-blue-500'>
                      people
                    </span>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-purple-500 transform hover:-translate-y-1'>
                <div className='flex justify-between items-start'>
                  <div>
                    <p className='text-gray-500 text-sm mb-1'>Phòng ban</p>
                    <h3 className='text-2xl font-bold'>
                      {
                        data.reduce((prev, curr) => {
                          if (prev.includes(curr.emp_department)) return prev;
                          return [...prev, curr.emp_department];
                        }, [] as string[]).length
                      }
                    </h3>
                    {/* <p className='text-xs text-purple-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                pie_chart
                </span>
                View distribution
                </p> */}
                  </div>
                  <div className='w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center'>
                    <span className='material-symbols-outlined text-purple-500'>
                      category
                    </span>
                  </div>
                </div>
              </div>

              <div className='bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-green-500 transform hover:-translate-y-1'>
                <div className='flex justify-between items-start'>
                  <div>
                    <p className='text-gray-500 text-sm mb-1'>
                      Sinh nhật tháng {new Date().getMonth() + 1}
                    </p>
                    <h3 className='text-2xl font-bold'>
                      {
                        data.filter(
                          (emp) =>
                            emp.emp_user.usr_birthdate &&
                            new Date(emp.emp_user.usr_birthdate).getMonth() ===
                              new Date().getMonth(),
                        ).length
                      }
                    </h3>
                    <p className='text-xs text-green-500 mt-2 flex items-center'>
                      <span className='material-symbols-outlined text-xs mr-1'>
                        arrow_upward
                      </span>
                      {data
                        .filter(
                          (emp) =>
                            emp.emp_user.usr_birthdate &&
                            new Date(emp.emp_user.usr_birthdate).getMonth() ===
                              new Date().getMonth(),
                        )
                        .reduce(
                          (prev, curr) =>
                            prev
                              ? `${prev}, ${curr.emp_user.usr_firstName}`
                              : curr.emp_user.usr_firstName,
                          '',
                        )}
                    </p>
                  </div>
                  <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                    <span className='material-symbols-outlined text-green-500'>
                      check_circle
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </Defer>
      </div>

      {/* Filters and Actions Row */}
      {/* <div className='bg-white p-4 rounded-lg shadow-sm mb-6'>
        <div className='flex flex-wrap gap-4 items-center justify-between'>
          <div className='flex flex-wrap gap-2'>
            <details className='relative'>
              <summary className='flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-blue-500 transition-all duration-200'>
                <span className='material-symbols-outlined text-sm'>
                  business
                </span>
                <span className='text-sm'>Department</span>
                <span className='material-symbols-outlined text-sm'>
                  expand_more
                </span>
              </summary>
              <div className='absolute z-10 mt-1 bg-white rounded-md shadow-lg border border-gray-200 w-[180px]'>
                <div className='p-2'>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='dept-all' />
                    <label
                      htmlFor='dept-all'
                      className='text-sm cursor-pointer'
                    >
                      All Departments
                    </label>
                  </div>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='dept-hr' />
                    <label htmlFor='dept-hr' className='text-sm cursor-pointer'>
                      Human Resources
                    </label>
                  </div>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='dept-eng' />
                    <label
                      htmlFor='dept-eng'
                      className='text-sm cursor-pointer'
                    >
                      Engineering
                    </label>
                  </div>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='dept-mar' />
                    <label
                      htmlFor='dept-mar'
                      className='text-sm cursor-pointer'
                    >
                      Marketing
                    </label>
                  </div>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='dept-fin' />
                    <label
                      htmlFor='dept-fin'
                      className='text-sm cursor-pointer'
                    >
                      Finance
                    </label>
                  </div>
                </div>
              </div>
            </details>

            <details className='relative'>
              <summary className='flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-blue-500 transition-all duration-200'>
                <span className='material-symbols-outlined text-sm'>
                  location_on
                </span>
                <span className='text-sm'>Location</span>
                <span className='material-symbols-outlined text-sm'>
                  expand_more
                </span>
              </summary>
              <div className='absolute z-10 mt-1 bg-white rounded-md shadow-lg border border-gray-200 w-[180px]'>
                <div className='p-2'>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='loc-all' />
                    <label htmlFor='loc-all' className='text-sm cursor-pointer'>
                      All Locations
                    </label>
                  </div>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='loc-ny' />
                    <label htmlFor='loc-ny' className='text-sm cursor-pointer'>
                      New York
                    </label>
                  </div>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='loc-sf' />
                    <label htmlFor='loc-sf' className='text-sm cursor-pointer'>
                      San Francisco
                    </label>
                  </div>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='loc-lon' />
                    <label htmlFor='loc-lon' className='text-sm cursor-pointer'>
                      London
                    </label>
                  </div>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='loc-remote' />
                    <label
                      htmlFor='loc-remote'
                      className='text-sm cursor-pointer'
                    >
                      Remote
                    </label>
                  </div>
                </div>
              </div>
            </details>

            <details className='relative'>
              <summary className='flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-blue-500 transition-all duration-200'>
                <span className='material-symbols-outlined text-sm'>badge</span>
                <span className='text-sm'>Job Role</span>
                <span className='material-symbols-outlined text-sm'>
                  expand_more
                </span>
              </summary>
              <div className='absolute z-10 mt-1 bg-white rounded-md shadow-lg border border-gray-200 w-[180px]'>
                <div className='p-2'>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='role-all' />
                    <label
                      htmlFor='role-all'
                      className='text-sm cursor-pointer'
                    >
                      All Roles
                    </label>
                  </div>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='role-manager' />
                    <label
                      htmlFor='role-manager'
                      className='text-sm cursor-pointer'
                    >
                      Managers
                    </label>
                  </div>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='role-dev' />
                    <label
                      htmlFor='role-dev'
                      className='text-sm cursor-pointer'
                    >
                      Developers
                    </label>
                  </div>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='role-design' />
                    <label
                      htmlFor='role-design'
                      className='text-sm cursor-pointer'
                    >
                      Designers
                    </label>
                  </div>
                  <div className='flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer'>
                    <input type='checkbox' className='mr-2' id='role-analyst' />
                    <label
                      htmlFor='role-analyst'
                      className='text-sm cursor-pointer'
                    >
                      Analysts
                    </label>
                  </div>
                </div>
              </div>
            </details>

            <details className='relative'>
              <summary className='flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-md cursor-pointer hover:border-blue-500 transition-all duration-200'>
                <span className='material-symbols-outlined text-sm'>sort</span>
                <span className='text-sm'>Sort By</span>
                <span className='material-symbols-outlined text-sm'>
                  expand_more
                </span>
              </summary>
              <div className='absolute z-10 mt-1 bg-white rounded-md shadow-lg border border-gray-200 w-[180px]'>
                <div className='p-2'>
                  <div className='p-2 hover:bg-gray-50 rounded cursor-pointer text-sm'>
                    Name (A-Z)
                  </div>
                  <div className='p-2 hover:bg-gray-50 rounded cursor-pointer text-sm'>
                    Name (Z-A)
                  </div>
                  <div className='p-2 hover:bg-gray-50 rounded cursor-pointer text-sm'>
                    Newest First
                  </div>
                  <div className='p-2 hover:bg-gray-50 rounded cursor-pointer text-sm'>
                    Oldest First
                  </div>
                  <div className='p-2 hover:bg-gray-50 rounded cursor-pointer text-sm'>
                    Department
                  </div>
                </div>
              </div>
            </details>
          </div>

          <div className='flex items-center gap-2'>
            <button className='flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-all duration-200 text-sm'>
              <span className='material-symbols-outlined text-sm'>
                download
              </span>
              Export
            </button>
            <button className='flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-all duration-200 text-sm'>
              <span className='material-symbols-outlined text-sm'>print</span>
              Print
            </button>
            <button className='flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-all duration-200 text-sm'>
              <span className='material-symbols-outlined text-sm'>tune</span>
              More
            </button>
          </div>
        </div>
      </div> */}

      {/* Employee List */}
      <EmployeeList employees={employees} />
    </>
  );
}
