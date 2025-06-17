import { useNavigate } from '@remix-run/react';
import { ArrowLeft } from 'lucide-react';
import { Button, buttonVariants } from './ui/button';
import { VariantProps } from 'class-variance-authority';

export default function ContentHeader({
  title,
  actionContent,
  actionHandler,
  actionVariant = 'default',
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
    <div className='flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-200'>
      <div className='flex items-center space-x-3'>
        {/* Back button */}
        <Button
          variant='ghost'
          size='icon'
          className='text-gray-600 hover:bg-gray-100 rounded-full'
          onClick={backHandler || (() => navigate(-1))}
        >
          <ArrowLeft className='h-6 w-6' />
        </Button>
        {/* Page title */}
        <h1 className='text-2xl font-bold text-gray-800'>{title}</h1>
      </div>
      {/* Add Document button */}

      {actionContent && actionHandler && (
        <Button
          variant={actionVariant}
          className='px-6 py-2 text-white font-semibold rounded-lg shadow-md transition-all duration-200 ease-in-out transform hover:scale-105'
          onClick={actionHandler}
        >
          {actionContent}
        </Button>
      )}
    </div>
  );
}
