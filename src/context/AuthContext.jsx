import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check if user is logged in on initial load
    const storedToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (storedToken) {
      try {
        // Only try to parse userData if it exists and is not undefined
        if (userData && userData !== 'undefined') {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
        setToken(storedToken);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // If there's an error parsing, clear the invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (newToken, userData) => {
    try {
      console.log('Login called with token and data:', newToken, userData);
      localStorage.setItem('token', newToken);
      
      // Handle different response formats from the API
      let userDataToStore;
      if (userData && userData.data && userData.data.user) {
        // New API response format
        userDataToStore = userData.data.user;
      } else if (userData && userData.user) {
        // Legacy format
        userDataToStore = userData.user;
      } else {
        // Just use what we got
        userDataToStore = userData;
      }
      
      if (userDataToStore) {
        console.log('Storing user data:', userDataToStore);
        localStorage.setItem('user', JSON.stringify(userDataToStore));
        setUser(userDataToStore);
      }
      
      setToken(newToken);
      setIsAuthenticated(true);
      
      // Note: The cart merging will be handled by CartContext useEffect
      // which triggers when isAuthenticated changes
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  // src/context/AuthContext.jsx

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
     // Misafir sepetini de temizle ki logout sonrası eski kullanıcı sepeti görünmesin
      localStorage.removeItem('guestCartId');
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };


  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 