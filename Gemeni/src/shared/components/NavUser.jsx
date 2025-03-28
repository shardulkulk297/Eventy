"use client";
import toast from 'react-hot-toast'
import { onAuthStateChanged, getAuth, signOut } from 'firebase/auth';
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  LucideOctagonPause,
  Sparkles,
  User
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/ui/sidebar";
import { useEffect, useState } from "react";
import {app} from "../../firebaseConfig";
import { Button } from '../ui/button';


export function NavUser() {
  const { isMobile } = useSidebar();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(()=>{
  

    const unsubscribe = onAuthStateChanged(auth, (currentUser)=>{
      // console.log(currentUser);
      
      setUser(currentUser);
      setLoading(false);
    })
    return ()=> unsubscribe();
  }, [auth])

  if(loading){
    return <div className="p-2">Loading...</div>
  }

  if (!user){
    console.log("No user found");
    return null;
  };

  const handleLogOut = async()=>{

    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      
    } catch (error) {
      console.log(error);
      toast.error("Error logging out");
    }
   

  }

  const handleBilling = ()=>{
    console.log("billing");
    
  }
  
  const handleViewProfile = ()=>{

  }

  const handleNotifications = ()=>{

  }


 

  


  return (
    <SidebarMenu >
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user?.photoURL} alt={user?.displayName || 'User'} />
              <AvatarFallback className="rounded-lg">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.displayName}</span>
                <span className="truncate text-xs">{user.displayName}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.photoURL} alt={user?.displayName || 'User'} />
                <AvatarFallback className="rounded-lg">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.displayName}</span>
                  <span className="truncate text-xs">{user.displayName}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {/* --- FIX: Made DropdownMenuItem clickable directly --- */}
              <DropdownMenuItem onClick={handleViewProfile}>
                <User className="mr-2 h-4 w-4" /> {/* Changed Icon */}
                <span>Your Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBilling}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNotifications}>
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
              {/* --- END FIX --- */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* --- FIX: Made DropdownMenuItem clickable directly --- */}
            <DropdownMenuItem onClick={handleLogOut} className="text-red-600 focus:bg-red-100 focus:text-red-700">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
