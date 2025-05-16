import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import DashContentHeader from '~/components/DashContentHeader';
import { isAuthenticated } from '~/services/auth.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const user = await isAuthenticated(request);

    return {};
  } catch (error) {
    console.error(error);

    return {};
  }
};

export default function IndexHRM() {
  const {} = useLoaderData<typeof loader>();

  const navigate = useNavigate();

  return (
    <>
      {/* Content Header */}
      <DashContentHeader
        title='Trang chủ'
        actionContent={
          <>
            <span className='material-symbols-outlined text-sm mr-1'>add</span>
            Thêm nhân sự
          </>
        }
        actionHandler={() => navigate('/hrm/employees/new')}
      />

      {/* Dashboard Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-blue-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Total Employees</p>
              <h3 className='text-2xl font-bold'>387</h3>
              <p className='text-xs text-green-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  arrow_upward
                </span>
                8% from last month
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-blue-500'>
                people
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-green-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Attendance Rate</p>
              <h3 className='text-2xl font-bold'>94.3%</h3>
              <p className='text-xs text-green-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  arrow_upward
                </span>
                2.1% from last month
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-green-500'>
                fact_check
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-purple-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Open Positions</p>
              <h3 className='text-2xl font-bold'>23</h3>
              <p className='text-xs text-purple-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  arrow_upward
                </span>
                5 new this week
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-purple-500'>
                work
              </span>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 border-l-4 border-orange-500 transform hover:-translate-y-1'>
          <div className='flex justify-between items-start'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Leave Requests</p>
              <h3 className='text-2xl font-bold'>38</h3>
              <p className='text-xs text-orange-500 mt-2 flex items-center'>
                <span className='material-symbols-outlined text-xs mr-1'>
                  priority_high
                </span>
                12 require approval
              </p>
            </div>
            <div className='w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center'>
              <span className='material-symbols-outlined text-orange-500'>
                pending_actions
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'></div>
    </>
  );
}
