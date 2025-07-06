export default function QuickActions() {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-8'>
      <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 transform hover:-translate-y-1 border-l-4 border-purple-500'>
        <div className='flex justify-between items-start'>
          <div>
            <div className='flex items-center mb-3'>
              <span className='material-symbols-outlined text-purple-500 mr-2'>
                timer
              </span>
              <h3 className='text-lg font-semibold'>Request Time Off</h3>
            </div>
            <p className='text-sm text-gray-500 mb-4'>
              Submit a request for vacation, sick leave or personal time off
            </p>
            <button className='text-purple-500 hover:text-purple-600 text-sm flex items-center hover:underline transition-all'>
              Request Leave
              <span className='material-symbols-outlined text-sm ml-1'>
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 transform hover:-translate-y-1 border-l-4 border-blue-500'>
        <div className='flex justify-between items-start'>
          <div>
            <div className='flex items-center mb-3'>
              <span className='material-symbols-outlined text-blue-500 mr-2'>
                insights
              </span>
              <h3 className='text-lg font-semibold'>Work Analytics</h3>
            </div>
            <p className='text-sm text-gray-500 mb-4'>
              View and analyze your attendance patterns and work hours
            </p>
            <button className='text-blue-500 hover:text-blue-600 text-sm flex items-center hover:underline transition-all'>
              View Analytics
              <span className='material-symbols-outlined text-sm ml-1'>
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition duration-300 transform hover:-translate-y-1 border-l-4 border-green-500'>
        <div className='flex justify-between items-start'>
          <div>
            <div className='flex items-center mb-3'>
              <span className='material-symbols-outlined text-green-500 mr-2'>
                report
              </span>
              <h3 className='text-lg font-semibold'>Attendance Report</h3>
            </div>
            <p className='text-sm text-gray-500 mb-4'>
              Generate and download your attendance reports for any period
            </p>
            <button className='text-green-500 hover:text-green-600 text-sm flex items-center hover:underline transition-all'>
              Generate Report
              <span className='material-symbols-outlined text-sm ml-1'>
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
