// js/pages/orders.js

// Firebase config se zaroori cheezein import karein
import {
    db, doc, getDoc, updateDoc, collection,
    query, where, // <-- where zaroor import karein (agar nahi hai)
    orderBy, onSnapshot
} from '../firebase-config.js'; // <-- Path check karein (../)

// Firebase Auth ko import karein
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

    let currentViewingOrderId = null;

    // --- 2. CORE FUNCTION: LOAD & RENDER ORDERS (Updated) ---
    function loadOrders(searchTerm = "") {
        if (!ordersTableBody) return;
        ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading orders...</td></tr>';

        // Pehle current user ka pata lagayein
        onAuthStateChanged(auth, (user) => { // <-- Wrapper add hua
            if (user) {
                const currentUserId = user.uid; // <-- User ID li gayi
                console.log("Loading orders for user:", currentUserId);

                // --- QUERY BADLA GAYA HAI ---
                const q = query(
                    collection(db, "orders"),
                    where("userId", "==", currentUserId), // <-- SIRF USER KE ORDERS LAAYEIN
                    orderBy("createdAt", "desc")
                );
                // --- QUERY END ---

                // onSnapshot listener ab wrapper ke andar hai
                const unsubscribe = onSnapshot(q, (snapshot) => { // <-- 'unsubscribe' variable add karna achha hai
                    if (snapshot.empty) {
                        ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No orders found for you.</td></tr>';
                        return;
                    }

                    ordersTableBody.innerHTML = ''; // Clear table
                    snapshot.forEach(doc => {
                        const order = { id: doc.id, ...doc.data() };

                        const orderDate = order.createdAt ? order.createdAt.toDate().toLocaleDateString() : 'N/A';
                        const searchText = (order.id + (order.customerName || '') + (order.customerPhone || '') + orderDate).toLowerCase(); // Handle missing fields

                        if (searchTerm && !searchText.includes(searchTerm)) {
                            return; // Skip if not matching search
                        }

                        const row = document.createElement('tr');
                        // Ensure price exists and is a number
                        const displayTotal = (typeof order.total === 'number') ? order.total.toFixed(2) : '0.00';
                        row.innerHTML = `
                            <td>${order.id.substring(0, 6).toUpperCase()}</td>
                            <td>
                                <div>${order.customerName || 'N/A'}</div>
                                <small>${order.customerPhone || 'N/A'}</small>
                            </td>
                            <td>${orderDate}</td>
                            <td>$${displayTotal}</td>
                            <td><span class="status-badge ${order.status ? order.status.toLowerCase() : 'pending'}">${order.status || 'PENDING'}</span></td>
                            <td>
                                <button class="btn btn-secondary btn-view-order" data-id="${order.id}" style="padding: 5px 10px;">
                                    <i class="fa-solid fa-eye"></i> View
                                </button>
                            </td>
                        `;
                        ordersTableBody.appendChild(row);
                    }); // forEach end
                }, (error) => { // <-- Error handling for onSnapshot
                     console.error("Error fetching orders in real-time:", error);
                     ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error loading orders.</td></tr>';
                }); // onSnapshot end

                // Optional: Store the unsubscribe function if you need to stop listening later
                // page.dataset.unsubscribeOrders = unsubscribe;

            } else {
                // User logged out state
                ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Please log in to view orders.</td></tr>';
                console.error("Cannot load orders: User not logged in.");
                 // Optional: If there was a previous listener, stop it
                 // const stopListening = page.dataset.unsubscribeOrders;
                 // if (stopListening) stopListening();
            }
        }); // onAuthStateChanged end
    }
    // --- LOAD ORDERS FUNCTION END ---

    // --- 4. CORE FUNCTION: RENDER ORDER DETAILS MODAL ---
    // (Is function mein koi badlav nahi, lekin isse call karne se pehle user check ho chuka hoga)
    async function renderOrderDetails(orderId) {
        if (!orderModal) return;
        currentViewingOrderId = orderId;

        try {
            const orderRef = doc(db, "orders", orderId);
            const docSnap = await getDoc(orderRef);

            if (!docSnap.exists()) {
                alert("Error: Order not found.");
                return;
            }
            const order = { id: docSnap.id, ...docSnap.data() };

            // --- Security Check (Optional but recommended) ---
            const currentUser = auth.currentUser;
            if (!currentUser || order.userId !== currentUser.uid) {
                 alert("Error: You do not have permission to view this order.");
                 console.warn("Attempted to view order belonging to another user:", orderId, currentUser?.uid);
                 return;
            }
            // --- End Security Check ---


            // Fill simple info
            const orderDate = order.createdAt ? order.createdAt.toDate().toLocaleString() : 'N/A';
            document.getElementById('modal-order-id').textContent = order.id.substring(0, 6).toUpperCase();
            document.getElementById('modal-order-date').textContent = orderDate;

            // Fill customer info
            document.getElementById('modal-customer-name').textContent = order.customerName || 'N/A';
            document.getElementById('modal-customer-phone').textContent = order.customerPhone || 'N/A';
            document.getElementById('modal-customer-address').textContent = order.address || 'N/A';

            // Fill order info
            const totalItems = order.items ? order.items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0) : 0; // Ensure qty is parsed
            document.getElementById('modal-order-total-items').textContent = totalItems;

            const paymentEl = document.getElementById('modal-order-payment');
            paymentEl.textContent = order.paymentStatus || 'UNPAID';
            paymentEl.style.color = (order.paymentStatus === 'PAID') ? 'var(--success-green)' : 'var(--primary-red)';

            // Fill items table
            const itemsListEl = document.getElementById('modal-items-list');
            itemsListEl.innerHTML = '';
            order.items?.forEach(item => { // Use optional chaining
                const itemPrice = parseFloat(item.price) || 0;
                const itemQty = parseFloat(item.qty) || 0;
                const itemTotal = (itemPrice * itemQty).toFixed(2);
                itemsListEl.innerHTML += `
                    <tr>
                        <td>${item.name || 'N/A'}</td>
                        <td>${itemQty}</td>
                        <td class="item-price">₹${itemPrice.toFixed(2)}</td>
                        <td class="item-price">₹${itemTotal}</td>
                    </tr>
                `;
            });

            // Fill summary
             const subtotalValue = parseFloat(order.subtotal) || 0;
             const totalValue = parseFloat(order.total) || 0;
            document.getElementById('modal-summary-subtotal').textContent = `₹${subtotalValue.toFixed(2)}`;
            document.getElementById('modal-summary-discount').textContent = `₹0.00`; // Placeholder
            document.getElementById('modal-summary-total').textContent = `₹${totalValue.toFixed(2)}`;

            // Fill status and buttons
            const statusBadge = document.getElementById('modal-order-status');
             const currentStatus = order.status || 'PENDING'; // Default to PENDING if missing
            statusBadge.className = `status-badge ${currentStatus.toLowerCase()}`;
            statusBadge.textContent = currentStatus;

            const statusButtonsEl = document.getElementById('modal-status-buttons');
            statusButtonsEl.innerHTML = '';

            // Define status flows
            const statusFlow = {
                'PENDING': ['PROCESSING', 'READY'],
                'PROCESSING': ['READY', 'DELIVERED'],
                'READY': ['DELIVERED'],
                'DELIVERED': []
            };

            // Add buttons for next possible statuses
            if (statusFlow[currentStatus]) {
                statusFlow[currentStatus].forEach(nextStatus => {
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-primary';
                    if (nextStatus === 'DELIVERED') {
                        btn.style.backgroundColor = 'var(--success-green)';
                    }
                    btn.textContent = `Mark as ${nextStatus}`;
                    btn.onclick = () => updateStatus(orderId, nextStatus); // updateStatus needs userId check too
                    statusButtonsEl.appendChild(btn);
                });
            }

            orderModal.style.display = 'block';

        } catch (error) {
            console.error("Error fetching order details:", error);
            alert("Could not load order details.");
        }
    }

    // --- 5. LOGIC: UPDATE STATUS ---
    // (Is function mein bhi security check add karna chahiye)
    async function updateStatus(orderId, newStatus) {
        console.log(`Updating ${orderId} to ${newStatus}`);

        const orderRef = doc(db, "orders", orderId);
        try {
             // --- Security Check ---
             const currentUser = auth.currentUser;
             const docSnap = await getDoc(orderRef); // Get the order data first
             if (!currentUser || !docSnap.exists() || docSnap.data().userId !== currentUser.uid) {
                  alert("Error: You do not have permission to update this order.");
                  console.warn("Attempted to update order belonging to another user:", orderId, currentUser?.uid);
                  return;
             }
             // --- End Security Check ---

            await updateDoc(orderRef, {
                status: newStatus
            });
            if (orderModal) orderModal.style.display = 'none'; // Close modal
        } catch (error) {
            console.error("Error updating status: ", error);
            alert("Failed to update status.");
        }
    }

    // --- 6. FEATURE: PRINT GARMENT TAG --- (Koi badlav nahi)
    function printOrderTag(orderId) {
        alert("Print feature coming soon! Order ID: " + orderId);
    }

    // --- 7. EVENT LISTENERS SETUP --- (Koi badlav nahi, lekin 'View' button ab user ke orders par hi dikhega)
    function setupOrderEventListeners() {
        if (!ordersTableBody || !orderSearchInput || !orderModal || !orderModalCloseBtn || !printBtn) {
            console.warn("Order management elements not found. Skipping listeners.");
            return;
        }

        // Search
        orderSearchInput.addEventListener('input', (e) => {
            loadOrders(e.target.value.toLowerCase());
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

    // --- INIT ---
    loadOrders(); // Pehla call orders load karne ke liye
    setupOrderEventListeners(); // Event listeners set up karne ke liye
}
