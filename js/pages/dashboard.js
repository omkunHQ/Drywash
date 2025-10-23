// js/pages/dashboard.js

// Firebase config se zaroori cheezein import karein
import { 
    db, Timestamp, collection, getDocs, getCountFromServer, 
    query, where, orderBy, limit 
} from '../firebase-config.js';

// --- Feature: Stats Cards Load Start ---
export async function loadDashboardStats() {
    console.log("Loading dashboard stats from Firebase...");
    
    // Check karein ki dashboard elements maujood hain
    const statsEl = document.getElementById('stats-today-orders');
    if (!statsEl) return; // Agar dashboard par nahi hain, toh ruk jaayein

    // Get today's date range for queries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today 00:00:00
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1); // Tomorrow 00:00:00
    
    // Convert to Firebase Timestamps
    const todayStartTimestamp = Timestamp.fromDate(todayStart);
    const todayEndTimestamp = Timestamp.fromDate(todayEnd);

    try {
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
        const deliveredQuery = query(ordersRef, where('status', '==', 'DELIVERED')); 
        const deliveredSnapshot = await getDocs(deliveredQuery);
        document.getElementById('stats-delivered').textContent = deliveredSnapshot.size;
        
        // --- Total Customers ---
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
        );
        const pickupSnapshot = await getDocs(pickupQuery);
        document.getElementById('stats-pickup').textContent = pickupSnapshot.size;

    } catch (error) {
        console.error("Error loading dashboard stats:", error);
        // Set UI elements to an error state
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
export async function loadRecentOrders() {
    const tableBody = document.getElementById('orders-table-body');
    if (!tableBody) return; // Exit if table body doesn't exist
    
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading recent orders...</td></tr>';
    
    try {
        const ordersRef = collection(db, "orders");
        // Query for the 5 most recent orders
        const recentOrdersQuery = query(ordersRef, orderBy('createdAt', 'desc'), limit(5));
        const snapshot = await getDocs(recentOrdersQuery);
        
        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No recent orders found.</td></tr>';
            return;
        }
        
        tableBody.innerHTML = ''; // Clear the loading message
        snapshot.forEach(doc => {
            const order = doc.data();
            const orderDate = order.createdAt ? order.createdAt.toDate().toLocaleDateString() : 'N/A';
            const quantity = order.items ? order.items.reduce((sum, item) => sum + (item.qty || 0), 0) : 'N/A'; 

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
export async function loadWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return; // Exit if chart canvas doesn't exist

    const labels = [];
    const dataCounts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); 

    try {
        // Loop through the last 7 days
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(today);
            dayStart.setDate(today.getDate() - i);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayStart.getDate() + 1);

            const dayStartTimestamp = Timestamp.fromDate(dayStart);
            const dayEndTimestamp = Timestamp.fromDate(dayEnd);

            // Query orders created within that day
            const dayQuery = query(collection(db, "orders"),
                where("createdAt", ">=", dayStartTimestamp),
                where("createdAt", "<", dayEndTimestamp)
            );
            const daySnapshot = await getDocs(dayQuery);
            
            labels.push(dayStart.toLocaleDateString('en-US', { weekday: 'short' })); 
            dataCounts.push(daySnapshot.size);
        }

        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Orders',
                    data: dataCounts, 
                    backgroundColor: 'var(--primary-orange)',
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });

    } catch (error) {
        console.error("Error loading weekly chart data:", error);
        const context = ctx.getContext('2d');
        context.clearRect(0, 0, ctx.width, ctx.height);
        context.fillStyle = 'red';
        context.textAlign = 'center';
        context.fillText('Error loading chart data', ctx.width / 2, ctx.height / 2);
    }
}
// --- Feature: Weekly Chart Load End ---
