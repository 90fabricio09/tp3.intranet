import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDVvulEGcKITXoSpHPorJFSvSKoqd1-5aQ",
  authDomain: "websitetp3.firebaseapp.com",
  projectId: "websitetp3",
  storageBucket: "websitetp3.firebasestorage.app",
  messagingSenderId: "960119253235",
  appId: "1:960119253235:web:044ecdce9c03bf887d2f86",
  measurementId: "G-8TQ256V39L"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

