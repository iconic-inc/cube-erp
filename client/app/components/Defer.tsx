import { Await } from '@remix-run/react';
import { Suspense, ReactNode } from 'react';
import { ILoaderDataPromise, IResolveError } from '~/interfaces/app.interface';
import ErrorCard from './ErrorCard';
import LoadingCard from './LoadingCard';
import { isResolveError } from '~/lib';

interface IDeferProps<T> {
  children: (data: T) => ReactNode;
  resolve: ILoaderDataPromise<T>;
  fallback?: ReactNode;
  errorElement?: (err: IResolveError) => ReactNode;
}

export default function Defer<T>({
  children,
  resolve,
  fallback = <LoadingCard />,
  errorElement = (error: IResolveError) => (
    <ErrorCard message={error.message || 'Có lỗi xảy ra khi lấy dữ liệu.'} />
  ),
}: IDeferProps<T>) {
  return (
    <Suspense fallback={fallback}>
      <Await
        resolve={resolve}
        errorElement={errorElement({
          success: false,
          message:
            'Có lỗi xảy ra. Vui lòng thử lại sau hoặc liên hệ với bộ phận hỗ trợ nếu vấn đề vẫn tiếp diễn.',
        })}
      >
        {(data) => (isResolveError(data) ? errorElement(data) : children(data))}
      </Await>
    </Suspense>
  );
}
