import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_PUBLIC_API_KEY,
  authDomain: "nosabo-30dcb.firebaseapp.com",
  projectId: "nosabo-30dcb",
  storageBucket: "nosabo-30dcb.firebasestorage.app",
  messagingSenderId: "323662475274",
  appId: "1:323662475274:web:570aa2eb1beaf87810aff3",
  measurementId: "G-FX7CB1K22B",
};

export const app = initializeApp(firebaseConfig);
