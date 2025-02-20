import React from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './ui/sidebar'
import { Home, EarthIcon, FunctionSquare, ArrowBigUpIcon, Settings, GalleryVerticalEnd } from 'lucide-react'
import { NavUser } from './NavUser'
const AppSidebar = () => {

  
  const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      
    },
  }

  const items = [

    
    {
      title: "Home",
      url: '/posts',
      icon: Home
    },

    {
      title: "Hackathons",
      url: '/hack',
      icon: EarthIcon
    },

    {
      title: "Upcoming",
      url: '/upcoming',
      icon: ArrowBigUpIcon
    },

    {
      title: "Settings",
      url: '/settings',
      icon: Settings
    }



  ]

  return (
    <div className="h-full dark:bg-background">
    <Sidebar className="dark:border-slate-700">
      <SidebarHeader><GalleryVerticalEnd className="h-6 w-6" /> Eventy</SidebarHeader>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigate</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              {
                items.map((item) => {
                   return <SidebarMenuItem key={item.title}>

                    <SidebarMenuButton asChild>

                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>

                      </a>
                    </SidebarMenuButton>

                  </SidebarMenuItem>
                })
              }

            </SidebarMenu>

          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter><NavUser user={data.user}/></SidebarFooter>
    </Sidebar>
    </div>
  )
}

export default AppSidebar
