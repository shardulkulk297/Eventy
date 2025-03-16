"use client";
import toast from 'react-hot-toast'
import { onAuthStateChanged, getAuth, signOut } from 'firebase/auth';
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
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
  

    const getCurrentUser = onAuthStateChanged(auth, (currentUser)=>{
      // console.log(currentUser);
      
      setUser(currentUser);
      setLoading(false);
    })
    return getCurrentUser
  }, [])

  if(loading){
    return <div>Loading...</div>
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
              <AvatarImage src={user?.photoURL || 'https://api.dicebear.com/7.x/avatars/svg'} alt={user?.displayName || 'User'} />
                <AvatarFallback className="rounded-lg">{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
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
                  <AvatarImage src={user.photoURL} alt={user.displayName} />
                  
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.displayName}</span>
                  <span className="truncate text-xs">{user.displayName}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                <Button>Update Profile</Button>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                <Button>Your Profile</Button> 
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                <Button>Billing</Button>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                <Button>Notifications</Button>
                
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              <Button onClick={handleLogOut} >Log out</Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
