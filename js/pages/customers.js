// js/pages/customers.js

import { 
    db, doc, updateDoc, collection, addDoc, 
    serverTimestamp, orderBy, query, getDocs 
} from '../firebase-config.js';

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
    
    // --- 2. MODAL FUNCTIONS ---
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

    function closeCustomerModal(){
        if (customerModal) customerModal.style.display = 'none';
    }

    // --- 3. MODAL EVENTS ---
    if (addCustomerBtn) addCustomerBtn.addEventListener('click', () => openModal('add'));
    if (customerModalCloseBtn) customerModalCloseBtn.addEventListener('click', closeCustomerModal);
    
    window.addEventListener('click', (e) => {
        if (e.target == customerModal) {
            closeCustomerModal();
        }
    });

    // --- 4. LOAD CUSTOMERS (FROM FIREBASE) ---
    async function loadCustomers() {
        console.log("Loading customers...");
        if (!customersTableBody) return;
        customersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Loading customers...</td></tr>';
        
        try {
            const customersQuery = query(collection(db, 'customers'), orderBy('name'));
            const snapshot = await getDocs(customersQuery);
            
            if (snapshot.empty) {
                customersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No customers found.</td></tr>';
                return;
            }
            
            customersTableBody.innerHTML = ''; // Clear loader
            snapshot.forEach(doc => {
                const customer = { id: doc.id, ...doc.data() };
                renderCustomerRow(customer);
            });
        } catch (error) {
            console.error("Error loading customers: ", error);
            customersTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Error loading customers.</td></tr>';
        }
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
        customersTableBody.appendChild(row);
    }

    // --- 5. SAVE CUSTOMER (FORM SUBMIT) ---
    if (customerForm) {
        customerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
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
                    await updateDoc(customerRef, customerData);
                    alert("Customer updated successfully!");
                } else {
                    // --- ADD NEW CUSTOMER ---
                    console.log("Adding new customer:");
                    const dataToSave = { ...customerData, totalOrders: 0, createdAt: serverTimestamp() };
                    await addDoc(collection(db, 'customers'), dataToSave);
                    alert("Customer added successfully!");
                }
                closeCustomerModal();
                loadCustomers(); // Refresh list
            } catch (error) {
                console.error("Error saving customer: ", error);
                alert("Failed to save customer.");
            }
        });
    }
    
    // --- 6. SEARCH (Simple JS filter) ---
    if (customerSearchInput) {
        customerSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = customersTableBody.getElementsByTagName('tr');
            for (let row of rows) {
                // Check if row is not a header row
                if (row.getElementsByTagName('td').length > 0) {
                    const rowText = row.textContent.toLowerCase();
                    if (rowText.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            }
        });
    }

    // --- INIT ---
    loadCustomers();
}