// js/main.js

// --- Step 1: Auth Modules Import Karein ---
import { setupAuthGuard, setupLogoutButton } from './auth.js';

// --- Step 2: Sabhi Page Modules ko Import Karein ---
// (Yeh files aap next steps mein banayenge)
import { loadDashboardStats, loadRecentOrders, loadWeeklyChart } from './pages/dashboard.js';
import { initPosPage } from '.js/pages/pos.js';
import { initOrdersPage } from './pages/orders.js';
import { initSchedulePage } from './pages/schedule.js';
import { initCashRegisterPage } from './pages/cash-register.js';
import { initCustomersPage } from './pages/customers.js';
import { initStaffPage } from './pages/staff.js';
// ... (Jab aap reports.js, settings.js banayenge, unhe yahaan import karein) ...


// --- Step 3: Jab HTML poora load ho, tab app shuru karein ---
document.addEventListener('DOMContentLoaded', function() {
    
    // --- Auth Setup (Sabse pehle) ---
    setupAuthGuard();
    setupLogoutButton();

    // --- Core Navigation Logic (Aapke original code se) ---
    const navLinks = document.querySelectorAll('[data-page]');
    const contentPages = document.querySelectorAll('.page-content');
    const sidebarNavListItems = document.querySelectorAll('.sidebar-nav li');
    const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');
    const sidebar = document.getElementById('sidebar');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Link ko page reload karne se rokें
            
            const targetPageId = this.getAttribute('data-page');
            const targetPage = document.getElementById(targetPageId);

            // 1. Agar page maujood hai
            if (targetPage) {
                // 1a. Sabhi pages ko hide karein
                contentPages.forEach(page => {
                    page.style.display = 'none';
                });

                // 1b. Target page ko show karein
                targetPage.style.display = 'block';

                // 1c. Menu mein 'active' class update karein
                sidebarNavListItems.forEach(item => item.classList.remove('active'));
                bottomNavItems.forEach(item => item.classList.remove('active'));

                // Sidebar
                const sidebarLink = document.querySelector(`.sidebar-nav a[data-page="${targetPageId}"]`);
                if (sidebarLink) {
                    sidebarLink.parentElement.classList.add('active');
                }
                
                // Bottom Nav
                const bottomNavLink = document.querySelector(`.bottom-nav .nav-item[data-page="${targetPageId}"]`);
                if (bottomNavLink) {
                    bottomNavLink.classList.add('active');
                }
                
                // 1d. Mobile par menu band karein
                if (sidebar && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            } else {
                console.warn("Page not found:", targetPageId);
            }
        });
    });

    // --- Mobile Menu Toggle ---
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    if (menuToggleBtn && sidebar) {
        menuToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // --- Mobile par side-click se menu band karein ---
    document.addEventListener('click', function(event) {
        if (sidebar && !sidebar.contains(event.target) && menuToggleBtn && !menuToggleBtn.contains(event.target) && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
    
    // --- Mobile/Desktop layout handle karein ---
    const mobileActions = document.querySelector('.mobile-only-quick-actions');
    const desktopActions = document.querySelector('.desktop-content');

    function handleResponsiveLayout() {
        if (!mobileActions || !desktopActions) return;

        if (window.innerWidth < 768) {
            mobileActions.style.display = 'block';
        } else {
            mobileActions.style.display = 'none';
        }
    }
    handleResponsiveLayout();
    window.addEventListener('resize', handleResponsiveLayout);


    // --- Step 4: Sabhi Page Modules ko Initialize Karein ---
    // Dashboard functions ko seedha call karein
    loadDashboardStats();
    loadRecentOrders();
    loadWeeklyChart();
    
    // Baaki pages ke "init" functions ko call karein
    // Yeh functions apne-apne event listeners ko setup karenge
    initPosPage();
    initOrdersPage();
    initSchedulePage();
    initCashRegisterPage();
    initCustomersPage();
    initStaffPage();
    
    console.log("Modular App Initialized Successfully.");
});
