import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('vana_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('vana_token') || null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('vana_token', token);
    } else {
      localStorage.removeItem('vana_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('vana_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vana_user');
    }
  }, [user]);

  const [isLoginHidden, setIsLoginHidden] = useState(() => {
    return localStorage.getItem('vana_hide_login') === 'true';
  });

  const toggleHideLogin = (shouldHide) => {
    setIsLoginHidden(shouldHide);
    if (shouldHide) {
      localStorage.setItem('vana_hide_login', 'true');
    } else {
      localStorage.removeItem('vana_hide_login');
    }
  };

  const [isStaffHidden, setIsStaffHidden] = useState(() => {
    const saved = localStorage.getItem('vana_hide_staff');
    return saved === null ? true : saved === 'true';
  });

  const toggleHideStaff = (shouldHide) => {
    setIsStaffHidden(shouldHide);
    if (shouldHide) {
      localStorage.setItem('vana_hide_staff', 'true');
    } else {
      localStorage.setItem('vana_hide_staff', 'false');
    }
  };

  const login = async (email, password) => {
    const res = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) {
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const loginAdmin = async (username, password) => {
    const res = await fetchAPI('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res.token) {
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const sendSignupOTP = async (email) => {
    return await fetchAPI('/auth/send-signup-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  };

  const sendForgotOTP = async (email) => {
    return await fetchAPI('/auth/send-forgot-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  };

  const resetPassword = async (email, otp, newPassword) => {
    return await fetchAPI('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword })
    });
  };

  const register = async (name, email, phone, password, otp) => {
    const res = await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password, otp })
    });
    if (res.token) {
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('vana_token');
    localStorage.removeItem('vana_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        loginAdmin,
        register,
        sendSignupOTP,
        sendForgotOTP,
        resetPassword,
        logout,
        isLoginHidden,
        toggleHideLogin,
        isStaffHidden,
        toggleHideStaff
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => useContext(AuthContext);
