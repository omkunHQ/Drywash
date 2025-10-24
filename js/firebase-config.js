// js/firebase-config.js

// --- Step 1: Firebase SDKs Import Karein ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut,
    createUserWithEmailAndPassword, // <-- YEH ADD KAREIN (Signup ke liye)
    signInWithEmailAndPassword    // <-- YEH ADD KAREIN (Login ke liye)
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    getFirestore, 
    Timestamp, 
    collection, 
    addDoc, 
    getDocs, 
    onSnapshot, 
    doc, 
    updateDoc, 
    deleteDoc, 
    setDoc, 
    getDoc, 
    getCountFromServer, 
    query, 
    where, 
    orderBy, 
    serverTimestamp, 
    limit,
    writeBatch                  // <-- YEH ADD KAREIN (Default products ke liye)
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Step 2: Apna Firebase Config Paste Karein ---
const firebaseConfig = {
    apiKey: "AIzaSyCxVmGqlbomo47KqXZm4S8QqfL3bXZN6pg",
    authDomain: "drywash-7d086.firebaseapp.com",
    projectId: "drywash-7d086",
    storageBucket: "drywash-7d086.firebasestorage.app",
    messagingSenderId: "850083946512",
    appId: "1:850083946512:web:f0ae239d283abd1dffaa95",
    measurementId: "G-TLPBTQ31KT"
};

// --- Step 3: Firebase Services Initialize Karein ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Step 4: Services aur Functions ko Export Karein ---
// Taaki doosri files inhe import karke use kar sakein

// Main services
export { db, auth };

// Zaroori functions
export {
    // Auth
    onAuthStateChanged, 
    signOut,
    createUserWithEmailAndPassword, // <-- YEH EXPORT KAREIN
    signInWithEmailAndPassword,   // <-- YEH EXPORT KAREIN
    
    // Firestore
    Timestamp, 
    collection, 
    addDoc, 
    getDocs, 
    onSnapshot,
    doc, 
    updateDoc, 
    deleteDoc, 
    setDoc, 
    getDoc,
    getCountFromServer, 
    query, 
    where, 
    orderBy, 
    serverTimestamp, 
    limit,
    writeBatch                  // <-- YEH EXPORT KAREIN
};
