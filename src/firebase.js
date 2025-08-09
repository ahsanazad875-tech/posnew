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
  apiKey: "AIzaSyDdr_y8iColKO80QSYLWyhI3mFOwDO_Xzo",
  authDomain: "inventory-e1cdf.firebaseapp.com",
  projectId: "inventory-e1cdf",
  storageBucket: "inventory-e1cdf.firebasestorage.app",
  messagingSenderId: "768557409755",
  appId: "1:768557409755:web:070000a88b282b4f40f3fe",
  measurementId: "G-8ZZHK0J8S6"
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
