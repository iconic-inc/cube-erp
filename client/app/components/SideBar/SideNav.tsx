import { ChevronRight, LucideIcon } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '../ui/sidebar';
import { Link } from '@remix-run/react';

export default function SideNav({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className='animate-in fade-in-0 slide-in-from-left-2 duration-300 delay-100'>
        MENU
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, index) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className='group/collapsible'
          >
            <SidebarMenuItem
              className={`animate-in slide-in-from-left-2 fade-in-0 duration-300`}
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.title}
                  className='transition-all duration-200 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-sm group'
                >
                  {item.icon && (
                    <item.icon className='transition-transform duration-200 group-hover:scale-110' />
                  )}
                  <span className='transition-colors duration-200'>
                    {item.title}
                  </span>
                  <ChevronRight className='ml-auto transition-all duration-200 group-data-[state=open]/collapsible:rotate-90 group-hover:text-primary' />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent className='animate-in slide-in-from-top-1 duration-200'>
                <SidebarMenuSub>
                  {item.items?.map((subItem, subIndex) => (
                    <SidebarMenuSubItem
                      key={subItem.title}
                      className='animate-in slide-in-from-left-1 fade-in-0 duration-200'
                      style={{ animationDelay: `${100 + subIndex * 50}ms` }}
                    >
                      <SidebarMenuSubButton asChild>
                        <Link
                          to={subItem.url}
                          prefetch='intent'
                          className='transition-all duration-200 hover:bg-accent/30 hover:translate-x-1 hover:text-primary'
                        >
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
