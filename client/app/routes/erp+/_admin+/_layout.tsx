import { LoaderFunctionArgs } from '@remix-run/node';

import HandsomeError from '~/components/HandsomeError';
import { parseAuthCookie } from '~/services/cookie.server';
import Sidebar from '../../../components/SideBar';
import { getCurrentUser } from '~/services/user.server';
import { SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar';
import { Outlet } from '@remix-run/react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await parseAuthCookie(request);

  const user = await getCurrentUser(session!);

  return { user };
};

export const ErrorBoundary = () => <HandsomeError basePath='/erp' />;

export default function RootAdminLayout() {
  return (
    <SidebarProvider>
      <Sidebar />

      <SidebarTrigger className='md:hidden fixed top-4 right-4 z-50' />

      <main className='w-full'>
        <div className='flex-1 p-4 md:p-6 mt-4 lg:mt-0 overflow-y-auto'>
          {/* Top Navigation */}

          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}
