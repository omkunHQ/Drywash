//* js/auth.js *//
// --- Step 1: Firebase Config se Zaroori Cheezein Import Karein ---
import { auth, onAuthStateChanged, signOut } from './firebase-config.js';

/**
 * Auth Guard: Check karta hai ki user logged in hai ya nahi.
 * Agar nahi, toh auth.html par bhej deta hai.
 */
export function setupAuthGuard() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User logged in hai
            console.log("Auth Guard: User is logged in.", user.email);
        } else {
            // User logged in nahin hai, use auth.html par bhej dein
            console.log("Auth Guard: No user found. Redirecting to auth.html");
            window.location.href = 'auth.html';
        }
    });
}

/**
 * Logout Button: Sidebar ke logout button mein functionality add karta hai.
 */
export function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                signOut(auth).then(() => {
                    console.log('User signed out.');
                    // Auth guard apne aap redirect kar dega
                }).catch((error) => {
                    console.error('Sign out error', error);
                });
            }
        });
    }

}
