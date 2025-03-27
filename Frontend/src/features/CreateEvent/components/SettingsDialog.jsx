/* Eventy/Frontend/src/features/CreateEvent/components/SettingsDialog.jsx */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
// --- FIX: Corrected import paths ---
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'; // Assuming Tabs are in shared/ui
import { Switch } from '@/shared/ui/switch'; // Assuming Switch is in shared/ui
import { Label } from '@/shared/ui/label';   // Assuming Label is in shared/ui
// --- END FIX ---
import { Settings, Paintbrush, Globe, Bell } from 'lucide-react';
import { useTheme } from '@/features/CreateEvent/context/ThemeContext';
import { motion } from 'framer-motion';

const SettingsDialog = ({ open, onOpenChange }) => {
  const { theme, setTheme } = useTheme();

  // Theme data remains the same
   const themes = [
    { id: 'default', label: 'Blue (Default)', color: '#4285F4' }, // Clarified default
    { id: 'purple', label: 'Purple', color: '#9C27B0' },
    { id: 'green', label: 'Green', color: '#0F9D58' },
    { id: 'orange', label: 'Orange', color: '#F4B400' },
    // Added the blue theme explicitly if needed, otherwise 'default' covers it
    // { id: 'blue', label: 'Blue', color: '#1E88E5' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-xl"> {/* Increased max-width slightly */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl"> {/* Adjusted size */}
            <Settings size={20} className="text-primary" /> Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 mb-4"> {/* Ensure full width */}
            <TabsTrigger value="appearance" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"> {/* Adjusted gap and text size */}
              <Paintbrush size={16} />
              <span className="hidden sm:inline">Appearance</span>
               <span className="sm:hidden">Theme</span> {/* Short label for mobile */}
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"> {/* Adjusted gap and text size */}
              <Globe size={16} />
              <span className="hidden sm:inline">Language</span>
              <span className="sm:hidden">Lang</span> {/* Short label for mobile */}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"> {/* Adjusted gap and text size */}
              <Bell size={16} />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Alerts</span> {/* Short label for mobile */}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-6"> {/* Increased spacing */}
            <div>
                <h3 className="text-sm font-medium mb-3">Theme</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4"> {/* More columns on larger screens */}
                {themes.map((item) => (
                    <motion.div
                    key={item.id}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                    onClick={() => setTheme(item.id)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                    <div
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center border-2 transition-all duration-200 group-hover:shadow-md ${
                        theme === item.id ? 'border-primary ring-2 ring-primary ring-offset-2 shadow-lg' : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                        }`} // Enhanced styling
                        style={{
                        background: `linear-gradient(135deg, ${item.color}, ${item.color}B3)`, // Slightly transparent gradient
                        boxShadow: theme === item.id ? `0 2px 8px ${item.color}50` : 'none',
                        }}
                    >
                        {theme === item.id && <Check className="text-white" size={20} strokeWidth={3} />}
                    </div>
                    <span className={`text-xs sm:text-sm font-medium transition-colors ${theme === item.id ? 'text-primary' : 'text-gray-600 dark:text-gray-400 group-hover:text-primary/80'}`}>{item.label}</span>
                    </motion.div>
                ))}
                </div>
            </div>

            {/* Dark Mode Toggle - Assuming you have a mechanism to toggle dark mode */}
            {/* <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
              <Label htmlFor="dark-mode" className="cursor-pointer dark:text-gray-300">Dark mode</Label>
              <Switch id="dark-mode" />
            </div> */}
          </TabsContent>

          <TabsContent value="language" className="space-y-4">
            <h3 className="text-sm font-medium">Select Language</h3>
             <p className="text-xs text-gray-500 dark:text-gray-400">Language selection is currently unavailable.</p>
            {/* Language selection UI (Example - Needs actual implementation) */}
            {/* <div className="grid grid-cols-2 gap-2"> ... Language options ... </div> */}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <h3 className="text-sm font-medium">Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="cursor-pointer dark:text-gray-300">Receive email notifications</Label>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications" className="cursor-pointer dark:text-gray-300">Enable push notifications</Label>
                <Switch id="push-notifications" />
              </div>
              {/* <div className="flex items-center justify-between">
                <Label htmlFor="sound-notifications" className="cursor-pointer dark:text-gray-300">Sound alerts</Label>
                <Switch id="sound-notifications" />
              </div> */}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;