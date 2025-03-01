import React from 'react'
import { Input } from '@/components/ui/input'
import { Bell } from 'lucide-react'
import {
    Avatar, AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar'
import CreateNewPost from './CreateNewPost'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'

const Navbar = () => {

    const navigate = useNavigate();

    const newPost = () => {

        navigate('/posts/createnewpost')

    }

    return (
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 h-16 flex items-center justify-between px-4 md:px-6 w-full">
            <div className="flex-1">
                <div className=" flex justify-start items-center">
                    <Input type="text" placeholder="Search for events..." className="w-full max-w-md" />
                    <Button onClick={newPost} className="md:mb-2 w-full sm:w-auto">
                        Create New Post
                    </Button>

                </div>


            </div>

            <div className="flex items-center justify-end space-x-4 ml-auto">
                <button className="relative flex items-center">
                    <Bell className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                </button>

                <Avatar className="h-10 w-10">
                    <AvatarImage src="https://api.dicebear.com/7.x/pixel-art/svg?seed=John" alt="User Avatar" />
                    <AvatarFallback>UN</AvatarFallback>
                </Avatar>
            </div>
        </div>
    )
}

export default Navbar



