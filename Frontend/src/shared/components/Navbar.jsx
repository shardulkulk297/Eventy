import React from 'react'
import { Input } from '@/shared/ui/input'
import { Bell } from 'lucide-react'
import {
    Avatar, AvatarFallback,
    AvatarImage,
} from '@/shared/ui/avatar'
import CreateNewPost from '../../features/CreateEvent/CreateEvent'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import {getAuth, onAuthStateChanged} from "firebase/auth";
import { useEffect, useState } from 'react'
import {app, storage} from "../../firebaseConfig";

const Navbar = () => {

    const navigate = useNavigate();
    const auth = getAuth(app);
    const [user, setUser] = useState({});

    useEffect(()=>{
        const unsubscribe = onAuthStateChanged(auth, (currentUser)=>{
            setUser(currentUser);
        })
        return()=> unsubscribe();
    }, [])

    const newEvent = () => {

        navigate('/posts/builder/new')

    }
    const newOrg = ()=>{
        navigate('/posts/createorganization')
    }

    return (
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 h-26 flex items-center justify-between px-4 md:px-6 w-full">
            <div className="flex-1">
                <div className=" flex justify-start items-center">
                    <Input type="text" placeholder="Search for events..." className="w-full max-w-md" />
                    <Button onClick={newEvent} className="md:mb-2 w-full sm:w-auto">
                        Create Event
                    </Button>
                    <Button onClick={newOrg} className="md:mb-2 w-full sm:w-auto">
                        Create Organization
                    </Button>

                </div>


            </div>

            <div className="flex items-center justify-end space-x-4 ml-auto">
                <button className="relative flex items-center">
                    <Bell className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                </button>

                <Avatar className="h-10 w-10">
                <AvatarImage src={user?.photoURL} alt={user?.displayName || 'User Avatar'} />
                <AvatarFallback>{user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
            </div>
        </div>
    )
}

export default Navbar



