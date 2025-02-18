import React from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from './ui/sidebar'
const AppSidebar = () => {
  return (
    <Sidebar>
        <SidebarHeader />
        <SidebarContent>
            <SidebarGroup>
                Pokemon
            </SidebarGroup>

        </SidebarContent>
        <SidebarFooter />
    </Sidebar>
  )
}

export default AppSidebar
