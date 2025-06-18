import { Await } from '@remix-run/react';
import { Suspense, ReactNode } from 'react';
import { ILoaderDataPromise, IResolveError } from '~/interfaces/app.interface';

interface IDeferProps<T> {
  children: (data: T) => ReactNode;
  resolve: ILoaderDataPromise<T>;
  fallback?: ReactNode;
  errorElement?: (err: IResolveError) => ReactNode;
}

export default function Defer<T>({
  children,
  resolve,
  fallback = <div>Loading...</div>,
  errorElement = (error: IResolveError) => (
    <span className='text-red-500'>
      {error.message || 'Có lỗi xảy ra khi lấy dữ liệu.'}
    </span>
  ),
}: IDeferProps<T>) {
  const isError = (data: any): data is IResolveError => {
    return (
      data &&
      typeof data.success === 'boolean' &&
      typeof data.message === 'string'
    );
  };

  return (
    <Suspense fallback={fallback}>
      <Await
        resolve={resolve}
        errorElement={
          <span className='text-red-500'>Có lỗi xảy ra khi lấy dữ liệu.</span>
        }
      >
        {(data) => (isError(data) ? errorElement(data) : children(data))}
      </Await>
    </Suspense>
  );
}
