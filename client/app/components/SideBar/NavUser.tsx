import { Link, useNavigate } from '@remix-run/react';
import { BadgeCheck, ChevronsUpDown, LogOut } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '~/components/ui/sidebar';

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = async (e: any) => {
    e.preventDefault();
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      await fetch('/erp/logout', { method: 'POST' });
      navigate(`/erp/login?redirect=${location.pathname}`, { replace: true });
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-all duration-200 hover:bg-accent/50 hover:scale-[1.02] group'
            >
              <Avatar className='h-8 w-8 rounded-lg transition-transform duration-300 group-hover:scale-110'>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className='rounded-lg'>CN</AvatarFallback>
              </Avatar>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium transition-colors duration-200 group-hover:text-primary'>
                  {user.name}
                </span>
                <span className='truncate text-xs transition-colors duration-200'>
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className='ml-auto size-4 transition-transform duration-200 group-hover:rotate-180' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg animate-in slide-in-from-bottom-2 duration-200'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='p-0 font-normal'>
              <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm animate-in fade-in-0 duration-200'>
                <Avatar className='h-8 w-8 rounded-lg'>
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className='rounded-lg'>CN</AvatarFallback>
                </Avatar>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>{user.name}</span>
                  <span className='truncate text-xs'>{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <Link to='/erp/profile' prefetch='intent'>
                <DropdownMenuItem className='transition-all duration-200 hover:bg-accent/50 hover:translate-x-1 animate-in slide-in-from-left-1 duration-200 delay-100'>
                  <BadgeCheck />
                  Account
                </DropdownMenuItem>
              </Link>

              {/* <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className='transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:translate-x-1 animate-in slide-in-from-left-1 duration-200 delay-150'
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
