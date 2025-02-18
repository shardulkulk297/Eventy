import React from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from './ui/sidebar'
import AppSidebar from './AppSidebar'

const Layout = () => {
  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <main>

          <SidebarTrigger />
          <Outlet />
          
        </main>
      </SidebarProvider>
        
       
        
      
    </div>
  )
}

export default Layout
