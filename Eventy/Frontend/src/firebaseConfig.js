// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDvBDlXqdBFZyCnXGCOFWiha4ABXWzHfRs",
  authDomain: "eventy-1617c.firebaseapp.com",
  projectId: "eventy-1617c",
  storageBucket: "eventy-1617c.firebasestorage.app",
  messagingSenderId: "707459832818",
  appId: "1:707459832818:web:5921bfa1974fbe1b2be96b",
  measurementId: "G-3P15097YY0"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const database = getFirestore(app);
export const storage = getStorage(app);
const analytics = getAnalytics(app);