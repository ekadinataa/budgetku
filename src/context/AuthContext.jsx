import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { setTokenGetter } from '../services/api';

const AuthContext = createContext(null);

/**
 * AuthProvider — manages Firebase authentication state and exposes
 * login, register, logout, and resetPassword methods to the app.
 *
 * Listens to onAuthStateChanged to detect session on app load.
 * Provides a fresh ID token via getIdToken() for API calls.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        setUser(firebaseUser);
        setToken(idToken);
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Wire up the token getter for the API client
  const getToken = useCallback(async () => {
    if (auth.currentUser) {
      return auth.currentUser.getIdToken();
    }
    return token;
  }, [token]);

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    setUser(cred.user);
    setToken(idToken);
  };

  const register = async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const idToken = await cred.user.getIdToken();
    setUser(cred.user);
    setToken(idToken);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value = {
    user,
    loading,
    token,
    login,
    register,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — convenience hook for consuming AuthContext.
 * @returns {{ user, loading, token, login, register, logout, resetPassword }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;
