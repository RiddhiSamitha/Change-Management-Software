// src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../config/api'; 

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
  }, []); 

  // (REG-01, REG-07)
  const register = async (email, password, role = 'Developer') => {
    try {
      // authAPI.register returns the full response: { message, token, user }
      const response = await authAPI.register(email, password, role);
      
      const newToken = response.token;
      const newUser = response.user; // { id, email, role }

      if (!newUser || !newUser.id) {
        throw new Error("Invalid user data received from server.");
      }

      // Automatically log the user in
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      
      return response; // Return the full response to the page
    } catch (error) {
      // (REG-02, 03, 04, 05) Pass the specific error message from the backend
      const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
      throw new Error(errorMessage);
    }
  };

  // (LOGIN-01, 02, 03)
  const login = async (email, password) => {
    try {
      // authAPI.login returns { token, user: { id, email, role } }
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
      
      // 🚀 CRITICAL FIX: Return the response object containing the user
      return response; 
    } catch (error) {
      // (LOGIN-02, 03) Pass the specific error message from the backend
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      throw new Error(errorMessage);
    }
  };

  // (LOGIN-07)
  const logout = async () => {
    try {
        // We don't have a backend /logout route, so we just clear locally
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