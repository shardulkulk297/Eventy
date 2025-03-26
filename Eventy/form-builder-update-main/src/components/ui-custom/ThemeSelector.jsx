
import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Paintbrush, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const ThemeSelector = ({ open, onOpenChange }) => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'default', label: 'Blue', color: '#4285F4' },
    { id: 'purple', label: 'Purple', color: '#9C27B0' },
    { id: 'green', label: 'Green', color: '#0F9D58' },
    { id: 'orange', label: 'Orange', color: '#F4B400' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl border-none bg-white/95 backdrop-blur-sm shadow-elevation-3">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Paintbrush size={18} className="text-primary" /> Choose Theme
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-6">
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
                className={`w-24 h-24 rounded-xl flex items-center justify-center cursor-pointer border-2 transition-all ${theme === item.id ? 'border-primary shadow-lg' : 'border-transparent hover:border-gray-200'}`}
                style={{ 
                  background: `linear-gradient(135deg, ${item.color}, ${item.color}CC)`,
                  boxShadow: theme === item.id ? `0 4px 12px ${item.color}40` : 'none'
                }}
              >
                {theme === item.id && <Check className="text-white" size={24} />}
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThemeSelector;
