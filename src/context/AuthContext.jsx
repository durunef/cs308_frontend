import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // On mount, pick up any stored login
    const storedToken = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (storedToken) {
      try {
        if (userData && userData !== 'undefined') {
          setUser(JSON.parse(userData));
        }
        setToken(storedToken);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error parsing user data:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (newToken, rawUserData) => {
    try {
      console.log('Login - New token:', newToken);
      console.log('Login - Raw user data:', rawUserData);
      
      localStorage.setItem('token', newToken);

      let u;
      if (rawUserData?.data?.user) u = rawUserData.data.user;
      else if (rawUserData?.user) u = rawUserData.user;
      else u = rawUserData;

      if (u) {
        console.log('Login - Setting user data:', u);
        localStorage.setItem('user', JSON.stringify(u));
        setUser(u);
      }

      setToken(newToken);
      setIsAuthenticated(true);
      // CartContext will pick up isAuthenticated change and merge
    } catch (err) {
      console.error('Error during login:', err);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('guestCartId');
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
