import { LoaderFunctionArgs } from '@remix-run/node';

import HandsomeError from '~/components/HandsomeError';
import { parseAuthCookie } from '~/services/cookie.server';
import Sidebar from '../../../components/SideBar';
import { getCurrentUser } from '~/services/user.server';
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '~/components/ui/sidebar';
import { Outlet, useLoaderData, useNavigation } from '@remix-run/react';
import { getRewardStatsForEmployee } from '~/services/reward.server';
import RewardDisplay from '~/components/RewardDisplay';
import { getCurrentEmployeeByUserId } from '~/services/employee.server';
import { useEffect } from 'react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await parseAuthCookie(request);

  // Basic authentication check
  if (!session?.user) {
    throw new Response('Bạn cần đăng nhập để truy cập trang này.', {
      status: 401,
    });
  }

  const employee = await getCurrentEmployeeByUserId(session!);
  const rewardPromise = getRewardStatsForEmployee(session!).catch((error) => {
    console.error('Error fetching reward stats:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi xảy ra khi lấy phần thưởng',
    }; // Fallback in case of error
  });

  return { employee, rewardPromise };
};

export const ErrorBoundary = () => <HandsomeError basePath='/erp' />;

// Component to handle sidebar auto-hide on navigation
function SidebarNavigationHandler() {
  const navigation = useNavigation();
  const { isMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    // Close sidebar on mobile when navigation starts
    if (isMobile && navigation.state === 'loading') {
      setOpenMobile(false);
    }
  }, [navigation.state, isMobile, setOpenMobile]);

  return null;
}

export default function RootAdminLayout() {
  const { rewardPromise } = useLoaderData<typeof loader>();

  return (
    <SidebarProvider>
      <SidebarNavigationHandler />
      <Sidebar />

      <SidebarTrigger className='md:hidden fixed top-4 right-4 z-50' />

      <main className='w-full overflow-hidden'>
        <div className='flex-1 p-4 md:p-6 mt-4 lg:mt-0 overflow-y-auto'>
          {/* Top Navigation */}

          <Outlet />
        </div>

        {/* Reward Display in Corner */}
        <RewardDisplay rewardPromise={rewardPromise} />
      </main>
    </SidebarProvider>
  );
}
