// src/firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAo2M0r3D2lCbKYPLInUeH5EqTA3DiVfko",
  authDomain: "body-transformation-app-4ef8b.firebaseapp.com",
  projectId: "body-transformation-app-4ef8b",
  storageBucket: "body-transformation-app-4ef8b.firebasestorage.app",
  messagingSenderId: "310548938107",
  appId: "1:310548938107:web:fb8de2b931bfe5eabe91de"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Helper functions for document references
export const getUserDocRef = (userId) => doc(db, 'users', userId);
export const getWorkoutsDocRef = (userId) => doc(db, 'workouts', userId);

export { 
  db, 
  auth, 
  storage,
  googleProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  ref,
  uploadBytes,
  getDownloadURL,
  doc,
  setDoc
};