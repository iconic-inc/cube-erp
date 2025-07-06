import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import HandsomeError from '~/components/HandsomeError';
import { parseAuthCookie } from '~/services/cookie.server';
import { isAdmin } from '~/utils/permission';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await parseAuthCookie(request);

  if (isAdmin(user?.user.usr_role)) {
    return {};
  }

  return redirect('/erp/nhan-vien/cham-cong');
};

export const ErrorBoundary = () => <HandsomeError basePath='/erp' />;
