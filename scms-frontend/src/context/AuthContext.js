import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../config/api'; // This API is correct

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // This function is correct.
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    let loadedUser = null;
    let loadedToken = null;

    if (storedToken && storedUser) {
      try {
        loadedUser = JSON.parse(storedUser);
        
        if (loadedUser && loadedUser.id) {
          loadedToken = storedToken;
        } else {
          console.warn("Stored user data was old or corrupt, clearing session.");
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    
    setToken(loadedToken);
    setUser(loadedUser);
    setLoading(false); 
  }, []); // Run only once on mount

  // ** THE FIX IS HERE **
  // This function now automatically logs the user in after registering
  const register = async (email, password, role = 'Developer') => {
    try {
      const response = await authAPI.register(email, password, role);
      
      const newToken = response.token;
      const newUser = response.user;

      if (!newUser || !newUser.id) {
        throw new Error("Invalid user data received from server.");
      }

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  // This login function is correct.
  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      
      const newToken = response.token;
      const newUser = response.user; 

      if (!newUser || !newUser.id) {
        throw new Error("Invalid user data received from server.");
      }

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      
      return response;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  // This logout function is correct.
  const logout = async () => {
    try {
        await authAPI.logout(); 
    } catch (error) {
        console.warn('Logout API call failed, proceeding with local logout:', error);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        setToken(null);
        setUser(null);
        
        navigate('/login');
    }
  };

  const isAuthenticated = () => {
    return !!token && !!user;
  };

  const getUserRole = () => {
    return user?.role || null;
  };

  const value = {
    user,
    token,
    loading,
    register,
    login,
    logout,
    isAuthenticated,
    getUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};