import HandsomeError from '~/components/HandsomeError';

export const loader = async () => {
  throw new Response('Trang này không tồn tại hoặc đã bị xóa.', {
    status: 404,
  });
};

export const ErrorBoundary = () => <HandsomeError basePath='/erp' />;
