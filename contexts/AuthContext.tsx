// app/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
}

// Export the context
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isGuest: false,
  token: null,
  login: async () => {},
  logout: async () => {},
  continueAsGuest: () => {},
});

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('authToken');
        const guestMode = await AsyncStorage.getItem('guestMode');

        if (storedToken) {
          setToken(storedToken);
          setIsAuthenticated(true);
          setIsGuest(false);
        } else if (guestMode === 'true') {
          setIsGuest(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
    };
    checkAuth();
  }, []);

  const login = async (newToken: string) => {
    try {
      await AsyncStorage.setItem('authToken', newToken);
      await AsyncStorage.removeItem('guestMode');
      setToken(newToken);
      setIsAuthenticated(true);
      setIsGuest(false);
    } catch (error) {
      console.error('Error storing authentication:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('guestMode');
      setToken(null);
      setIsAuthenticated(false);
      setIsGuest(false);
    } catch (error) {
      console.error('Error removing authentication:', error);
      throw error;
    }
  };

  const continueAsGuest = async () => {
    try {
      await AsyncStorage.setItem('guestMode', 'true');
      setIsGuest(true);
    } catch (error) {
      console.error('Error setting guest mode:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isGuest,
        token,
        login,
        logout,
        continueAsGuest,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
