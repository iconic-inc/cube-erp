import CustomButton from '~/widgets/CustomButton';

export default function DashContentHeader({
  title,
  actionContent,
  actionHandler,
}: {
  title: string;
  actionContent?: React.ReactNode;
  actionHandler?: () => void;
}) {
  return (
    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
      <h1 className='text-xl font-semibold'>{title}</h1>
      <div className='flex space-x-2'>
        {actionContent && actionHandler && (
          <CustomButton
            color='blue'
            type='button'
            onClick={() => actionHandler()}
          >
            {actionContent}
          </CustomButton>
        )}

        {/* <button className='bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm flex items-center border border-gray-200 transition-all duration-300 transform hover:-translate-y-0.5'>
          <span className='material-symbols-outlined text-sm mr-1'>
            filter_list
          </span>
          Filter
        </button> */}
      </div>
    </div>
  );
}
