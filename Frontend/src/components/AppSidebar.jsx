import React from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './ui/sidebar'
import { Home, EarthIcon, FunctionSquare, ArrowBigUpIcon } from 'lucide-react'
const AppSidebar = () => {

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
    }
  ]

return (
  <Sidebar>
    <SidebarHeader>Eventy</SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Navigate</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>

            {
              items.map((item)=>{
                <SidebarMenuItem key={item.title}>

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
    <SidebarFooter />
  </Sidebar>
)
}

export default AppSidebar
