import React from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './ui/sidebar'
import { 
  CalendarDays,
  HomeIcon,
  Trophy,
  Calendar,
  Settings, Megaphone
} from 'lucide-react'
import { NavUser } from './NavUser'

const AppSidebar = () => {
  const items = [
    {
      title: "Home",
      url: '/posts',
      icon: HomeIcon
    },
    {
      title: "Hackathons",
      url: '/posts/hackathons',
      icon: Trophy
    },
    {
      title: "Upcoming",
      url: '/posts/upcoming',
      icon: Calendar
    },
    {
      title: "Settings",
      url: '/posts/settings',
      icon: Settings
    },
    {
      title: "Host Event",
      url: '/posts/host',
      icon: Megaphone
    }
  ]

  return (
    <div className="h-full dark:bg-background">
      <Sidebar className="dark:border-slate-700">
        <SidebarHeader className="flex items-center gap-3 px-2">
          <CalendarDays className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-tight text-primary">Eventy</span>
        </SidebarHeader>
        <SidebarHeader></SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-sm font-medium text-muted-foreground px-2">
              Navigate
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <a 
                        href={item.url} 
                        className="flex items-center gap-4 text-lg font-medium hover:text-primary transition-colors"
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
    </div>
  )
}

export default AppSidebar
