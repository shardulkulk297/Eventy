import React from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarFooter, SidebarGroup, SidebarHeader } from './ui/sidebar'
const AppSidebar = () => {
  return (
    <Sidebar>
        <SidebarHeader />
        <SidebarContent>
            <SidebarGroup />
            <SidebarGroup />

        </SidebarContent>
        <SidebarFooter />
    </Sidebar>
  )
}

export default AppSidebar
