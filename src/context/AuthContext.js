import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in

  const checkAuth = async (retries = 5, delay = 2000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`checkAuth - Attempt ${attempt}`, { backendUrl: process.env.REACT_APP_BACKEND_URL });
      try {
        await new Promise((resolve) => setTimeout(resolve, delay));
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/profile`, {
          withCredentials: true,
        });
        console.log('checkAuth - Success:', {
          user: res.data,
          headers: res.headers,
          cookies: res.config.headers.Cookie || 'No cookies sent',
        });
        setUser(res.data);
        return true;
      } catch (err) {
        console.error(`checkAuth - Attempt ${attempt} failed:`, {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers,
          cookies: err.config?.headers?.Cookie || 'No cookies sent',
          code: err.code,
        });
        if (attempt === retries) {
          setUser(null);
          return false;
        }
      }
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (userData) => {
    setUser(userData);
    const success = await checkAuth();
    if (!success) {
      setUser(null);
      throw new Error('Session validation failed');
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/users/logout`,
        {},
        {
          withCredentials: true,
        }
      );
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);