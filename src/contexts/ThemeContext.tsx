
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  isFlat20: boolean;
  toggleDarkMode: () => void;
  toggleFlat20: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [isFlat20, setIsFlat20] = useState(() => {
    const saved = localStorage.getItem('flat20Theme');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('flat20Theme', JSON.stringify(isFlat20));
    
    if (isFlat20) {
      document.documentElement.classList.add('flat-20');
    } else {
      document.documentElement.classList.remove('flat-20');
    }
  }, [isFlat20]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleFlat20 = () => setIsFlat20(!isFlat20);

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      isFlat20,
      toggleDarkMode,
      toggleFlat20
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
