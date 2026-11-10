import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Replace these placeholders with your actual keys from Step 1
const firebaseConfig = {
  apiKey: "AIzaSyDpsTz-qAMT89rcEmymF9w3UVG0UMrUWJM",
  authDomain: "caps-portal.firebaseapp.com",
  projectId: "caps-portal",
  storageBucket: "caps-portal.firebasestorage.app",
  messagingSenderId: "6521746794",
  appId: "1:6521746794:web:de81f4d233ea5e8bf06113",
  measurementId: "G-JZLKNC85QZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
};