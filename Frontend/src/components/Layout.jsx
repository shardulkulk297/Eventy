import React from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarTrigger } from './ui/sidebar'
import AppSidebar from './AppSidebar'
import Navbar from './Navbar'

const Layout = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <SidebarTrigger />
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default Layout
