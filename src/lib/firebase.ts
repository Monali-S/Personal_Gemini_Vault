import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "om4ovhhpfekkiq6jmbxk6l",
  appId: "1:916707240257:web:2a82989c9c34ef494c2e64",
  storageBucket: "om4ovhhpfekkiq6jmbxk6l.firebasestorage.app",
  authDomain: "om4ovhhpfekkiq6jmbxk6l.firebaseapp.com",
  messagingSenderId: "916707240257",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase client initialization deferred or using mock fallback:", e);
}

export { app, auth, db };
