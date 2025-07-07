import { LoaderFunctionArgs } from '@remix-run/node';
import HandsomeError from '~/components/HandsomeError';
import { parseAuthCookie } from '~/services/cookie.server';
import { canAccessTaskManagement, isAdmin } from '~/utils/permission';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (canAccessTaskManagement(user?.user.usr_role)) {
    return {};
  }
  throw new Response('Bạn không có quyền truy cập vào trang này.', {
    status: 403,
  });
};

export const ErrorBoundary = () => <HandsomeError basePath='/erp' />;
