// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  setPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Import from your firebase config

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set persistence first
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              // Get user document from Firestore
              const userDoc = await getDoc(doc(db, 'users', user.uid));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                setCurrentUser({ 
                  uid: user.uid,
                  email: user.email,
                  name: userData.name || user.email.split('@')[0],
                  role: userData.role || 'user', // Default to 'user' if role not set
                  isAdmin: userData.role === 'admin', // Proper admin check
                  branchId: userData.branchId || null
                });
              } else {
                // If no user document exists, create a basic one
                setCurrentUser({
                  uid: user.uid,
                  email: user.email,
                  name: user.email.split('@')[0],
                  role: 'user',
                  isAdmin: false,
                  branchId: null
                });
              }
            } catch (error) {
              console.error("Error fetching user data:", error);
              setCurrentUser(null);
            }
          } else {
            setCurrentUser(null);
          }
          setLoading(false);
        });

        return unsubscribe;
      })
      .catch((error) => {
        console.error("Error setting persistence:", error);
        setLoading(false);
      });

  }, []);

  const value = {
    currentUser,
    loading,
    // Add helper functions if needed
    isAdmin: () => currentUser?.role === 'admin',
    branchId: currentUser?.branchId || null
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}