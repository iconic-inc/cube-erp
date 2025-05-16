import { Await } from '@remix-run/react';
import { Suspense, ReactNode } from 'react';

export default function Defer<T>({
  children,
  resolve,
  fallback = <div>Loading...</div>,
}: {
  children: (data: T) => React.ReactNode;
  resolve: Promise<T> | T;
  fallback?: ReactNode;
}) {
  return (
    <Suspense fallback={fallback}>
      <Await resolve={resolve}>{(data) => children(data)}</Await>
    </Suspense>
  );
}
