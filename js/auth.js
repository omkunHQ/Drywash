// js/auth.js

// Firebase se 'auth' aur 'onAuthStateChanged' (sabse zaroori) import karein
import { auth, onAuthStateChanged, signOut } from './firebase-config.js';

/**
 * Yeh function check karega ki user protected pages (jaise dashboard) par jaa sakta hai ya nahi.
 * Yeh main.js se call hota hai.
 */
export function setupAuthGuard() {
  
  onAuthStateChanged(auth, (user) => {
    // Yeh function Firebase ke tayyar hone ka intezaar karta hai
    
    if (user) {
      // User logged in hai.
      // Kuch mat karo, use (index.html/dashboard) par rehne do.
      console.log("Auth Guard Pass: User is logged in.", user.uid);
    } else {
      // User logged in nahi hai.
      // Use auth.html par bhejo.
      console.log("Auth Guard Fail: No user found. Redirecting to auth.html");
      
      // Check karein ki hum pehle se auth.html par toh nahi hain
      if (!window.location.pathname.endsWith('auth.html')) {
         // Yahaan aap 'auth.html' ka poora path daalein agar zaroori ho
         window.location.href = 'auth.html'; 
      }
    }
  });
}

/**
 * Yeh function logout button ko handle karta hai.
 */
export function setupLogoutButton() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      signOut(auth).then(() => {
        console.log("User logged out");
        // Logout hone ke baad auth.html par bhej do
        window.location.href = 'auth.html';
      }).catch((error) => {
        console.error("Logout Error:", error);
      });
    });
  }
}
