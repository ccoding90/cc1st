// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAvTld9TNcfq8Fl-r9VPoVKtn9LPMqJ-5c",
  authDomain: "p2603001-t1.firebaseapp.com",
  projectId: "p2603001-t1",
  storageBucket: "p2603001-t1.firebasestorage.app",
  messagingSenderId: "745100111603",
  appId: "1:745100111603:web:6d7025d8744afd4ae29186",
  measurementId: "G-TPNZ80SL0N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);