// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  // @ts-ignore
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDqMK7AZaRQyr6DvQwxOxuNJ7wtMxpoex8",
  // @ts-ignore
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pickpackpromx.firebaseapp.com",
  // @ts-ignore
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pickpackpromx",
  // @ts-ignore
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pickpackpromx.firebasestorage.app",
  // @ts-ignore
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1072798208281",
  // @ts-ignore
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1072798208281:web:b818b9db86bd881430f588"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };