import { useNavigate } from '@remix-run/react';
import HRMButton from './CustomButton';
import { Button } from './ui/button';

export default function ContentHeader({
  title,
  actionContent,
  actionHandler,
}: {
  title: string;
  actionContent?: React.ReactNode;
  actionHandler?: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
      <div className='flex items-center'>
        <Button
          className='mr-3 bg-white px-2 rounded-full border hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-0.5'
          onClick={() => navigate(-1)}
        >
          <span className='material-symbols-outlined text-gray-600'>
            arrow_back
          </span>
        </Button>

        <h1 className='text-xl font-semibold'>{title}</h1>
      </div>

      <div className='flex space-x-2'>
        {actionContent && actionHandler && (
          <HRMButton color='blue' type='button' onClick={() => actionHandler()}>
            {actionContent}
          </HRMButton>
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
