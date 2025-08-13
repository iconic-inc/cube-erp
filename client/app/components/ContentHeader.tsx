import { useNavigate } from '@remix-run/react';
import { ArrowLeft } from 'lucide-react';
import { Button, buttonVariants } from './ui/button';
import { VariantProps } from 'class-variance-authority';

export default function ContentHeader({
  title,
  actionContent,
  actionHandler,
  actionVariant = 'primary',
  backHandler,
}: {
  title: string;
  actionContent?: React.ReactNode;
  actionHandler?: () => void;
  actionVariant?: VariantProps<typeof buttonVariants>['variant'];
  backHandler?: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className='flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200'>
      <div className='flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1'>
        {/* Back button */}
        <Button
          variant='ghost'
          size='icon'
          className='text-gray-600 hover:bg-gray-100 rounded-full shrink-0 h-8 w-8 sm:h-10 sm:w-10'
          onClick={backHandler || (() => navigate(-1))}
        >
          <ArrowLeft className='h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6' />
        </Button>
        {/* Page title */}
        <h1 className='text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate'>
          {title}
        </h1>
      </div>
      {/* Action button */}

      {actionContent && actionHandler && (
        <Button
          variant={actionVariant}
          onClick={actionHandler}
          className='ml-2 sm:ml-3 shrink-0 text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2'
        >
          {actionContent}
        </Button>
      )}
    </div>
  );
}
