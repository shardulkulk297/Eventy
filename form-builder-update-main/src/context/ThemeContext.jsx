
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'default',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('default');
  
  // Load saved theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('form-builder-theme');
    if (savedTheme && ['default', 'purple', 'green', 'orange', 'blue'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);
  
  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('form-builder-theme', theme);
    
    // Apply theme classes to the document
    document.documentElement.classList.remove('theme-default', 'theme-purple', 'theme-green', 'theme-orange', 'theme-blue');
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Also apply CSS variables based on theme
    const root = document.documentElement;
    
    switch(theme) {
      case 'default':
        root.style.setProperty('--form-accent-color', '#4285F4');
        root.style.setProperty('--primary', '221.2 83.2% 53.3%');
        break;
      case 'purple':
        root.style.setProperty('--form-accent-color', '#9C27B0');
        root.style.setProperty('--primary', '262.1 83.3% 57.8%');
        break;
      case 'green':
        root.style.setProperty('--form-accent-color', '#0F9D58');
        root.style.setProperty('--primary', '142.1 76.2% 36.3%');
        break;
      case 'orange':
        root.style.setProperty('--form-accent-color', '#F4B400');
        root.style.setProperty('--primary', '43.3 96.4% 56.3%');
        break;
      case 'blue':
        root.style.setProperty('--form-accent-color', '#1E88E5');
        root.style.setProperty('--primary', '217.2 91.2% 59.8%');
        break;
      default:
        root.style.setProperty('--form-accent-color', '#4285F4');
        root.style.setProperty('--primary', '221.2 83.2% 53.3%');
    }
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
