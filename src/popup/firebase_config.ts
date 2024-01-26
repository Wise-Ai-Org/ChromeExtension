// firebase_config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyA7tVMI9AUAUAL5U2yEV4S5lYl4qA46V_k",
    authDomain: "inwise-412408.firebaseapp.com",
    projectId: "inwise-412408",
    storageBucket: "inwise-412408.appspot.com",
    messagingSenderId: "947755270282",
    appId: "1:947755270282:web:4b38dbb88349724cf8ad73",
    measurementId: "G-CT1VRSVYVK"
};

// This creates firebaseApp instance
// version: SDK 9
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

export{
    firebaseApp, 
    auth
};