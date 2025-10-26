import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface NavigationContextType {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  navigationParams: Record<string, any>;
  navigate: (page: string, params?: Record<string, any>) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [navigationParams, setNavigationParams] = useState<Record<string, any>>({});

  const navigate = (page: string, params?: Record<string, any>) => {
    setCurrentPage(page);
    if (params) {
      setNavigationParams(params);
    } else {
      setNavigationParams({});
    }
  };

  return (
    <NavigationContext.Provider value={{ 
      currentPage, 
      setCurrentPage, 
      navigationParams, 
      navigate 
    }}>
      {children}
    </NavigationContext.Provider>
  );
};
