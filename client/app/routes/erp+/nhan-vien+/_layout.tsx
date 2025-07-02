import { LoaderFunctionArgs } from '@remix-run/node';

import HandsomeError from '~/components/HandsomeError';
import { parseAuthCookie } from '~/services/cookie.server';
import Sidebar from '~/components/emp/SideBar';
import { getCurrentUser } from '~/services/user.server';
import { SidebarProvider, SidebarTrigger } from '~/components/ui/sidebar';
import { Outlet, useLoaderData } from '@remix-run/react';
import { getRewardStatsForEmployee } from '~/services/reward.server';
import RewardDisplay from '~/components/RewardDisplay';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await parseAuthCookie(request);

  const user = await getCurrentUser(session!).catch((error) => {
    console.error('Error fetching user:', error);
    return {} as any;
  });
  const reward = getRewardStatsForEmployee(session!).catch((error) => {
    console.error('Error fetching reward stats:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi xảy ra khi lấy phần thưởng',
    }; // Fallback in case of error
  });

  return { user, reward };
};

export const ErrorBoundary = () => <HandsomeError basePath='/erp/nhan-vien' />;

export default function RootAdminLayout() {
  const { reward } = useLoaderData<typeof loader>();

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

      {/* Reward Display in Corner */}

      <RewardDisplay rewardPromise={reward} />
    </SidebarProvider>
  );
}
