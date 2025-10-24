// js/pages/orders.js

import {
    db, doc, getDoc, updateDoc, collection,
    query, orderBy, onSnapshot,
    where  // <-- YEH ADD KAREIN
} from '../firebase-config.js';

// Auth ko import karein
import { auth, onAuthStateChanged } from '../firebase-config.js'; // <-- YEH ADD KAREIN

export function initOrdersPage() {

    // Guard Clause
    const page = document.getElementById('page-orders');
    if (!page) return;

    // --- 1. DOM ELEMENTS ---
    const ordersTableBody = document.getElementById('orders-list-body');
    const orderSearchInput = document.getElementById('order-search');

    // Order Details Modal elements
    const orderModal = document.getElementById('order-details-modal');
    const orderModalCloseBtn = orderModal ? orderModal.querySelector('.close-btn[data-modal="order-details-modal"]') : null;
    const printBtn = document.getElementById('print-order-tag-btn');

    // --- 2. STATE ---
    let currentViewingOrderId = null;
    let allUserOrders = []; // Naya array, user ke saare orders store karne ke liye
    let unsubscribeOrders = null; // Listener ko band karne ke liye

    // --- 3. RENDER FUNCTION (Naya function) ---
    // Yeh function 'allUserOrders' array se table banata hai
    function renderOrdersTable(searchTerm = "") {
        if (!ordersTableBody) return;

        const lowerSearchTerm = searchTerm.toLowerCase();
        let matchingOrders = [];

        // Client-side search (database call nahi)
        if (lowerSearchTerm) {
            matchingOrders = allUserOrders.filter(order => {
                const orderDate = order.createdAt ? order.createdAt.toDate().toLocaleDateString() : 'N/A';
                const searchText = (order.id + order.customerName + order.customerPhone + orderDate).toLowerCase();
                return searchText.includes(lowerSearchTerm);
            });
        } else {
            matchingOrders = allUserOrders; // Koi search nahi, sab dikhao
        }

        // Table render karein
        if (matchingOrders.length === 0) {
            if (allUserOrders.length === 0) {
                ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No orders found for you.</td></tr>';
            } else {
                ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No orders match your search.</td></tr>';
            }
            return;
        }

        ordersTableBody.innerHTML = ''; // Clear table
        matchingOrders.forEach(order => {
            const orderDate = order.createdAt ? order.createdAt.toDate().toLocaleDateString() : 'N/A';
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
    }


    // --- 4. CORE FUNCTION: LISTEN FOR ORDERS (Updated) ---
    // Yeh function ab sirf data fetch karta hai aur listener set karta hai
    function startOrderListener(userId) {
        if (!ordersTableBody) return;
        ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading your orders...</td></tr>';

        // **YEH HAI ASLI FIX**
        const q = query(
            collection(db, "orders"),
            where("userId", "==", userId), // <-- Filter lagaya
            orderBy("createdAt", "desc")
        );

        // Purana listener (agar hai) toh band karein
        if (unsubscribeOrders) {
            unsubscribeOrders();
        }

        // Naya listener attach karein
        unsubscribeOrders = onSnapshot(q, (snapshot) => {
            allUserOrders = []; // State ko reset karein
            snapshot.forEach(doc => {
                allUserOrders.push({ id: doc.id, ...doc.data() });
            });

            // Ab table ko render karein
            const currentSearch = orderSearchInput ? orderSearchInput.value : "";
            renderOrdersTable(currentSearch);

        }, (error) => {
            console.error("Error listening to orders: ", error);
            ordersTableBody.innerHTML = '<tr><td colspan="6" style="color: red;">Error loading orders. Console check karein (Index zaroori hai).</td></tr>';
            // **YAAD RAKHEIN: Is query ke liye COMPOSITE INDEX zaroori hai**
        });
    }

    // --- 5. CORE FUNCTION: RENDER ORDER DETAILS MODAL ---
    // (Ismein koi change nahi, yeh Security Rules se protected rahega)
    async function renderOrderDetails(orderId) {
        if (!orderModal) return;
        currentViewingOrderId = orderId; // Save ID for print button

        try {
            const orderRef = doc(db, "orders", orderId);
            const docSnap = await getDoc(orderRef);

            if (!docSnap.exists()) {
                alert("Error: Order not found.");
                return;
            }
            const order = { id: docSnap.id, ...docSnap.data() };
            
            // **SECURITY CHECK (Optional client-side)**
            // Iski zaroorat nahi agar Security Rules set hain
            /*
            if (order.userId !== auth.currentUser.uid) {
                 alert("You do not have permission to view this order.");
                 return;
            }
            */

            // ... (Aapka baaki ka modal render logic yahan) ...
            // Fill simple info
            const orderDate = order.createdAt ? order.createdAt.toDate().toLocaleString() : 'N/A';
            document.getElementById('modal-order-id').textContent = order.id.substring(0, 6).toUpperCase();
            document.getElementById('modal-order-date').textContent = orderDate;
            // ... (Baaki sab same) ...

            // Fill items table
            const itemsListEl = document.getElementById('modal-items-list');
            itemsListEl.innerHTML = '';
            order.items.forEach(item => {
                const itemTotal = (item.price * item.qty).toFixed(2);
                itemsListEl.innerHTML += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.qty}</td>
                        <td class="item-price">₹${item.price.toFixed(2)}</td>
                        <td class="item-price">₹${itemTotal}</td>
                    </tr>
                `;
            });
            // ... (Baaki sab same) ...
            
            // Fill customer info
            document.getElementById('modal-customer-name').textContent = order.customerName || 'N/A';
            document.getElementById('modal-customer-phone').textContent = order.customerPhone || 'N/A';
            document.getElementById('modal-customer-address').textContent = order.address || 'N/A'; 
            
            // Fill order info
            const totalItems = order.items ? order.items.reduce((sum, item) => sum + (item.qty || 0), 0) : 0;
            document.getElementById('modal-order-total-items').textContent = totalItems;
            
            const paymentEl = document.getElementById('modal-order-payment');
            paymentEl.textContent = order.paymentStatus || 'UNPAID';
            paymentEl.style.color = (order.paymentStatus === 'PAID') ? 'var(--success-green)' : 'var(--primary-red)';

            // Fill summary
            document.getElementById('modal-summary-subtotal').textContent = `₹${order.subtotal.toFixed(2)}`;
            document.getElementById('modal-summary-discount').textContent = `₹0.00`; // Placeholder
            document.getElementById('modal-summary-total').textContent = `₹${order.total.toFixed(2)}`;

            // Fill status and buttons
            const statusBadge = document.getElementById('modal-order-status');
            statusBadge.className = `status-badge ${order.status.toLowerCase()}`;
            statusBadge.textContent = order.status;

            const statusButtonsEl = document.getElementById('modal-status-buttons');
            statusButtonsEl.innerHTML = '';
            
            const statusFlow = {
                'PENDING': ['PROCESSING', 'READY'],
                'PROCESSING': ['READY', 'DELIVERED'],
                'READY': ['DELIVERED'],
                'DELIVERED': []
            };

            if (statusFlow[order.status]) {
                statusFlow[order.status].forEach(nextStatus => {
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-primary';
                    if (nextStatus === 'DELIVERED') {
                        btn.style.backgroundColor = 'var(--success-green)';
                    }
                    btn.textContent = `Mark as ${nextStatus}`;
                    btn.onclick = () => updateStatus(orderId, nextStatus);
                    statusButtonsEl.appendChild(btn);
                });
            }

            orderModal.style.display = 'block';

        } catch (error) {
            console.error("Error fetching order details:", error);
            alert("Could not load order details. (Maybe permission denied)");
        }
    }

    // --- 6. LOGIC: UPDATE STATUS ---
    // (Ismein koi change nahi, yeh Security Rules se protected rahega)
    async function updateStatus(orderId, newStatus) {
        console.log(`Updating ${orderId} to ${newStatus}`);

        const orderRef = doc(db, "orders", orderId);
        try {
            await updateDoc(orderRef, {
                status: newStatus
            });
            // Data will update automatically via onSnapshot
            if (orderModal) orderModal.style.display = 'none'; // Close modal
        } catch (error) {
            console.error("Error updating status: ", error);
            alert("Failed to update status. (Maybe permission denied)");
        }
    }

    // --- 7. FEATURE: PRINT GARMENT TAG ---
    // (Ismein koi change nahi)
    function printOrderTag(orderId) {
        alert("Print feature coming soon! Order ID: " + orderId);
    }

    // --- 8. EVENT LISTENERS SETUP (Updated) ---
    function setupOrderEventListeners() {
        if (!ordersTableBody || !orderSearchInput || !orderModal || !orderModalCloseBtn || !printBtn) {
            console.warn("Order management elements not found. Skipping listeners.");
            return;
        }

        // Search (Updated)
        // Yeh ab sirf client-side render function ko call karta hai, database ko nahi
        orderSearchInput.addEventListener('input', (e) => {
            renderOrdersTable(e.target.value);
        });

        // "View" button click (Event Delegation)
        ordersTableBody.addEventListener('click', (e) => {
            const viewButton = e.target.closest('.btn-view-order');
            if (viewButton) {
                const orderId = viewButton.getAttribute('data-id');
                renderOrderDetails(orderId);
            }
        });

        // Modal Close (X) button
        if (orderModalCloseBtn) {
            orderModalCloseBtn.addEventListener('click', () => {
                orderModal.style.display = 'none';
            });
        }

        // Modal outside click
        window.addEventListener('click', (e) => {
            if (e.target == orderModal) {
                orderModal.style.display = 'none';
            }
        });

        // Print Button Click
        printBtn.addEventListener('click', () => {
            if (currentViewingOrderId) {
                printOrderTag(currentViewingOrderId);
            } else {
                alert('Error: Could not find order to print.');
            }
        });
    }

    // --- INIT (Updated) ---
    // Saare logic ko 'onAuthStateChanged' ke andar daalein
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User login hai
            console.log("Orders page initialized for user:", user.uid);
            allUserOrders = []; // Purana data saaf karein
            if (orderSearchInput) orderSearchInput.disabled = false;
            startOrderListener(user.uid); // Listener chalu karein
        } else {
            // User login nahi hai
            console.log("User logged out, clearing orders page.");
            if (unsubscribeOrders) {
                unsubscribeOrders(); // Listener band karein
                unsubscribeOrders = null;
            }
            allUserOrders = []; // State saaf karein
            if (ordersTableBody) {
                ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Please log in to see your orders.</td></tr>';
            }
            if (orderModal) {
                orderModal.style.display = 'none'; // Modal band karein
            }
            if (orderSearchInput) {
                orderSearchInput.value = '';
                orderSearchInput.disabled = true; // Search disable karein
            }
        }
    });

    // Event listeners ek baar set karein
    setupOrderEventListeners();
}
