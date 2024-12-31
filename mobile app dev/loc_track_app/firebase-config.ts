import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBokmVerwjpk9vx6KCyPkm4bsv7Edw4fpA",
    authDomain: "loc-track-anavart.firebaseapp.com",
    projectId: "loc-track-anavart",
    storageBucket: "loc-track-anavart.firebasestorage.app",
    messagingSenderId: "421473593256",
    appId: "1:421473593256:web:df86792e9250708a0b9f9d",
    measurementId: "G-RKNZ05KBFJ"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
