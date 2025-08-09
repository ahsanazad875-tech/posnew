// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  setPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authInstance = getAuth();

    // Set persistence only once
    setPersistence(authInstance, browserLocalPersistence).catch((error) => {
      console.error("Error setting persistence:", error);
    });

    // Listen for auth state changes immediately
    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      if (user) {
        try {
          // Check if this is a legacy user (anonymous auth with stored data)
          const legacyUserData = sessionStorage.getItem('legacyUserData');
          
          if (user.isAnonymous && legacyUserData) {
            // Handle legacy user from sessionStorage
            const userData = JSON.parse(legacyUserData);
            setCurrentUser({
              uid: userData.uid,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              isAdmin: userData.role === 'admin',
              branchId: userData.branchId,
              isAuthenticated: true,
              isLegacyUser: true
            });
          } else {
            // Handle regular Firebase Auth user
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setCurrentUser({
                uid: user.uid,
                email: user.email,
                name: userData?.name || user.email.split('@')[0],
                role: userData?.role || 'user',
                isAdmin: userData?.role === 'admin',
                branchId: userData?.branchId || null,
                isAuthenticated: true
              });
            } else {
              console.warn('User authenticated but no user document found:', user.email);
              setCurrentUser(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser(null);
        }
      } else {
        // Clear legacy user data on signout
        sessionStorage.removeItem('legacyUserData');
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    isAdmin: () => currentUser?.role === 'admin',
    branchId: currentUser?.branchId || null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}