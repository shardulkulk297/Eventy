import React from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarGroupLabel, SidebarGroupContent } from './ui/sidebar'
const AppSidebar = () => {
  return (
    <Sidebar>
        <SidebarHeader>Eventy</SidebarHeader>
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupLabel>Navigate</SidebarGroupLabel>
                <SidebarGroupContent>
                  
                </SidebarGroupContent>
            </SidebarGroup>

        </SidebarContent>
        <SidebarFooter />
    </Sidebar>
  )
}

export default AppSidebar
