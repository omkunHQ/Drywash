//*==========================================*//
//*============== Firebase Config Start ==============*//
//*==========================================*//
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"; // <-- YEH ADD KAREIN
import { getFirestore, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { collection, addDoc, getDocs, onSnapshot,  doc, updateDoc, deleteDoc, setDoc, getDoc, getCountFromServer,   query, where, orderBy, serverTimestamp, limit} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Paste Your Firebase Project Configuration Here ---
const firebaseConfig = {
    apiKey: "AIzaSyCxVmGqlbomo47KqXZm4S8QqfL3bXZN6pg",
    authDomain: "drywash-7d086.firebaseapp.com",
    projectId: "drywash-7d086",
    storageBucket: "drywash-7d086.firebasestorage.app",
    messagingSenderId: "850083946512",
    appId: "1:850083946512:web:f0ae239d283abd1dffaa95",
    measurementId: "G-TLPBTQ31KT"
  };
// --- End Firebase Project Configuration ---

// --- Initialize Firebase App ---
// This creates the connection to your Firebase project
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// --- End Initialize Firebase App ---

// --- Export Firebase Services ---
export const db = getFirestore(app); // Firestore Database service
export { Timestamp }; // Export Timestamp for creating date/time fields

// --- End Export Firebase Services ---
//*==========================================*//
//*============== Firebase Config End ==============*//
//*==========================================*//
 
//*============== Auth Guard Start ==============*//
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User logged in hai
        console.log("Auth Guard: User is logged in.", user.email);
    } else {
        // User logged in nahin hai, use auth.html par bhej dein
        console.log("Auth Guard: No user found. Redirecting to login.");
        window.location.href = 'auth.html';
    }
});
//*============== Auth Guard End ==============*//
 
	//*============== App.js Start==================*//
                    /* यह कोड हर पेज पर चलेगा */
document.addEventListener('DOMContentLoaded', function() {
    
    // --- 0. नया पेज नेविगेशन लॉजिक ---
    const navLinks = document.querySelectorAll('[data-page]'); 
    const contentPages = document.querySelectorAll('.page-content');
    const sidebarNavListItems = document.querySelectorAll('.sidebar-nav li');
    const bottomNavItems = document.querySelectorAll('.bottom-nav .nav-item');
    const sidebar = document.getElementById('sidebar');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // लिंक को पेज रीलोड करने से रोकें
            
            const targetPageId = this.getAttribute('data-page');
            const targetPage = document.getElementById(targetPageId);

            // 1. अगर पेज मौजूद है, तभी आगे बढ़ें
            if (targetPage) {
                // 1a. सभी पेजों को छिपाएँ
                contentPages.forEach(page => {
                    page.style.display = 'none';
                });

                // 1b. सिर्फ टारगेट पेज को दिखाएँ
                targetPage.style.display = 'block';

                // 1c. मेनू में 'active' क्लास को अपडेट करें
                // Pehle sabhi active classes hatao
                sidebarNavListItems.forEach(item => item.classList.remove('active'));
                bottomNavItems.forEach(item => item.classList.remove('active'));

                // Ab target ke hisaab se sahi menu item ko active karo
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
                
                // 1d. मोबाइल पर मेनू बंद करें
                if (sidebar && sidebar.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            } else {
                console.warn("Page not found:", targetPageId); // अगर पेज न मिले तो चेतावनी दें
            }
        });
    });

    // --- 1. मोबाइल मेनू टॉगल ---
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    // const sidebar = document.getElementById('sidebar'); // (पहले ही ऊपर डिफाइन कर दिया है)

    if (menuToggleBtn && sidebar) {
        menuToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // --- 2. मोबाइल पर साइडबार के बाहर क्लिक करने पर बंद करें ---
    document.addEventListener('click', function(event) {
        if (sidebar && !sidebar.contains(event.target) && menuToggleBtn && !menuToggleBtn.contains(event.target) && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

    // --- 3. मोबाइल-ओनली एक्शन को हैंडल करना (सिर्फ डैशबोर्ड पर) ---
    const mobileActions = document.querySelector('.mobile-only-quick-actions');
    const desktopActions = document.querySelector('.desktop-row-2 .quick-actions-container');

    function handleResponsiveLayout() {
        if (!mobileActions || !desktopActions) return; // अगर पेज पर नहीं है तो बाहर निकलें

        if (window.innerWidth < 768) {
            mobileActions.style.display = 'block';
            desktopActions.style.display = 'none';
        } else {
            mobileActions.style.display = 'none';
            desktopActions.style.display = 'block';
        }
    }

    // पेज लोड और रीसाइज़ पर चलाएँ
    handleResponsiveLayout();
    window.addEventListener('resize', handleResponsiveLayout);
  // --- 4. NAYA LOGOUT EVENT LISTENER ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                signOut(auth).then(() => {
                    console.log('User signed out.');
                    // Auth guard (onAuthStateChanged) apne aap redirect kar dega
                }).catch((error) => {
                    console.error('Sign out error', error);
                });
            }
        });
    }
});
//*============== App.js End==================*//

//*==========================================*//
//*============== Dasboard Start ==================*//
//*==========================================*//
// --- Feature: Stats Cards Load Start ---
async function loadDashboardStats() {
    console.log("Loading dashboard stats from Firebase...");
    
    // Get today's date range for queries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today 00:00:00
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // Tomorrow 00:00:00
    
    // Convert to Firebase Timestamps (Make sure Timestamp is imported)
    const todayStartTimestamp = Timestamp.fromDate(todayStart);
    const todayEndTimestamp = Timestamp.fromDate(todayEnd);

    try {
        // Reference to the 'orders' collection
        const ordersRef = collection(db, "orders");

        // --- Today's Orders ---
        const todayOrdersQuery = query(ordersRef, 
            where("createdAt", ">=", todayStartTimestamp), 
            where("createdAt", "<", todayEndTimestamp)
        );
        const todayOrdersSnapshot = await getDocs(todayOrdersQuery);
        document.getElementById('stats-today-orders').textContent = todayOrdersSnapshot.size;

        // --- Total Pending Orders ---
        const pendingQuery = query(ordersRef, where('status', '==', 'PENDING'));
        const pendingSnapshot = await getDocs(pendingQuery);
        document.getElementById('stats-pending').textContent = pendingSnapshot.size;
        
        // --- Total Delivered Orders ---
        // Replace 'DELIVERED' if you use a different status name
        const deliveredQuery = query(ordersRef, where('status', '==', 'DELIVERED')); 
        const deliveredSnapshot = await getDocs(deliveredQuery);
        document.getElementById('stats-delivered').textContent = deliveredSnapshot.size;
        
        // --- Total Customers ---
        // Make sure getCountFromServer is imported
        const customersRef = collection(db, "customers");
        const customersCountSnapshot = await getCountFromServer(customersRef); 
        document.getElementById('stats-customers').textContent = customersCountSnapshot.data().count;

        // --- Unpaid Orders ---
        const unpaidQuery = query(ordersRef, where('paymentStatus', '==', 'UNPAID'));
        const unpaidSnapshot = await getDocs(unpaidQuery);
        document.getElementById('stats-unpaid').textContent = unpaidSnapshot.size;

        // --- Total Pickup Requests (Today - non-recurring only) ---
        const scheduleRef = collection(db, "schedule");
        const pickupQuery = query(scheduleRef, 
            where("extendedProps.type", "==", "PICKUP"),
            where("start", ">=", todayStartTimestamp),
            where("start", "<", todayEndTimestamp)
            // Note: This needs adjustment for recurring tasks.
        );
        const pickupSnapshot = await getDocs(pickupQuery);
        document.getElementById('stats-pickup').textContent = pickupSnapshot.size;

    } catch (error) {
        console.error("Error loading dashboard stats:", error);
        // Set UI elements to an error state or default
        document.getElementById('stats-today-orders').textContent = 'ERR';
        document.getElementById('stats-pending').textContent = 'ERR';
        document.getElementById('stats-delivered').textContent = 'ERR';
        document.getElementById('stats-customers').textContent = 'ERR';
        document.getElementById('stats-unpaid').textContent = 'ERR';
        document.getElementById('stats-pickup').textContent = 'ERR';
    }
}
// --- Feature: Stats Cards Load End ---


// --- Feature: Recent Orders Table Load Start ---
async function loadRecentOrders() {
    const tableBody = document.getElementById('orders-table-body');
    if (!tableBody) return; // Exit if table body doesn't exist
    
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading recent orders...</td></tr>';
    
    try {
        const ordersRef = collection(db, "orders");
        // Query for the 5 most recent orders based on creation time
        const recentOrdersQuery = query(ordersRef, orderBy('createdAt', 'desc'), limit(5));
        const snapshot = await getDocs(recentOrdersQuery);
        
        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No recent orders found.</td></tr>';
            return;
        }
        
        tableBody.innerHTML = ''; // Clear the loading message
        snapshot.forEach(doc => {
            const order = doc.data();
            // Format the Firestore Timestamp to a readable date string
            const orderDate = order.createdAt ? order.createdAt.toDate().toLocaleDateString() : 'N/A';
            // Calculate total quantity from the items array
            const quantity = order.items ? order.items.reduce((sum, item) => sum + (item.qty || 0), 0) : 'N/A'; 

            // Create the table row HTML
            const row = `
                <tr>
                    <td>${doc.id.substring(0, 6).toUpperCase()}</td> 
                    <td>${order.customerName || 'N/A'}</td>
                    <td>${orderDate}</td>
                    <td>${quantity}</td>
                    <td><span class="status-badge ${order.status ? order.status.toLowerCase() : 'pending'}">${order.status || 'PENDING'}</span></td>
                </tr>
            `;
            tableBody.innerHTML += row; // Add the row to the table
        });
    } catch (error) {
        console.error("Error loading recent orders:", error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading orders.</td></tr>';
    }
}
// --- Feature: Recent Orders Table Load End ---


// --- Feature: Weekly Chart Load Start ---
async function loadWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return; // Exit if chart canvas doesn't exist

    const labels = []; // Chart labels (e.g., 'Mon', 'Tue')
    const dataCounts = []; // Order counts for each day
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to the beginning of today

    try {
        // Loop through the last 7 days (including today)
        for (let i = 6; i >= 0; i--) {
            // Calculate start and end Timestamps for each day
            const dayStart = new Date(today);
            dayStart.setDate(today.getDate() - i);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayStart.getDate() + 1);

            const dayStartTimestamp = Timestamp.fromDate(dayStart);
            const dayEndTimestamp = Timestamp.fromDate(dayEnd);

            // Query orders created within that day's range
            const dayQuery = query(collection(db, "orders"),
                where("createdAt", ">=", dayStartTimestamp),
                where("createdAt", "<", dayEndTimestamp)
            );
            const daySnapshot = await getDocs(dayQuery);
            
            // Add the day's label and order count to the arrays
            labels.push(dayStart.toLocaleDateString('en-US', { weekday: 'short' })); 
            dataCounts.push(daySnapshot.size);
        }

        // Check if a chart instance already exists on the canvas and destroy it
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        // Create the new Chart.js bar chart
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Orders',
                    data: dataCounts, 
                    backgroundColor: 'var(--primary-orange)', // Use your theme color
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Important for fitting in container
                plugins: { legend: { display: false } }, // Hide the legend
                scales: {
                    y: { beginAtZero: true }, // Start y-axis at 0
                    x: { grid: { display: false } } // Hide vertical grid lines
                }
            }
        });

    } catch (error) {
        console.error("Error loading weekly chart data:", error);
        // Optionally display an error message on the chart canvas
        const context = ctx.getContext('2d');
        context.clearRect(0, 0, ctx.width, ctx.height); // Clear canvas
        context.fillStyle = 'red';
        context.textAlign = 'center';
        context.fillText('Error loading chart data', ctx.width / 2, ctx.height / 2);
    }
}
// --- Feature: Weekly Chart Load End ---


// --- Initialization ---
// This part calls the functions to load data when the script runs.
// You might want to integrate this with your page navigation logic
// so it only runs when the dashboard page is actually shown.
console.log("Initializing Dashboard...");
loadDashboardStats();
loadRecentOrders();
loadWeeklyChart();
//*==========================================*//
//*============== Dasboard End==================*//
//*==========================================*//

//*==========================================*//
//*============== Pos Start ==================*//
//*===========================================*//
// --- 1. DOM ELEMENTS ---
// --- DOM Elements Start ---
const productGrid = document.getElementById('product-grid');
const productFilters = document.getElementById('product-filters');
const cartItemsList = document.getElementById('cart-items-list');
const subtotalEl = document.getElementById('summary-subtotal');
const totalEl = document.getElementById('summary-total');
const placeOrderBtn = document.getElementById('place-order-btn');

// Forms
const customItemForm = document.getElementById('custom-item-form');
const customerPhoneInput = document.getElementById('customer-phone');
const customerNameInput = document.getElementById('customer-name');

// Feature: Express Order Checkbox
const isExpressCheckbox = document.getElementById('is-express-order');
// --- DOM Elements End ---


// --- 2. STATE ---
// --- State Start ---
let cart = []; // Format: { id, name, price, qty }
let allProducts = []; // Stores products fetched from Firebase or demo
// --- State End ---


// --- 3. INITIALIZATION & DATA LOADING ---
// --- Data Loading Start ---
async function loadProductsAndCategories() { // Made async for Firebase
    console.log("Loading products...");
    
    // Clear previous data
    allProducts = [];
    if (productFilters) {
        // Clear old filters except 'All'
        const existingFilters = productFilters.querySelectorAll('.filter-btn:not([data-category="all"])');
        existingFilters.forEach(btn => btn.remove());
    }

    try {
        // --- Firebase Product Loading Start ---
        const productsCol = collection(db, 'products'); // Assumes a 'products' collection
        const snapshot = await getDocs(productsCol);
        
        const categories = new Set();
        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            allProducts.push(product);
            if (product.category) categories.add(product.category);
        });
        // --- Firebase Product Loading End ---
        
        renderCategories(categories);
        renderProducts('all'); // Initially render all products

    } catch (error) {
        console.error("Error loading products from Firebase: ", error);
        productGrid.innerHTML = '<p style="color: red;">Error loading products. Please try again.</p>';
        // Fallback to demo data if needed, or show error
        /*
        // --- Demo Data Start (Fallback) ---
        allProducts = [
            { id: 'p1', name: 'Shirt', price: 25, icon: 'fa-shirt', category: 'Wash & Iron' },
            // ... other demo products
        ];
        const categories = new Set(allProducts.map(p => p.category));
        renderCategories(categories);
        renderProducts('all');
        // --- Demo Data End ---
        */
    }
}
// --- Data Loading End ---


// --- 4. CATEGORY & PRODUCT RENDERING ---
// --- Rendering Start ---
function renderCategories(categories) {
    if (!productFilters) return;
    categories.forEach(category => {
        // Avoid adding duplicate category buttons if function is called again
        if (productFilters.querySelector(`[data-category="${category}"]`)) return;
        
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = category;
        btn.dataset.category = category;
        productFilters.appendChild(btn);
    });
}

function renderProducts(category) {
    if (!productGrid) return;
    
    productGrid.innerHTML = ''; // Clear grid
    const filteredProducts = (category === 'all')
        ? allProducts
        : allProducts.filter(p => p.category === category);
    
    if (filteredProducts.length === 0) {
        productGrid.innerHTML = '<p>No products found in this category.</p>';
        return;
    }

    filteredProducts.forEach(p => {
        const card = document.createElement('div');
        card.className = 'action-card product-card';
        card.innerHTML = `
            <i class="fa-solid ${p.icon || 'fa-tag'}"></i>
            <div class="name">${p.name}</div>
            <div class="price">$${p.price ? p.price.toFixed(2) : '0.00'}</div> 
        `;
        card.addEventListener('click', () => addToCart(p.id, p.name, p.price || 0, 1));
        productGrid.appendChild(card);
    });
}
// --- Rendering End ---


// --- 5. CART LOGIC ---
// --- Cart Logic Start ---
function addToCart(id, name, price, qty) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.qty += qty;
    } else {
        cart.push({ id, name, price: parseFloat(price), qty: parseFloat(qty) });
    }
    renderCart();
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.id === id);
    if (!item) return;

    item.qty += change;
    if (item.qty <= 0) {
        cart = cart.filter(cartItem => cartItem.id !== id);
    }
    renderCart();
}
    
function renderCart() {
    if (!cartItemsList) return;

    cartItemsList.innerHTML = '';
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<div class="cart-empty-msg">Cart is empty</div>';
    } else {
        cart.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            const itemTotal = (item.price * item.qty).toFixed(2);
            const isCustom = item.id.startsWith('custom-');
            
            itemEl.innerHTML = `
                <div class="cart-item-details">
                    <div class="name">${item.name}</div>
                    <div class="price">$${item.price.toFixed(2)} x ${item.qty} = <strong>$${itemTotal}</strong></div>
                </div>
                <div class="cart-item-qty">
                    ${!isCustom ? 
                    `<button class="qty-change" data-id="${item.id}" data-change="-1">-</button>
                     <span class="qty-value">${item.qty}</span>
                     <button class="qty-change" data-id="${item.id}" data-change="1">+</button>` : 
                     `<span class="qty-value">${item.qty} ${item.name.toLowerCase().includes('kg') ? 'kg' : 'unit'}</span>`}
                </div>
                <button class="cart-item-remove" data-id="${item.id}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
            cartItemsList.appendChild(itemEl);
        });
    }
    updateTotals(); 
}
    
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discount = 0; // Placeholder for future discount logic
    const total = subtotal - discount;
    
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}
// --- Cart Logic End ---


// --- 6. EVENT HANDLERS ---
// --- Event Handlers Start ---

// Handler: Category filter buttons
if (productFilters) {
    productFilters.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.classList.contains('filter-btn')) {
            // Remove active class from previously active button
             const currentActive = productFilters.querySelector('.filter-btn.active');
             if (currentActive) currentActive.classList.remove('active');
            // Add active class to the clicked button
            e.target.classList.add('active');
            // Render products for the selected category
            renderProducts(e.target.dataset.category);
        }
    });
}


// Handler: Cart item buttons (Quantity/Remove)
if (cartItemsList) {
    cartItemsList.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        const id = target.dataset.id;
        if (target.classList.contains('qty-change')) {
            updateQuantity(id, parseInt(target.dataset.change));
        }
        if (target.classList.contains('cart-item-remove')) {
            cart = cart.filter(item => item.id !== id);
            renderCart();
        }
    });
}

// --- Feature: Custom Item Form Start ---
if (customItemForm) {
    customItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('custom-item-name');
        const qtyInput = document.getElementById('custom-item-qty');
        const priceInput = document.getElementById('custom-item-price');

        const name = nameInput.value;
        const qty = parseFloat(qtyInput.value);
        const price = parseFloat(priceInput.value);

        if (!name || isNaN(qty) || isNaN(price) || qty <= 0 || price < 0) { // Price can be 0
            alert("Please fill all custom item fields with valid inputs (Name, Qty > 0, Price >= 0).");
            return;
        }

        const customId = `custom-${Date.now()}`;
        addToCart(customId, name, price, qty);

        // Reset only the custom form fields
        nameInput.value = '';
        qtyInput.value = 1;
        priceInput.value = '';
    });
}
// --- Feature: Custom Item Form End ---

// Handler: Place Order button click
if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', async () => { // Make async for Firebase
        const customerPhone = customerPhoneInput ? customerPhoneInput.value : '';
        if (cart.length === 0) {
            alert("Cart is empty!"); return;
        }
        if (!customerPhone) {
            alert("Customer Phone is required."); 
            if (customerPhoneInput) customerPhoneInput.focus();
            return;
        }

        // --- Feature: Express Order Data Start ---
        const orderData = {
            customerPhone: customerPhone,
            customerName: customerNameInput ? customerNameInput.value : '',
            items: cart,
            subtotal: parseFloat(subtotalEl.textContent.replace('$', '')),
            total: parseFloat(totalEl.textContent.replace('$', '')),
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            isExpress: isExpressCheckbox ? isExpressCheckbox.checked : false, // Check if checkbox exists
            createdAt: serverTimestamp() // Use Firebase server time
        };
        // --- Feature: Express Order Data End ---

        console.log("Saving order to Firebase...", orderData);
        placeOrderBtn.disabled = true; // Prevent double clicks
        placeOrderBtn.textContent = 'Placing Order...';

        // --- Firebase Save Logic Start ---
        try {
            const docRef = await addDoc(collection(db, "orders"), orderData);
            alert(`Order Placed Successfully! Invoice ID: ${docRef.id}`);
            
            // Clear cart and form after successful save
            cart = [];
            renderCart();
            if (customerPhoneInput) customerPhoneInput.value = '';
            if (customerNameInput) customerNameInput.value = '';
            if (isExpressCheckbox) isExpressCheckbox.checked = false;
            
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Error placing order. Please check the console and try again.");
        } finally {
             placeOrderBtn.disabled = false; // Re-enable button
             placeOrderBtn.textContent = 'Charge & Place Order';
        }
        // --- Firebase Save Logic End ---
    });
}
// --- Event Handlers End ---

//*==========================================*//
//*============== Pos End ====================*//
//*===========================================*//

//*==========================================*//
//*============== Order Start ==================*//
//*==========================================*//
    // --- 1. DOM ELEMENTS ---
    // Is section mein hum page ke sabhi zaroori HTML elements ko select kar rahe hain.
    // --- DOM Elements Start ---
    
    // YEH BADLAAV KIYA GAYA HAI
    const ordersTableBody = document.getElementById('orders-list-body');
    const orderSearchInput = document.getElementById('order-search');
    
    // Order Details Modal elements
    const orderModal = document.getElementById('order-details-modal');
    // Check karein ki modal maujood hai ya nahin (error se bachne ke liye)
    const orderModalCloseBtn = orderModal ? orderModal.querySelector('.close-btn[data-modal="order-details-modal"]') : null;
    const printBtn = document.getElementById('print-order-tag-btn');
    // --- DOM Elements End ---    
    
    // --- 4. CORE FUNCTION: RENDER ORDER DETAILS MODAL ---
    async function renderOrderDetails(orderId) { // 'async' banayein
        if (!orderModal) return;

        try {
            // --- YEH BADLAAV HAI ---
            // 1. Data seedha Firebase se fetch karein
            const orderRef = doc(db, "orders", orderId);
            const docSnap = await getDoc(orderRef); // getDoc import karna hoga

            if (!docSnap.exists()) {
                alert("Error: Order not found.");
                return;
            }
            const order = { id: docSnap.id, ...docSnap.data() };
            // --- BADLAAV KHATAM ---

            // 2. Simple info bharein (Date format badlein)
            const orderDate = order.createdAt ? order.createdAt.toDate().toLocaleString() : 'N/A';
            document.getElementById('modal-order-date').textContent = orderDate;
            
            // ... (Baaki poora function waisa hi rahega) ...
            
            // 6. Print feature ke liye current ID save karein
            // currentViewingOrderId = orderId; // Yeh theek hai (Global variable hona chahiye)
            
            // 7. Modal kholein
            orderModal.style.display = 'block';

        } catch (error) {
            console.error("Error fetching order details:", error);
            alert("Could not load order details.");
        }
    }
    // --- Render Details Modal Function End ---

    // --- 5. LOGIC: UPDATE STATUS ---
    async function updateStatus(orderId, newStatus) { // 'async' banayein
        console.log(`Updating ${orderId} to ${newStatus}`);
        
        // --- YEH BADLAAV HAI ---
        const orderRef = doc(db, "orders", orderId);
        try {
            await updateDoc(orderRef, {
                status: newStatus
            });
            // Data apne aap update ho jaayega (onSnapshot ke kaaran)
            if (orderModal) orderModal.style.display = 'none'; // Modal band karein
        } catch (error) {
            console.error("Error updating status: ", error);
            alert("Failed to update status.");
        }
        
    }
    // --- Update Status Function End ---

    
    // --- 6. FEATURE: PRINT GARMENT TAG ---
    // Yeh function modal se print button dabaane par naya window kholta hai.
    // --- Print Tag Function Start ---
    function printOrderTag(orderId) {
        // const order = allOrdersDemoData.find(o => o.id === orderId); // YEH DEMO DATA HAI
        // !! NOTE: Aapko 'allOrdersDemoData' ko Firebase se fetch kiye gaye data se badalna hoga
        // Abhi ke liye yeh function shayad kaam na kare jab tak data load na ho.
        alert("Print function needs to be connected to live data.");
        /*
        if (!order) return;

        let itemsHtml = '';
        order.items.forEach(item => {
            // Har item ke liye ek tag
            itemsHtml += `
                <div class="tag">
                    <h2>${order.id}</h2>
                    <h3>${item.name} (${item.qty} pcs)</h3>
                    <p>Customer: ${order.name}</p>
                    ${order.isExpress ? '<p><strong>** EXPRESS **</strong></p>' : ''}
                </div>
            `;
        });

        // Nayi print window kholein
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`... (Print HTML here) ...`);
        printWindow.document.close();
        */
    }
    // --- Print Tag Function End ---

    
    // --- 7. EVENT LISTENERS SETUP ---
    // Yeh function page load hone par sabhi zaroori event listeners ko setup karta hai.
    // --- Event Listeners Start ---
    function setupOrderEventListeners() {
        // YEH BADLAAV KIYA GAYA HAI
        // Check karein ki zaroori elements page par hain
        if (!ordersTableBody || !orderSearchInput || !orderModal || !orderModalCloseBtn || !printBtn) {
            console.warn("Order management elements not found. Skipping listeners.");
            return;
        }

        // 1. Search (Jaise hi user type karega, list filter hogi)
        // YEH BADLAAV KIYA GAYA HAI
        orderSearchInput.addEventListener('input', (e) => {
            loadOrders(e.target.value.toLowerCase()); // 'loadOrders' function define hona chahiye
        });

        // 2. "View" button click (Event Delegation)
        // Hum poori table body par ek listener laga rahe hain.
        // YEH BADLAAV KIYA GAYA HAI
        ordersTableBody.addEventListener('click', (e) => {
            const viewButton = e.target.closest('.btn-view-order');
            if (viewButton) {
                const orderId = viewButton.getAttribute('data-id');
                renderOrderDetails(orderId);
            }
        });
        
        // 3. Modal ka Close (X) button
        // YEH BADLAAV KIYA GAYA HAI
        if (orderModalCloseBtn) { // Check karein ki button hai
            orderModalCloseBtn.addEventListener('click', () => {
                orderModal.style.display = 'none';
            });
        } // Yahaan 'k' HATA DIYA GAYA HAI

        // 4. Modal ke bahar click karne par modal band karein
        window.addEventListener('click', (e) => {
            if (e.target == orderModal) {
                orderModal.style.display = 'none';
            }
        });
        
        // 5. Print Button Click
        printBtn.addEventListener('click', () => {
            let currentViewingOrderId; // Isko globally define karein ya renderOrderDetails se set karein
            if (currentViewingOrderId) {
                printOrderTag(currentViewingOrderId);
            } else {
                alert('Error: Could not find order to print.');
            }
        });
    }
    // --- Event Listeners End ---
// --- 2. CORE FUNCTION: LOAD & RENDER ORDERS ---
// YEH FUNCTION AAPKE CODE MEIN MISSING THA
function loadOrders(searchTerm = "") {
    if (!ordersTableBody) return;
    ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading orders...</td></tr>';

    // 'orders' collection ko sunein
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    // onSnapshot real-time listener hai
    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No orders found.</td></tr>';
            return;
        }

        ordersTableBody.innerHTML = ''; // Table khaali karein
        snapshot.forEach(doc => {
            const order = { id: doc.id, ...doc.data() };

            // Search filter
            const orderDate = order.createdAt ? order.createdAt.toDate().toLocaleDateString() : 'N/A';
            const searchText = (order.id + order.customerName + order.customerPhone + orderDate).toLowerCase();

            if (searchTerm && !searchText.includes(searchTerm)) {
                return; // Match nahin hua toh skip
            }

            // Render row
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id.substring(0, 6).toUpperCase()}</td>
                <td>
                    <div>${order.customerName || 'N/A'}</div>
                    <small>${order.customerPhone || 'N/A'}</small>
                </td>
                <td>${orderDate}</td>
                <td>$${order.total ? order.total.toFixed(2) : '0.00'}</td>
                <td><span class="status-badge ${order.status ? order.status.toLowerCase() : 'pending'}">${order.status || 'PENDING'}</span></td>
                <td>
                    <button class="btn btn-secondary btn-view-order" data-id="${order.id}" style="padding: 5px 10px;">
                        <i class="fa-solid fa-eye"></i> View
                    </button>
                </td>
            `;
            ordersTableBody.appendChild(row);
        });
    });
}

// Is function ko 'Order' page par jaate hi call karein
const orderLink = document.querySelector('a[data-page="page-orders"]');
if (orderLink) {
    orderLink.addEventListener('click', () => {
        loadOrders(); // Page load par call karein
        setupOrderEventListeners(); // Listeners setup karein
    }, { once: true }); // Sirf ek baar
}
// Safety check agar user seedha Orders page par land hota hai
if (document.getElementById('page-orders').style.display !== 'none') {
    loadOrders();
    setupOrderEventListeners();
}
//*==========================================*//
//*============== Order End ==================*//
//*===========================================*//

//*==========================================*//
//*============== schedule Start ==============*//
//*===========================================*//
    // --- 1. DOM ELEMENTS ---
    // Page ke sabhi zaroori HTML elements ko yahaan select kiya jaa raha hai
    // --- DOM Elements Start ---
    const calendarEl = document.getElementById('schedule-calendar');
    const scheduleModal = document.getElementById('schedule-modal');
    const form = document.getElementById('schedule-form');
    const modalTitle = document.getElementById('schedule-modal-title');
    const openModalBtn = document.getElementById('add-schedule-event-btn');
    // YEH BADLAAV KIYA GAYA HAI
    const closeModalBtn = scheduleModal ? scheduleModal.querySelector('.close-btn[data-modal="schedule-modal"]') : null;
    const deleteBtn = document.getElementById('delete-event-btn');
    
    // Form fields
    const eventIdInput = document.getElementById('event-id');
    const eventOrderSelect = document.getElementById('event-order-select');
    const eventTitleInput = document.getElementById('event-title'); // Hidden
    const eventTypeInput = document.getElementById('event-type');
    const eventRiderSelect = document.getElementById('event-rider-select');
    const eventDateInput = document.getElementById('event-date');
    const eventTimeInput = document.getElementById('event-time');

    // Feature: Recurring
    const isRecurringCheckbox = document.getElementById('is-recurring');
    const recurringOptionsDiv = document.getElementById('recurring-options');
    const recurringDaysContainer = document.getElementById('recurring-days');
    const recurringDaysButtons = recurringDaysContainer ? recurringDaysContainer.querySelectorAll('.day-btn') : [];
    const recurringEndDateInput = document.getElementById('recurring-end-date');

    // Feature: Route Optimize
    const routeRiderSelect = document.getElementById('route-rider-select');
    const optimizeRouteBtn = document.getElementById('optimize-route-btn');
    // IMPORTANT: Yahaan apna address daalein
    const YOUR_SHOP_ADDRESS = "123 Laundry Shop St, New Delhi"; 
    // --- DOM Elements End ---

    
    // --- 2. STATE & CALENDAR OBJECT ---
    // --- State Start ---
    let calendar; // Calendar object ko yahaan store karenge
    let selectedRecurringDays = []; // ['0', '3'] (Sunday, Wednesday)
    // --- State End ---

    
    // --- 3. MODAL & DATA FUNCTIONS ---
    // Modal ko kholne/band karne ke helper functions
    // --- Modal Functions Start ---
    function openModalForCreate(dateStr) {
        // YEH BADLAAV KIYA GAYA HAI
        if (!scheduleModal) return; 
        form.reset();
        modalTitle.textContent = 'Add New Entry';
        deleteBtn.style.display = 'none';
        eventIdInput.value = '';
        
        loadOrdersIntoDropdown(); 
        loadRidersIntoDropdown(eventRiderSelect); // Modal ka rider dropdown
        
        eventOrderSelect.style.display = 'block';
        eventDateInput.value = dateStr;
        
        // Recurring fields reset karein
        isRecurringCheckbox.checked = false;
        if(recurringOptionsDiv) recurringOptionsDiv.style.display = 'none';
        recurringDaysButtons.forEach(btn => btn.classList.remove('active'));
        selectedRecurringDays = [];
        
        // YEH BADLAAV KIYA GAYA HAI
        scheduleModal.style.display = 'block'; 
    }
    
    async function openModalForEdit(event) { // 'async' banaya
        // YEH BADLAAV KIYA GAYA HAI
        if (!scheduleModal) return; 
        form.reset();
        modalTitle.textContent = 'Edit Entry';
        deleteBtn.style.display = 'block';
        
        // Dono dropdown load karein
        await loadOrdersIntoDropdown();
        await loadRidersIntoDropdown(eventRiderSelect); 
        
        // Form data bharein
        eventIdInput.value = event.id;
        eventTitleInput.value = event.title; // Hidden title
        eventTypeInput.value = event.extendedProps.type;
        eventRiderSelect.value = event.extendedProps.riderId || "";
        
        // Date/Time
        const eventDate = new Date(event.start);
        eventDateInput.value = eventDate.toISOString().split('T')[0];
        if (!event.allDay) {
            eventTimeInput.value = eventDate.toTimeString().split(' ')[0].substring(0, 5);
        }

        // Agar order se linked hai toh dropdown chhipa do
        if (event.extendedProps.orderId) {
            eventOrderSelect.style.display = 'none';
        } else {
            eventOrderSelect.style.display = 'block';
        }

        // Recurring fields
        if (event.extendedProps.isRecurring) {
            isRecurringCheckbox.checked = true;
            recurringOptionsDiv.style.display = 'block';
            const rule = event.extendedProps.recurringRule;
            selectedRecurringDays = rule.days;
            recurringDaysButtons.forEach(btn => {
                if (rule.days.includes(btn.dataset.day)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            recurringEndDateInput.value = rule.end || '';
        } else {
            isRecurringCheckbox.checked = false;
            recurringOptionsDiv.style.display = 'none';
        }
        
        // YEH BADLAAV KIYA GAYA HAI
        scheduleModal.style.display = 'block'; 
    }
    
    function closescheduleModal() {
        // YEH BADLAAV KIYA GAYA HAI
        if (scheduleModal) scheduleModal.style.display = 'none';
    }
    
    function getEventColor(type) {
        return (type === 'PICKUP') ? '#3699FF' : '#50CD89';
    }
    // --- Modal Functions End ---

    
//*============== drop-down Start ==============*//
    // --- Feature: Data Loading Functions (Firebase) ---
    async function loadOrdersIntoDropdown() {
        if (!eventOrderSelect) return;
        
        // 'window.allOrdersDemoData' ki jagah seedha Firebase se query karein
        
        eventOrderSelect.innerHTML = '<option value="">-- Select an Order --</option><option value="CUSTOM">-- Custom (No Order) --</option>';

        // Sirf PENDING ya READY orders hi laayein
        const q = query(collection(db, "orders"), 
                        where("status", "in", ["PENDING", "READY"]));
        
        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const order = { id: doc.id, ...doc.data() };
                const option = document.createElement('option');
                // Value mein poora data store karein (JSON format)
                option.value = JSON.stringify(order); 
                option.textContent = `${order.id.substring(0,6)} - ${order.customerName} (${order.status})`;
                eventOrderSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading orders into dropdown: ", error);
        }
    }
    
    async function loadRidersIntoDropdown(selectElement) {
        if (!selectElement) return;
        
        // Pehle se bhara hua data check karein (taaki baar-baar load na ho)
        if(selectElement.options.length > 2) return; 

        console.log("Loading riders from Firebase...");
        selectElement.innerHTML = '<option value="">-- Unassigned --</option>';
        
        try {
            const querySnapshot = await getDocs(collection(db, "riders"));
            querySnapshot.forEach((doc) => {
                const rider = { id: doc.id, ...doc.data() };
                const option = document.createElement('option');
                option.value = rider.id;
                option.textContent = rider.name;
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading riders into dropdown: ", error);
        }
    }
//*============== drop-down end ==============*//

    
//*============== Calander Start ==============*//
    // --- 4. CALENDAR INITIALIZATION ---
    function initCalendar() {
        if (!calendarEl) {
            console.warn("Calendar element not found. Skipping init.");
            return;
        }
        if (calendar) { // Agar pehle se bana hai toh dobara na banayein
            return;
        }

        console.log("Initializing Calendar...");
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek,dayGridDay'
            },
            editable: true,
            
            // --- Firebase Data Loading ---
            // 'events' array ki jagah 'events' function ka istemaal karein
            events: function(fetchInfo, successCallback, failureCallback) {
                
                const q = query(collection(db, "schedule"));
                
                // onSnapshot real-time listener hai
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    let events = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        
                        // Recurring event
                        if (data.daysOfWeek) {
                            events.push({
                                id: doc.id,
                                title: data.title,
                                daysOfWeek: data.daysOfWeek,
                                startTime: data.startTime,
                                endTime: data.endTime,
                                startRecur: data.startRecur,
                                endRecur: data.endRecur,
                                backgroundColor: data.backgroundColor,
                                borderColor: data.borderColor,
                                extendedProps: data.extendedProps
                            });
                        } 
                        // Normal event
                        else {
                            events.push({
                                id: doc.id,
                                title: data.title,
                                // Timestamp ko JS Date mein badlein
                                start: data.start.toDate(), 
                                allDay: data.allDay,
                                backgroundColor: data.backgroundColor,
                                borderColor: data.borderColor,
                                extendedProps: data.extendedProps
                            });
                        }
                    });
                    successCallback(events); // Calendar ko events dein
                }, (error) => {
                    console.error("Error fetching schedule: ", error);
                    failureCallback(error);
                });
                
                // Note: onSnapshot listener ko clean up karna production app mein zaroori hai
            },

            // Calendar par click karke naya event banana
            dateClick: (info) => openModalForCreate(info.dateStr),
            
            // Puraane event par click karke edit karna
            eventClick: (info) => openModalForEdit(info.event),
            
            // Event ko drag-drop karke update karna
            eventDrop: async (info) => { 
                try {
                    const eventRef = doc(db, "schedule", info.event.id);
                    await updateDoc(eventRef, {
                        start: info.event.start // Naya start time save karein
                    });
                    console.log("Event drop updated in Firebase!");
                } catch (error) {
                    console.error("Error updating event drop:", error);
                }
            }
        });
        
        calendar.render();
    }
//*============== Calander end ==============*//

    
    // --- 5. EVENT LISTENERS SETUP ---
    // (Modal buttons, Form submission, Route Optimization)
    // --- Event Listeners Start ---
    
    // Check karein ki zaroori elements maujood hain
    // YEH BADLAAV KIYA GAYA HAI
    if (!scheduleModal || !form || !openModalBtn || !closeModalBtn || !deleteBtn || !isRecurringCheckbox) {
         console.warn("schedule modal elements not found. Skipping listeners.");
         // return; // Abhi ke liye return ko comment kar rahe hain
    }

    // Modal buttons
    if(openModalBtn) openModalBtn.addEventListener('click', () => openModalForCreate(new Date().toISOString().split('T')[0]));
    
    // YEH BADLAAV KIYA GAYA HAI (BUG FIX)
    if (closeModalBtn) { // Check karein ki button hai
        closeModalBtn.addEventListener('click', closescheduleModal);
    }

    window.addEventListener('click', (e) => {
        // YEH BADLAAV KIYA GAYA HAI
        if (e.target == scheduleModal) closeModal();
    });

    // --- Feature: Recurring Checkbox Toggle ---
    if(isRecurringCheckbox) isRecurringCheckbox.addEventListener('change', () => {
        recurringOptionsDiv.style.display = isRecurringCheckbox.checked ? 'block' : 'none';
    });
    recurringDaysButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const day = btn.dataset.day;
            if (btn.classList.contains('active')) {
                selectedRecurringDays.push(day);
            } else {
                selectedRecurringDays = selectedRecurringDays.filter(d => d !== day);
            }
        });
    });

    // --- Form Submit (Save/Update) ---
    if(form) form.addEventListener('submit', async (e) => { // 'async' banaya
        e.preventDefault();
        
        const id = eventIdInput.value;
        const type = eventTypeInput.value;
        const date = eventDateInput.value;
        const time = eventTimeInput.value;
        
        // Rider
        const selectedRiderId = eventRiderSelect.value;
        const selectedRiderName = selectedRiderId ? eventRiderSelect.options[eventRiderSelect.selectedIndex].text : null;
        const riderPrefix = selectedRiderName ? `[${selectedRiderName}] ` : "[Unassigned] ";
        
        // Event data (default)
        let title = '';
        let extendedProps = {
            type: type,
            riderId: selectedRiderId,
            riderName: selectedRiderName
        };
        
        // Order
        const selectedOrderValue = eventOrderSelect.value;
        if (!selectedOrderValue) {
            alert('Please select an order or a custom task.');
            return;
        }

        if (selectedOrderValue === "CUSTOM") {
            title = prompt("Please enter a custom title for this event:", "Custom Task");
            if (!title) return; // Agar user ne cancel kiya
            extendedProps.customerName = "Custom";
        } else {
            // Parse order data jo JSON mein store kiya tha
            const order = JSON.parse(selectedOrderValue);
            const typeText = (type === 'PICKUP') ? 'Pickup' : 'Delivery';
            title = `${typeText} - ${order.customerName} (${order.id.substring(0,6)})`;
            
            // Rider App ke liye zaroori data save karein
            extendedProps.orderId = order.id;
            extendedProps.customerName = order.customerName;
            extendedProps.customerPhone = order.customerPhone; // Zaroori
            extendedProps.customerAddress = order.address; // Zaroori
        }

        if (id) { 
            // Edit Mode - Title ko update karein
            let oldTitle = eventTitleInput.value.replace(/^\[.*?\]\s*/, ""); // Puraana prefix hatao
            title = riderPrefix + oldTitle;
        } else {
            // Create Mode
            title = riderPrefix + title;
        }
        
        eventTitleInput.value = title; // Hidden input update karein

        // Naya event object banayein jo Firebase mein save hoga
        let newEventData = {
            id: id || doc(collection(db, "schedule")).id, // Nayi ID generate karein
            title: title,
            backgroundColor: getEventColor(type),
            borderColor: getEventColor(type),
          extendedProps: extendedProps
        };
        
        // --- Feature: Recurring Logic Save ---
        if (isRecurringCheckbox.checked) {
            if (selectedRecurringDays.length === 0) {
                alert('Please select at least one day for recurring event.');
                return;
            }
            newEventData.daysOfWeek = selectedRecurringDays;
            newEventData.startTime = time || '09:00:00'; // Default time
            newEventData.startRecur = date;
            if (recurringEndDateInput.value) {
                newEventData.endRecur = recurringEndDateInput.value;
            }
            
            extendedProps.isRecurring = true;
            extendedProps.recurringRule = {
                freq: 'WEEKLY',
                days: selectedRecurringDays,
                end: recurringEndDateInput.value || null
            };
        } else {
            // Normal event
            if (time) {
                // Firebase ke liye Timestamp mein convert karein
                newEventData.start = new Date(`${date}T${time}:00`); 
                newEventData.allDay = false;
            } else {
                newEventData.start = new Date(date);
                newEventData.allDay = true;
            }
        }
        // --- Recurring Logic End ---

        // --- Save to Firebase ---
        try {
            // 'setDoc' ka istemaal karein (Add/Edit dono ke liye)
            const eventRef = doc(db, "schedule", newEventData.id);
            await setDoc(eventRef, newEventData);
            
            console.log("Event saved to Firebase!");
            closescheduleModal();
            // Calendar 'onSnapshot' ke kaaran apne aap update ho jaayega
        } catch (error) {
            console.error("Error saving event:", error);
            alert("Failed to save event.");
        }
    });
    
    // --- Delete Button ---
    if(deleteBtn) deleteBtn.addEventListener('click', async () => { // 'async' banaya
        const id = eventIdInput.value;
        if (id && confirm('Are you sure you want to delete this entry?')) {
            try {
                await deleteDoc(doc(db, "schedule", id));
              console.log("Event deleted from Firebase!");
              closescheduleModal();
                // Calendar 'onSnapshot' ke kaaran apne aap update ho jaayega
            } catch (error) {
                console.error("Error deleting event:", error);
              alert('Failed to delete event.');
            }
        }
    });

    // --- Feature: Route Optimization Button ---
    if (optimizeRouteBtn) {
        optimizeRouteBtn.addEventListener('click', async () => {
            const riderId = routeRiderSelect.value;
            if (!riderId) {
                alert('Please select a rider to optimize.');
                return;
           }
            
            // --- Naya Firebase Query Logic ---
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Aaj subah 12 baje
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1); // Kal subah 12 baje
           const todayDayOfWeek = String(today.getDay()); // Aaj ka din

            // 1. Aaj ke normal tasks dhoondein
            const q1 = query(collection(db, "schedule"),
                where("extendedProps.riderId", "==", riderId),
                where("start", ">=", today),
                where("start", "<", tomorrow)
            );
            
            // 2. Aaj ke recurring tasks dhoondein
            const q2 = query(collection(db, "schedule"),
                where("extendedProps.riderId", "==", riderId),
                where("daysOfWeek", "array-contains", todayDayOfWeek)
            );
            
            try {
                const [normalTasksSnapshot, recurringTasksSnapshot] = await Promise.all([
                    getDocs(q1),
                    getDocs(q2)
                ]);

                let tasksForToday = [];
                normalTasksSnapshot.forEach(doc => tasksForToday.push(doc.data()));
                recurringTasksSnapshot.forEach(doc => tasksForToday.push(doc.data()));

                if (tasksForToday.length === 0) {
                    alert('No tasks found for this rider today.');
                    return;
                }
                
                // Address waale tasks filter karein
                const addresses = tasksForToday
                    .map(task => task.extendedProps.customerAddress)
                    .filter(addr => addr); // Sirf woh task jinka address hai

                if (addresses.length === 0) {
                    alert('No tasks with valid addresses found for today.');
              return;
                }

                // Google Maps URL banayein
                let mapsUrl = `https://www.google.com/maps/dir/`;
                mapsUrl += `${encodeURIComponent(YOUR_SHOP_ADDRESS)}/`; // Origin
              mapsUrl += addresses.map(addr => encodeURIComponent(addr)).join('/');
                mapsUrl += `/${encodeURIComponent(YOUR_SHOP_ADDRESS)}`; // Waapis shop par
                
                console.log("Opening Maps URL:", mapsUrl);
               window.open(mapsUrl, '_blank');
                
            } catch (error) {
                console.error("Error optimizing route: ", error);
                alert('Could not get tasks for optimization.');
            }
        });
    }
    // --- Event Listeners End ---

    
    // --- 6. LAZY LOAD INIT ---
    // Calendar ko tabhi load karein jab user 'schedule' link par click kare.
    const scheduleLink = document.querySelector('a[data-page="page-schedule"]');
    if (scheduleLink) {
        scheduleLink.addEventListener('click', () => {
            if (!calendar) {
                setTimeout(() => {
                    initCalendar();
                    // Dono rider dropdowns ko load karein
                    loadRidersIntoDropdown(eventRiderSelect);
                    loadRidersIntoDropdown(routeRiderSelect);
               }, 10);
            }
        }, { once: true }); // Yeh event sirf ek baar chalega
   }
    
    // Safety check: Agar user seedha schedule page par land hota hai
    setTimeout(() => {
        // Yahaan 'staffPage' ki jagah 'schedulePage' hona chahiye
      const schedulePage = document.getElementById('page-schedule');
        if (schedulePage && schedulePage.style.display !== 'none' && !calendar) {
             initCalendar();
             loadRidersIntoDropdown(eventRiderSelect);
             loadRidersIntoDropdown(routeRiderSelect);
        }
    }, 500);
//*==========================================*//
//*============== Schedule End =================*//
//*===========================================*//

//*==========================================*//
//*============== Cash Register Start =========*//
//*===========================================*//
    // --- 1. DOM ELEMENTS ---
    const summaryOpeningEl = document.getElementById('summary-opening');
    const summaryCashInEl = document.getElementById('summary-cash-in');
    const summaryCashOutEl = document.getElementById('summary-cash-out');
    const summaryClosingEl = document.getElementById('summary-closing');
    const cashLogBody = document.getElementById('cash-log-body');

    // Modals
    const openingModal = document.getElementById('opening-balance-modal');
    const cashInModal = document.getElementById('cash-in-modal');
    const cashOutModal = document.getElementById('cash-out-modal');
    
    // Modal Buttons
    const openOpeningBtn = document.getElementById('set-opening-balance-btn');
    const openCashInBtn = document.getElementById('add-cash-in-btn');
    const openCashOutBtn = document.getElementById('add-cash-out-btn');
    const closeModalBtns = document.querySelectorAll('.modal .close-btn');

    // Forms
    const openingForm = document.getElementById('opening-balance-form');
    const cashInForm = document.getElementById('cash-in-form');
    const cashOutForm = document.getElementById('cash-out-form');

    // --- 2. STATE (Demo Data) ---
    // Production mein yeh Firebase se aayega
    let cashLog = []; 
    // Example: { time: '10:30 AM', type: 'In', amount: 150.00, notes: 'Order INV-001' }

    // --- 3. MODAL HELPER FUNCTIONS ---
    function CashRegisteropenModal(modal) {
        if (modal) modal.style.display = 'block';
    }
    function closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }

    // --- 4. EVENT LISTENERS (Buttons) ---
    if (openOpeningBtn) openOpeningBtn.addEventListener('click', () => CashRegisteropenModal(openingModal));
    if (openCashInBtn) openCashInBtn.addEventListener('click', () => CashRegisteropenModal(cashInModal));
    if (openCashOutBtn) openCashOutBtn.addEventListener('click', () => CashRegisteropenModal(cashOutModal));

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            closeModal(document.getElementById(modalId));
        });
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target == openingModal) closeModal(openingModal);
        if (e.target == cashInModal) closeModal(cashInModal);
        if (e.target == cashOutModal) closeModal(cashOutModal);
    });

    // --- 5. EVENT LISTENERS (Forms) ---
    if (openingForm) {
        openingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('form-opening-amount').value);
            if (isNaN(amount)) return;
            
            // Check if opening balance already set
            const existing = cashLog.find(log => log.type === 'Opening');
            if (existing) {
                alert('Opening balance is already set. You can add more cash using "Add Cash In".');
                return;
            }

            addTransaction('Opening', amount, 'Opening Balance');
            closeModal(openingModal);
            openingForm.reset();
        });
    }

    if (cashInForm) {
        cashInForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('form-cash-in-amount').value);
            const notes = document.getElementById('form-cash-in-notes').value;
            if (isNaN(amount) || amount <= 0) return;

            addTransaction('In', amount, notes);
            closeModal(cashInModal);
            cashInForm.reset();
        });
    }
    
    if (cashOutForm) {
        cashOutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('form-cash-out-amount').value);
            const notes = document.getElementById('form-cash-out-notes').value;
            if (isNaN(amount) || amount <= 0) return;

            addTransaction('Out', amount, notes);
            closeModal(cashOutModal);
            cashOutForm.reset();
        });
    }
    
    // --- 6. CORE LOGIC ---
    function addTransaction(type, amount, notes) {
        const transaction = {
            id: `txn_${Date.now()}`,
            time: new Date(),
            type: type, // 'Opening', 'In', 'Out'
            amount: amount,
            notes: notes || 'N/A'
        };

        /* * =============================================
        * FIREBASE CODE (SAVE TRANSACTION)
        * =============================================
        * const today = new Date().toISOString().split('T')[0]; // '2025-10-22'
        * const logRef = doc(db, 'cashRegister', today, 'logs', transaction.id);
        * setDoc(logRef, transaction).then(() => {
        * console.log('Transaction saved');
        * }).catch(e => console.error(e));
        */

        // Demo logic: Add to local array
        cashLog.push(transaction);
        
        // Update UI
        updateUI();
    }
    
    function updateUI() {
        renderCashLog();
        updateSummary();
    }
    
    function renderCashLog() {
        if (!cashLogBody) return;
        cashLogBody.innerHTML = ''; // Clear table
        
        // Sort by time
        const sortedLog = cashLog.sort((a, b) => a.time - b.time);

        if (sortedLog.length === 0) {
            cashLogBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No transactions for today.</td></tr>';
            return;
        }

        sortedLog.forEach(log => {
            const row = document.createElement('tr');
            
            // Format time (e.g., 07:45 AM)
            const timeString = log.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            let amountCell = '';
            if (log.type === 'In' || log.type === 'Opening') {
                amountCell = `<td style="color: var(--success-green); font-weight: 500;">+ ₹${log.amount.toFixed(2)}</td>`;
            } else if (log.type === 'Out') {
                amountCell = `<td style="color: var(--primary-red); font-weight: 500;">- ₹${log.amount.toFixed(2)}</td>`;
            }

            row.innerHTML = `
                <td>${timeString}</td>
                <td>${log.type}</td>
                ${amountCell}
                <td>${log.notes}</td>
            `;
            cashLogBody.appendChild(row);
        });
    }

    function updateSummary() {
        if (!summaryOpeningEl) return;

        let opening = 0;
        let cashIn = 0;
        let cashOut = 0;

        cashLog.forEach(log => {
            if (log.type === 'Opening') {
                opening += log.amount;
            } else if (log.type === 'In') {
                cashIn += log.amount;
            } else if (log.type === 'Out') {
                cashOut += log.amount;
            }
        });

        const closing = (opening + cashIn) - cashOut;

        summaryOpeningEl.textContent = `₹${opening.toFixed(2)}`;
        summaryCashInEl.textContent = `₹${cashIn.toFixed(2)}`;
        summaryCashOutEl.textContent = `₹${cashOut.toFixed(2)}`;
        summaryClosingEl.textContent = `₹${closing.toFixed(2)}`;
    }

    // --- 7. INITIALIZATION ---
    function initCashRegister() {
        /*
        * =============================================
        * FIREBASE CODE (LOAD TODAY'S LOGS)
        * =============================================
        * const today = new Date().toISOString().split('T')[0];
        * const logsCol = collection(db, 'cashRegister', today, 'logs');
        * const q = query(logsCol, orderBy('time', 'asc'));
        * * onSnapshot(q, (snapshot) => {
        * cashLog = []; // Clear local array
        * snapshot.forEach(doc => {
        * const data = doc.data();
        * // Convert Firebase Timestamp back to JS Date
        * data.time = data.time.toDate(); 
        * cashLog.push(data);
        * });
        * updateUI(); // Update UI with Firebase data
        * });
        */
        
        // Demo logic: Just update UI with empty array
        updateUI();
    }

    // Run when the app loads
    initCashRegister();
//*==========================================*//
//*============== Cash Register End ============*//
//*==========================================*//

//*==========================================*//
//*============== Coustomer Start ==================*//
//*===========================================*//
 // --- 1. DOM ELEMENTS ---
    
    // YEH BADLAAV KIYA GAYA HAI
    const customersTableBody = document.getElementById('customers-list-body');
    const customerSearchInput = document.getElementById('customer-search');
    const customerModal = document.getElementById('customer-modal');

    const customerModalTitle = document.getElementById('modal-title');
    const addCustomerBtn = document.getElementById('add-customer-btn');
    const customerModalCloseBtn = document.getElementById('modal-close-btn');
    const customerForm = document.getElementById('customer-form');
    
    // --- 2. MODAL FUNCTIONS ---
    function openModal(mode = 'add', customer = null) {
        if (mode === 'add') {
            customerModalTitle.textContent = 'Add New Customer';
            customerForm.reset();
            document.getElementById('customer-id').value = '';
        } else if (mode === 'edit' && customer) {
            customerModalTitle.textContent = 'Edit Customer';
            document.getElementById('customer-id').value = customer.id;
            document.getElementById('form-customer-name').value = customer.name;
            document.getElementById('form-customer-phone').value = customer.phone;
            document.getElementById('form-customer-address').value = customer.address || '';
        }
        // YEH BADLAAV KIYA GAYA HAI
        customerModal.style.display = 'block';
    }

    function closeCustomerModal(){
        // YEH BADLAAV KIYA GAYA HAI
        customerModal.style.display = 'none';
    }

    // --- 3. MODAL EVENTS ---
    addCustomerBtn.addEventListener('click', () => openModal('add'));
    if (customerModalCloseBtn) { // Check karein ki button hai
    customerModalCloseBtn.addEventListener('click', closeCustomerModal);
}
    window.addEventListener('click', (e) => {
        // YEH BADLAAV KIYA GAYA HAI
        if (e.target == customerModal) {
            closeCustomerModal();
        }
    });

    // --- 4. LOAD CUSTOMERS (FROM FIREBASE) ---
    function loadCustomers() {
        console.log("Loading customers...");
        // YEH BADLAAV KIYA GAYA HAI
        customersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading customers...</td></tr>';
        
        /*
        * =============================================
        * FIREBASE CODE (LOAD CUSTOMERS)
        * =============================================
        *
        * const customersQuery = query(collection(db, 'customers'), orderBy('name'));
        * * getDocs(customersQuery).then(snapshot => {
        * if (snapshot.empty) {
        * customersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No customers found.</td></tr>';
        * return;
        * }
        * * customersTableBody.innerHTML = ''; // Clear loader
        * snapshot.forEach(doc => {
        * const customer = { id: doc.id, ...doc.data() };
        * renderCustomerRow(customer);
        * });
        * });
        */
        
        // --- डेमो डेटा (Firebase के बिना) ---
        // YEH BADLAAV KIYA GAYA HAI
        customersTableBody.innerHTML = ''; // Clear loader
        const demoData = [
            { id: 'c1', name: 'Sarthak Kumar', phone: '9876543210', totalOrders: 5, address: '123 ABC St' },
            { id: 'c2', name: 'Neha Singh', phone: '9876543211', totalOrders: 2, address: '456 XYZ Rd' },
            { id: 'c3', name: 'Rohan Verma', phone: '9876543212', totalOrders: 8, address: '789 LMN Ave' }
        ];
        demoData.forEach(renderCustomerRow);
    }
    
    // Helper function to render a row
    function renderCustomerRow(customer) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.phone}</td>
            <td>${customer.totalOrders || 0}</td>
            <td>
                <button class="btn btn-secondary btn-edit" style="padding: 5px 10px;">Edit</button>
            </td>
        `;
        // Add edit button functionality
        row.querySelector('.btn-edit').addEventListener('click', () => {
            openModal('edit', customer);
        });
        // YEH BADLAAV KIYA GAYA HAI
        customersTableBody.appendChild(row);
    }

    // --- 5. SAVE CUSTOMER (FORM SUBMIT) ---
    customerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const customerData = {
            name: document.getElementById('form-customer-name').value,
            phone: document.getElementById('form-customer-phone').value,
            address: document.getElementById('form-customer-address').value,
        };
        const customerId = document.getElementById('customer-id').value;

        if (customerId) {
            // --- UPDATE EXISTING CUSTOMER ---
            console.log("Updating customer (Send to Firebase):", customerId, customerData);
            /*
            * =============================================
            * FIREBASE CODE (UPDATE CUSTOMER)
            * =============================================
            * const customerRef = doc(db, 'customers', customerId);
            * updateDoc(customerRef, customerData).then(() => {
            * alert("Customer updated successfully!");
            * closeCustomerModal();
            * loadCustomers(); // Refresh list
            * }).catch(e => console.error("Error updating: ", e));
            */
            
        } else {
            // --- ADD NEW CUSTOMER ---
            console.log("Adding new customer (Send to Firebase):", customerData);
            /*
            * =============================================
            * FIREBASE CODE (ADD CUSTOMER)
            * =============================================
            * // Add `createdAt` and `totalOrders: 0`
            * const dataToSave = { ...customerData, totalOrders: 0, createdAt: serverTimestamp() };
            * addDoc(collection(db, 'customers'), dataToSave).then(() => {
            * alert("Customer added successfully!");
            * closeCustomerModal();
            * loadCustomers(); // Refresh list
            * }).catch(e => console.error("Error adding: ", e));
            */
        }
        
        // --- Demo (Firebase के बिना) ---
        alert("Customer saved successfully! (Demo)");
        closeCustomerModal();
        // (In a real app, you would reload the list)
    });
    
    // --- 6. SEARCH (Simple JS filter) ---
    // YEH BADLAAV KIYA GAYA HAI
    customerSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        // YEH BADLAAV KIYA GAYA HAI
        const rows = customersTableBody.getElementsByTagName('tr');
        for (let row of rows) {
            const rowText = row.textContent.toLowerCase();
            if (rowText.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });

    // --- INIT ---
    loadCustomers();
//*==========================================*//
//*============== Coustomer End ==================*//
//*===========================================*//

//*==========================================*//
//*============== Staff Management Start ======*//
//*===========================================*//
// --- 1. DOM ELEMENTS ---
const staffPage = document.getElementById('page-staff'); // Check karne ke liye ki hum staff page par hain
const staffListBody = document.getElementById('staff-list-body');
const openStaffModalBtn = document.getElementById('add-staff-btn');
const staffModal = document.getElementById('staff-modal');
const staffModalTitle = document.getElementById('staff-modal-title');
const closeStaffModalBtn = staffModal ? staffModal.querySelector('.close-btn[data-modal="staff-modal"]') : null;
const staffForm = document.getElementById('staff-form');
const staffIdInput = document.getElementById('staff-id');
const staffNameInput = document.getElementById('staff-name');

// --- 2. HELPER FUNCTIONS ---
function openStaffModal(mode = 'add', rider = null) {
    if (!staffModal) return;
    staffForm.reset();
    staffIdInput.value = ''; // Clear ID

    if (mode === 'add') {
        staffModalTitle.textContent = 'Add New Rider';
    } else if (mode === 'edit' && rider) {
        staffModalTitle.textContent = 'Edit Rider';
        staffIdInput.value = rider.id;
        staffNameInput.value = rider.name;
    }
    staffModal.style.display = 'block';
}

function closeStaffModal() {
    if (staffModal) staffModal.style.display = 'none';
}

// --- 3. LOAD & RENDER STAFF LIST ---
function loadStaffList() {
    if (!staffListBody) return;
    
    // 'riders' collection ko sunein
    const q = query(collection(db, "riders"), orderBy("name")); // Naam se sort karein
    
    onSnapshot(q, (snapshot) => {
        staffListBody.innerHTML = ''; // List khaali karein
        
        if (snapshot.empty) {
            staffListBody.innerHTML = '<tr><td colspan="2" style="text-align: center;">No riders added yet.</td></tr>';
            return;
        }

        snapshot.forEach(doc => {
            const rider = { id: doc.id, ...doc.data() };
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${rider.name}</td>
                <td style="display: flex; gap: 10px;">
                    <button class="btn btn-secondary btn-edit-staff" data-id="${rider.id}" style="padding: 5px 10px;">
                        <i class="fa-solid fa-pencil"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-delete-staff" data-id="${rider.id}" data-name="${rider.name}" style="padding: 5px 10px; background-color: var(--danger-red); color: white;">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </td>
            `;
            staffListBody.appendChild(row);
        });
    });
}

// --- 4. SAVE/UPDATE STAFF ---
async function handleStaffFormSubmit(e) {
    e.preventDefault();
    if (!staffNameInput.value) return;

    const riderId = staffIdInput.value;
    const riderName = staffNameInput.value;
    
    // Data object banayein
    const riderData = {
        name: riderName
        // Yahaan phone number etc. bhi add kar sakte hain
    };

    try {
        let docRef;
        if (riderId) {
            // EDIT MODE: Puraane document ko update karein
            docRef = doc(db, "riders", riderId);
            await updateDoc(docRef, riderData);
            alert('Rider updated successfully!');
        } else {
            // ADD MODE: Naya document banayein (Firebase ID apne aap banayega)
            docRef = await addDoc(collection(db, "riders"), riderData);
            alert('Rider added successfully!');
        }
        closeStaffModal();
    } catch (error) {
        console.error("Error saving rider: ", error);
        alert('Failed to save rider.');
    }
}

// --- 5. DELETE STAFF ---
async function handleDeleteStaff(riderId, riderName) {
    if (!riderId || !riderName) return;
    
    if (confirm(`Are you sure you want to delete rider "${riderName}"?`)) {
        try {
            await deleteDoc(doc(db, "riders", riderId));
            alert('Rider deleted successfully!');
            // List apne aap update ho jaayegi (onSnapshot ke kaaran)
        } catch (error) {
            console.error("Error deleting rider: ", error);
            alert('Failed to delete rider.');
        }
    }
}


// --- 6. EVENT LISTENERS SETUP ---
function setupStaffEventListeners() {
    if (!staffPage) return; // Agar staff page nahin hai toh setup na karein

    // Modal buttons
    if (openStaffModalBtn) {
        openStaffModalBtn.addEventListener('click', () => openStaffModal('add'));
    }
    if (closeStaffModalBtn) {
        closeStaffModalBtn.addEventListener('click', closeStaffModal);
    }
    window.addEventListener('click', (e) => {
        if (e.target == staffModal) closeStaffModal();
    });

    // Form submit
    if (staffForm) {
        staffForm.addEventListener('submit', handleStaffFormSubmit);
    }

    // Edit/Delete buttons (Event Delegation)
    if (staffListBody) {
        staffListBody.addEventListener('click', (e) => {
            const editButton = e.target.closest('.btn-edit-staff');
            const deleteButton = e.target.closest('.btn-delete-staff');

            if (editButton) {
                const riderId = editButton.dataset.id;
                // Rider ka data Firebase se fetch karna hoga (ya onSnapshot waale data se)
                // Abhi ke liye, hum sirf ID aur naam pass kar rahe hain (agar list se mil jaaye)
                const riderName = editButton.closest('tr').querySelector('td').textContent; // Simple tareeka
                openStaffModal('edit', { id: riderId, name: riderName });
            } 
            else if (deleteButton) {
                const riderId = deleteButton.dataset.id;
                const riderName = deleteButton.dataset.name;
                handleDeleteStaff(riderId, riderName);
            }
        });
    }
}


// --- 7. INITIALIZATION (Load only when Staff page is active) ---
const staffLink = document.querySelector('a[data-page="page-staff"]');
if (staffLink) {
    staffLink.addEventListener('click', () => {
        // Staff page par aate hi list load karein
        // Pehle listeners setup karein, phir data load karein
        setupStaffEventListeners(); 
        loadStaffList();
    });
}

// Safety check agar user seedha Staff page par land hota hai
setTimeout(() => {
    if (staffPage && staffPage.style.display !== 'none') {
        setupStaffEventListeners();
        loadStaffList();
    }
}, 500); // Thoda delay

//*==========================================*//
//*============== Staff Management End ========*//
//*===========================================*//