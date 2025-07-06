import { isRouteErrorResponse, Link, useRouteError } from '@remix-run/react';
import { toast } from 'react-toastify';
import { Button } from '../ui/button';
import { CircleAlert, Home } from 'lucide-react';

export const meta = () => {
  return [
    { title: 'Lỗi' },
    {
      name: 'description',
      content: 'Đã xảy ra lỗi trong quá trình xử lý yêu cầu của bạn.',
    },
  ];
};

export default function HandsomeError({
  basePath = '/erp',
}: {
  basePath?: string;
}) {
  console.log('Oops! An error occurred!');
  const error = useRouteError();
  console.log(error);
  toast.dismiss();

  if (isRouteErrorResponse(error)) {
    return <ErrorCard error={error} basePath={basePath} />;
  } else if (error instanceof Error && error.message) {
    return (
      <ErrorCard
        error={{
          status: 500,
          statusText: error.message,
        }}
        basePath={basePath}
      />
    );
  } else {
    return (
      <ErrorCard
        error={{ status: 500, statusText: 'Internal Server Error' }}
        basePath={basePath}
      />
    );
  }
}

const ErrorCard = ({
  error,
  basePath,
}: {
  basePath: string;
  error: { status: number; statusText: string; data?: any };
}) => {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center p-4'>
      <CircleAlert className='h-16 w-16 text-red-500 mb-6' />
      <h1 className='text-3xl font-bold mb-2'>{error.status || 500}</h1>
      <p className='text-muted-foreground mb-8 text-center'>
        {error.statusText ||
          error.data?.message ||
          error.data ||
          'Đã xảy ra lỗi không xác định.'}
      </p>
      <Button asChild>
        <Link to={basePath}>
          <Home className='mr-2 h-4 w-4' />
          Trang chủ
        </Link>
      </Button>
    </div>
  );
};
