// js/pages/orders.js

import { 
    db, doc, getDoc, updateDoc, collection, 
    query, orderBy, onSnapshot 
} from '../firebase-config.js';

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
    
    // Global variable to store current viewing order ID for modal
    let currentViewingOrderId = null;

    // --- 2. CORE FUNCTION: LOAD & RENDER ORDERS ---
    function loadOrders(searchTerm = "") {
        if (!ordersTableBody) return;
        ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading orders...</td></tr>';

        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

        onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                ordersTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No orders found.</td></tr>';
                return;
            }

            ordersTableBody.innerHTML = ''; // Clear table
            snapshot.forEach(doc => {
                const order = { id: doc.id, ...doc.data() };

                const orderDate = order.createdAt ? order.createdAt.toDate().toLocaleDateString() : 'N/A';
                const searchText = (order.id + order.customerName + order.customerPhone + orderDate).toLowerCase();

                if (searchTerm && !searchText.includes(searchTerm)) {
                    return; // Skip if not matching search
                }

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

    // --- 4. CORE FUNCTION: RENDER ORDER DETAILS MODAL ---
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

            // Fill simple info
            const orderDate = order.createdAt ? order.createdAt.toDate().toLocaleString() : 'N/A';
            document.getElementById('modal-order-id').textContent = order.id.substring(0, 6).toUpperCase();
            document.getElementById('modal-order-date').textContent = orderDate;

            // Fill customer info
            document.getElementById('modal-customer-name').textContent = order.customerName || 'N/A';
            document.getElementById('modal-customer-phone').textContent = order.customerPhone || 'N/A';
            // TODO: Add address to order object if you collect it
            document.getElementById('modal-customer-address').textContent = order.address || 'N/A'; 

            // Fill order info
            const totalItems = order.items ? order.items.reduce((sum, item) => sum + (item.qty || 0), 0) : 0;
            document.getElementById('modal-order-total-items').textContent = totalItems;
            
            const paymentEl = document.getElementById('modal-order-payment');
            paymentEl.textContent = order.paymentStatus || 'UNPAID';
            paymentEl.style.color = (order.paymentStatus === 'PAID') ? 'var(--success-green)' : 'var(--primary-red)';

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
            
            // Define status flows
            const statusFlow = {
                'PENDING': ['PROCESSING', 'READY'],
                'PROCESSING': ['READY', 'DELIVERED'],
                'READY': ['DELIVERED'],
                'DELIVERED': []
            };

            // Add buttons for next possible statuses
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
            alert("Could not load order details.");
        }
    }

    // --- 5. LOGIC: UPDATE STATUS ---
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
            alert("Failed to update status.");
        }
    }

    // --- 6. FEATURE: PRINT GARMENT TAG ---
    function printOrderTag(orderId) {
        alert("Print feature coming soon! Order ID: " + orderId);
        // Yahaan aap print window ka logic daal sakte hain
    }
        
    // --- 7. EVENT LISTENERS SETUP ---
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
    loadOrders();
    setupOrderEventListeners();
}
