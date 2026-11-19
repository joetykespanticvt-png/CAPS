// ============================================================
//  CAPS Portal - Firebase setup (shared by every page)
//  1. Firebase Console > Project settings > Your apps > Web app (</>)
//  2. Copy the config values below
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
   apiKey: "AIzaSyDpsTz-qAMT89rcEmymF9w3UVG0UMrUWJM",
  authDomain: "caps-portal.firebaseapp.com",
  projectId: "caps-portal",
  storageBucket: "caps-portal.firebasestorage.app",
  messagingSenderId: "6521746794",
  appId: "1:6521746794:web:de81f4d233ea5e8bf06113",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Whoever registers with this email becomes the admin.
// (Keep this identical to the email inside firestore.rules)
export const ADMIN_EMAIL = "adminsapd2@gmail.com";

export function friendlyAuthError(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "Invalid email or password. Please check your login details.";
    case "auth/email-already-in-use":
      return "This email is already registered.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "permission-denied":
    case "firestore/permission-denied":
      return "Permission denied. Please publish the Firestore rules (see SETUP.md).";
    default:
      return "Something went wrong (" + (code || "unknown") + "). Please try again.";
  }
}