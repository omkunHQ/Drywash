// js/pages/dashboard.js

// Firebase config से zaroori cheezein import karein
import {
    db, Timestamp, collection, getDocs, getCountFromServer,
    query, where, // <-- where zaroor import karein
    orderBy, limit
} from '../firebase-config.js'; // <-- Path check karein (../)

// Firebase Auth ko import karein
import { auth, onAuthStateChanged } from '../firebase-config.js'; // <-- YEH ADD KAREIN

// --- Feature: Stats Cards Load Start (Updated) ---
export async function loadDashboardStats() {
    console.log("Loading dashboard stats...");

    const statsEl = document.getElementById('stats-today-orders');
    if (!statsEl) return;

    // Pehle user ka intezaar karein
    onAuthStateChanged(auth, async (user) => { // <-- Wrapper add hua
        if (user) {
            const currentUserId = user.uid; // <-- User ID li gayi
            console.log("Loading stats for user:", currentUserId);

            // Get today's date range
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            const todayStartTimestamp = Timestamp.fromDate(todayStart);
            const todayEndTimestamp = Timestamp.fromDate(todayEnd);

            try {
                const ordersRef = collection(db, "orders");

                // --- Today's Orders (FILTERED) ---
                const todayOrdersQuery = query(ordersRef,
                    where("userId", "==", currentUserId), // <-- User filter
                    where("createdAt", ">=", todayStartTimestamp),
                    where("createdAt", "<", todayEndTimestamp)
                );
                const todayOrdersSnapshot = await getDocs(todayOrdersQuery);
                document.getElementById('stats-today-orders').textContent = todayOrdersSnapshot.size;

                // --- Total Pending Orders (FILTERED) ---
                const pendingQuery = query(ordersRef,
                    where("userId", "==", currentUserId), // <-- User filter
                    where('status', '==', 'PENDING')
                );
                const pendingSnapshot = await getDocs(pendingQuery);
                document.getElementById('stats-pending').textContent = pendingSnapshot.size;

                // --- Total Delivered Orders (FILTERED) ---
                const deliveredQuery = query(ordersRef,
                    where("userId", "==", currentUserId), // <-- User filter
                    where('status', '==', 'DELIVERED')
                );
                const deliveredSnapshot = await getDocs(deliveredQuery);
                document.getElementById('stats-delivered').textContent = deliveredSnapshot.size;

                // --- Total Customers (Yeh shayad global hi rahega ya user-specific hoga?) ---
                // Agar customers bhi user-specific hain toh yahaan bhi filter lagega
                const customersRef = collection(db, "customers"); // Abhi ke liye global maan rahe hain
                const customersCountSnapshot = await getCountFromServer(customersRef);
                document.getElementById('stats-customers').textContent = customersCountSnapshot.data().count;

                // --- Unpaid Orders (FILTERED) ---
                const unpaidQuery = query(ordersRef,
                    where("userId", "==", currentUserId), // <-- User filter
                    where('paymentStatus', '==', 'UNPAID')
                );
                const unpaidSnapshot = await getDocs(unpaidQuery);
                document.getElementById('stats-unpaid').textContent = unpaidSnapshot.size;

                // --- Total Pickup Requests (FILTERED, agar schedule mein userId hai) ---
                // Note: Agar 'schedule' collection mein userId save nahi hai toh yeh filter kaam nahi karega
                const scheduleRef = collection(db, "schedule");
                const pickupQuery = query(scheduleRef,
                    // where("userId", "==", currentUserId), // <-- Agar schedule mein userId hai toh add karein
                    where("extendedProps.type", "==", "PICKUP"),
                    where("start", ">=", todayStartTimestamp),
                    where("start", "<", todayEndTimestamp)
                );
                const pickupSnapshot = await getDocs(pickupQuery);
                document.getElementById('stats-pickup').textContent = pickupSnapshot.size;

            } catch (error) {
                console.error("Error loading dashboard stats for user:", currentUserId, error);
                // Set UI to error state
                document.getElementById('stats-today-orders').textContent = 'ERR';
                // ... baaki stats ko bhi 'ERR' karein ...
            }
        } else {
            // User logged out state
            console.log("User logged out, clearing stats.");
            document.getElementById('stats-today-orders').textContent = '0';
            document.getElementById('stats-pending').textContent = '0';
            // ... baaki stats ko bhi 0 karein ...
        }
    }); // <-- Wrapper end
}
// --- Feature: Stats Cards Load End ---


// --- Feature: Recent Orders Table Load Start (Updated) ---
export async function loadRecentOrders() {
    const tableBody = document.getElementById('orders-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading recent orders...</td></tr>';

    // User ka intezaar karein
    onAuthStateChanged(auth, async (user) => { // <-- Wrapper add hua
        if (user) {
            const currentUserId = user.uid; // <-- User ID li gayi
            try {
                const ordersRef = collection(db, "orders");
                // Query for the 5 most recent orders OF THIS USER
                const recentOrdersQuery = query(ordersRef,
                    where("userId", "==", currentUserId), // <-- User filter
                    orderBy('createdAt', 'desc'),
                    limit(5)
                );
                const snapshot = await getDocs(recentOrdersQuery);

                if (snapshot.empty) {
                    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No recent orders found for you.</td></tr>';
                    return;
                }

                tableBody.innerHTML = ''; // Clear loading
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
                    tableBody.innerHTML += row;
                });
            } catch (error) {
                console.error("Error loading recent orders for user:", currentUserId, error);
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading your orders.</td></tr>';
            }
        } else {
             // User logged out state
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Please log in to see recent orders.</td></tr>';
        }
    }); // <-- Wrapper end
}
// --- Feature: Recent Orders Table Load End ---


// --- Feature: Weekly Chart Load Start (Updated) ---
export async function loadWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;

    // Clear previous chart data or show loading state
     const existingChart = Chart.getChart(ctx);
     if (existingChart) {
         existingChart.destroy();
     }
     // Optional: Show loading message in canvas area

    // User ka intezaar karein
    onAuthStateChanged(auth, async (user) => { // <-- Wrapper add hua
        if (user) {
            const currentUserId = user.uid; // <-- User ID li gayi
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

                    // Query orders FOR THIS USER created within that day
                    const dayQuery = query(collection(db, "orders"),
                        where("userId", "==", currentUserId), // <-- User filter
                        where("createdAt", ">=", dayStartTimestamp),
                        where("createdAt", "<", dayEndTimestamp)
                    );
                    const daySnapshot = await getDocs(dayQuery);

                    labels.push(dayStart.toLocaleDateString('en-US', { weekday: 'short' }));
                    dataCounts.push(daySnapshot.size);
                }

                // Destroy again just in case (e.g., if user logs in/out quickly)
                const checkExistingChart = Chart.getChart(ctx);
                 if (checkExistingChart) {
                     checkExistingChart.destroy();
                 }

                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Your Orders', // Updated label
                            data: dataCounts,
                            backgroundColor: 'var(--primary-orange)',
                            borderRadius: 4,
                        }]
                    },
                    options: { // Chart options remain the same
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
                console.error("Error loading weekly chart data for user:", currentUserId, error);
                 const context = ctx.getContext('2d');
                 context.clearRect(0, 0, ctx.width, ctx.height);
                 context.fillStyle = 'red';
                 context.textAlign = 'center';
                 context.fillText('Error loading chart data', ctx.width / 2, ctx.height / 2);
            }
        } else {
             // User logged out state - Clear chart
             console.log("User logged out, clearing chart.");
             const context = ctx.getContext('2d');
             context.clearRect(0, 0, ctx.width, ctx.height);
             // Optional: Display a "Please log in" message
             context.fillStyle = 'grey';
             context.textAlign = 'center';
             context.fillText('Log in to see your chart data', ctx.width / 2, ctx.height / 2);
        }
    }); // <-- Wrapper end
}
// --- Feature: Weekly Chart Load End ---
