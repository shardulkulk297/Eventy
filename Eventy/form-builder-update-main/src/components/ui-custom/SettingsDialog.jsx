
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Paintbrush, Globe, Bell } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

const SettingsDialog = ({ open, onOpenChange }) => {
  const { theme, setTheme } = useTheme();
  
  const themes = [
    { id: 'default', label: 'Blue', color: '#4285F4' },
    { id: 'purple', label: 'Purple', color: '#9C27B0' },
    { id: 'green', label: 'Green', color: '#0F9D58' },
    { id: 'orange', label: 'Orange', color: '#F4B400' },
  ];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings size={18} className="text-primary" /> Settings
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="appearance" className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Paintbrush size={16} />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-2">
              <Globe size={16} />
              <span className="hidden sm:inline">Language</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell size={16} />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance" className="space-y-4">
            <h3 className="text-sm font-medium">Theme</h3>
            <div className="grid grid-cols-2 gap-4">
              {themes.map((item) => (
                <motion.div 
                  key={item.id}
                  className="flex flex-col items-center gap-2"
                  onClick={() => setTheme(item.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <div 
                    className={`w-20 h-20 rounded-lg flex items-center justify-center cursor-pointer border-2 transition-all ${theme === item.id ? 'border-primary shadow-md' : 'border-transparent hover:border-gray-200'}`}
                    style={{ 
                      background: `linear-gradient(135deg, ${item.color}, ${item.color}CC)`,
                      boxShadow: theme === item.id ? `0 4px 12px ${item.color}40` : 'none'
                    }}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </motion.div>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-6">
              <Label htmlFor="dark-mode" className="cursor-pointer">Dark mode</Label>
              <Switch id="dark-mode" />
            </div>
          </TabsContent>
          
          <TabsContent value="language" className="space-y-4">
            <h3 className="text-sm font-medium">Select Language</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="border rounded-md p-2 flex items-center gap-2 cursor-pointer hover:bg-muted">
                <img src="https://flagcdn.com/w20/us.png" alt="English" width="20" />
                <span>English</span>
              </div>
              <div className="border rounded-md p-2 flex items-center gap-2 cursor-pointer hover:bg-muted">
                <img src="https://flagcdn.com/w20/es.png" alt="Spanish" width="20" />
                <span>Español</span>
              </div>
              <div className="border rounded-md p-2 flex items-center gap-2 cursor-pointer hover:bg-muted">
                <img src="https://flagcdn.com/w20/fr.png" alt="French" width="20" />
                <span>Français</span>
              </div>
              <div className="border rounded-md p-2 flex items-center gap-2 cursor-pointer hover:bg-muted">
                <img src="https://flagcdn.com/w20/de.png" alt="German" width="20" />
                <span>Deutsch</span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <h3 className="text-sm font-medium">Notification Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="cursor-pointer">Email notifications</Label>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications" className="cursor-pointer">Push notifications</Label>
                <Switch id="push-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-notifications" className="cursor-pointer">Sound alerts</Label>
                <Switch id="sound-notifications" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
