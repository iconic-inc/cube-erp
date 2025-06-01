import HandsomeError from '~/components/HandsomeError';

export const loader = () => {
  throw new Response(null, {
    status: 404,
    statusText: 'Not Found',
  });
};

export default function PageNotFound() {
  return <HandsomeError basePath='/' />;
}

export const ErrorBoundary = () => <HandsomeError basePath='/' />;
