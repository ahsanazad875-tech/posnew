import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,     
  query,       
  where,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB_XrdD7BsUQGN96X1SIj8FpwdS5dKXh_E",
  authDomain: "royalvapes-d3b21.firebaseapp.com",
  projectId: "royalvapes-d3b21",
  storageBucket: "royalvapes-d3b21.firebasestorage.app",
  messagingSenderId: "576236321162",
  appId: "1:576236321162:web:12f626e27d9ae3a3453073",
  measurementId: "G-TSMB2WFGR1"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin verification
export const verifyAdmin = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() && userDoc.data().role === 'admin';
  } catch (error) {
    console.error("Error verifying admin:", error);
    return false;
  }
};

// Export Firebase services and Firestore utilities
export {
  app,
  auth,
  db,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp 
};
