/* src/shared/components/Navbar.jsx */
import React, { useEffect, useState } from 'react';
import { Input } from '@/shared/ui/input';
import { Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
// import CreateNewPost from '../../features/CreateEvent/CreateEvent'; // Likely unused now
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../../firebaseConfig"; // Removed unused 'storage' import

const Navbar = () => {
    const navigate = useNavigate();
    const auth = getAuth(app);
    const [user, setUser] = useState({});

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [auth]); // Added dependency array

    // --- UPDATED: Navigate to the Event Dashboard ---
    const goToEventDashboard = () => {
        navigate('/posts/events'); // Navigate to the new Event Dashboard route
    };
    // --- END UPDATE ---

    const newOrg = () => {
        navigate('/posts/createorganization');
    };

    return (
        <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 h-16 flex items-center justify-between px-4 md:px-6 w-full">
            {/* --- Search Bar (Keep or remove based on needs) --- */}
             <div className="flex-1 max-w-md mr-4">
                <Input type="text" placeholder="Search..." className="w-full" />
             </div>


            {/* --- Action Buttons --- */}
             <div className="flex items-center gap-2 sm:gap-4">
                <Button onClick={goToEventDashboard} className="w-full sm:w-auto">
                    Events {/* Changed Button Text */}
                </Button>
                <Button onClick={newOrg} variant="outline" className="w-full sm:w-auto">
                    Create Organization
                </Button>
            </div>


             {/* --- User Section --- */}
            <div className="flex items-center justify-end space-x-4 ml-auto pl-4">
                <button className="relative flex items-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    {/* Optional: Add notification indicator */}
                    {/* <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span> */}
                </button>
                <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.photoURL} alt={user?.displayName || 'User'} />
                    <AvatarFallback className="text-sm">
                         {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                     </AvatarFallback>
                </Avatar>
            </div>
        </div>
    );
};

export default Navbar;