// js/pages/customers.js

import {
    db, doc, updateDoc, collection, addDoc,
    serverTimestamp, orderBy, query,
    onSnapshot, where // <-- 'onSnapshot' aur 'where' add karein
} from '../firebase-config.js';

// Auth ko import karein
import { auth, onAuthStateChanged } from '../firebase-config.js'; // <-- YEH ADD KAREIN

export function initCustomersPage() {

    // Guard Clause
    const page = document.getElementById('page-customers');
    if (!page) return;

    // --- 1. DOM ELEMENTS ---
    const customersTableBody = document.getElementById('customers-list-body');
    const customerSearchInput = document.getElementById('customer-search');
    const customerModal = document.getElementById('customer-modal');
    const customerModalTitle = document.getElementById('modal-title');
    const addCustomerBtn = document.getElementById('add-customer-btn');
    const customerModalCloseBtn = document.getElementById('modal-close-btn');
    const customerForm = document.getElementById('customer-form');

    // --- 2. STATE ---
    let allUserCustomers = []; // User ke saare customers yahan store honge
    let currentUserId = null;
    let unsubscribeCustomers = null; // Listener ko band karne ke liye

    // --- 3. MODAL FUNCTIONS ---
    // (In functions mein koi change nahi hai)
    function openModal(mode = 'add', customer = null) {
        if (!customerModal) return;
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
        customerModal.style.display = 'block';
    }

    function closeCustomerModal() {
        if (customerModal) customerModal.style.display = 'none';
    }

    // --- 4. MODAL EVENTS ---
    // (In functions mein koi change nahi hai)
    if (addCustomerBtn) addCustomerBtn.addEventListener('click', () => openModal('add'));
    if (customerModalCloseBtn) customerModalCloseBtn.addEventListener('click', closeCustomerModal);

    window.addEventListener('click', (e) => {
        if (e.target == customerModal) {
            closeCustomerModal();
        }
    });

    // --- 5. RENDER CUSTOMERS (Refactored) ---
    // Yeh function state ('allUserCustomers') se table banata hai
    function renderCustomerTable(searchTerm = "") {
        if (!customersTableBody) return;
        const lowerSearchTerm = searchTerm.toLowerCase();

        let matchingCustomers = [];
        if (lowerSearchTerm) {
            matchingCustomers = allUserCustomers.filter(cust => {
                const searchText = (cust.name + cust.phone).toLowerCase();
                return searchText.includes(lowerSearchTerm);
            });
        } else {
            matchingCustomers = allUserCustomers;
        }

        if (matchingCustomers.length === 0) {
            if (allUserCustomers.length === 0) {
                customersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No customers found. Click "Add Customer".</td></tr>';
            } else {
                customersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No customers match your search.</td></tr>';
            }
            return;
        }

        customersTableBody.innerHTML = ''; // Clear table
        matchingCustomers.forEach(customer => {
            renderCustomerRow(customer);
        });
    }

    // Helper function to render a row (Updated)
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
            // Security Check: Kya yeh customer isi user ka hai?
            // (Waise toh list hi filtered hai, but double check)
            if (customer.userId !== currentUserId) {
                 alert("You do not have permission to edit this customer.");
                 return;
            }
            openModal('edit', customer);
        });
        customersTableBody.appendChild(row);
    }

    // --- 6. LOAD CUSTOMERS (Updated to Listener) ---
    function startCustomerListener(userId) {
        console.log("Loading customers for user:", userId);
        if (!customersTableBody) return;
        customersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading customers...</td></tr>';

        // Purana listener (agar hai) toh band karein
        if (unsubscribeCustomers) {
            unsubscribeCustomers();
        }

        // **YEH HAI ASLI FIX (Query)**
        const customersQuery = query(
            collection(db, 'customers'),
            where("userId", "==", userId), // <-- Filter lagaya
            orderBy('name')
        );

        unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
            allUserCustomers = []; // State ko reset karein
            snapshot.forEach(doc => {
                allUserCustomers.push({ id: doc.id, ...doc.data() });
            });
            // Table ko render karein
            const currentSearch = customerSearchInput ? customerSearchInput.value : "";
            renderCustomerTable(currentSearch);
        }, (error) => {
            console.error("Error listening to customers: ", error);
            customersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading customers. (Index required?)</td></tr>';
            // **YAAD RAKHEIN: Is query ke liye COMPOSITE INDEX zaroori ho sakta hai**
        });
    }

    // --- 7. SAVE CUSTOMER (Updated) ---
    if (customerForm) {
        customerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // User login hai ya nahi check karein
            if (!currentUserId) {
                alert("You must be logged in to save a customer.");
                return;
            }

            const customerData = {
                name: document.getElementById('form-customer-name').value,
                phone: document.getElementById('form-customer-phone').value,
                address: document.getElementById('form-customer-address').value,
            };
            const customerId = document.getElementById('customer-id').value;

            try {
                if (customerId) {
                    // --- UPDATE EXISTING CUSTOMER ---
                    console.log("Updating customer:", customerId);
                    const customerRef = doc(db, 'customers', customerId);
                    // (Security Rules isko protect karenge)
                    await updateDoc(customerRef, customerData);
                    alert("Customer updated successfully!");
                } else {
                    // --- ADD NEW CUSTOMER ---
                    console.log("Adding new customer for user:", currentUserId);
                    
                    // **YEH HAI ASLI FIX (Save)**
                    const dataToSave = {
                        ...customerData,
                        totalOrders: 0,
                        createdAt: serverTimestamp(),
                        userId: currentUserId // <-- User ID save ki
                    };
                    await addDoc(collection(db, 'customers'), dataToSave);
                    alert("Customer added successfully!");
                }
                closeCustomerModal();
                // 'loadCustomers()' call ki zaroorat nahi, onSnapshot handle kar lega
            } catch (error) {
                console.error("Error saving customer: ", error);
                alert("Failed to save customer. (Maybe permission denied)");
            }
        });
    }

    // --- 8. SEARCH (Updated) ---
    if (customerSearchInput) {
        customerSearchInput.addEventListener('input', (e) => {
            // Yeh ab sirf render function call karta hai, DOM ko nahi padhta
            renderCustomerTable(e.target.value.toLowerCase());
        });
    }

    // --- 9. INIT (Updated) ---
    // Saara logic 'onAuthStateChanged' se shuru karein
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User login hai
            currentUserId = user.uid;
            if (addCustomerBtn) addCustomerBtn.disabled = false;
            if (customerSearchInput) customerSearchInput.disabled = false;
            startCustomerListener(currentUserId);
Address
        } else {
            // User login nahi hai
            currentUserId = null;
            allUserCustomers = [];
            if (unsubscribeCustomers) {
                unsubscribeCustomers(); // Listener band karein
                unsubscribeCustomers = null;
            }
            if (customersTableBody) {
                customersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Please log in to see your customers.</td></tr>';
            }
            if (addCustomerBtn) addCustomerBtn.disabled = true;
            if (customerSearchInput) {
                customerSearchInput.value = '';
                customerSearchInput.disabled = true;
            }
            closeCustomerModal(); // Log out hone par modal band karein
        }
    });

}
