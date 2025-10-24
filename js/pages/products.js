// js/pages/products.js

import {
    db, doc, updateDoc, collection, addDoc,
    serverTimestamp, orderBy, query,
    onSnapshot, where
} from '../firebase-config.js';

import { auth, onAuthStateChanged } from '../firebase-config.js';

export function initProductsPage() {

    // Guard Clause
    const page = document.getElementById('products-list-body');
    if (!page) return;

    // --- 1. DOM ELEMENTS ---
    const productsTableBody = document.getElementById('products-list-body');
    const productSearchInput = document.getElementById('product-search');
    const productModal = document.getElementById('product-modal');
    const productModalTitle = document.getElementById('product-modal-title');
    const addProductBtn = document.getElementById('add-new-product-btn');
    const productModalCloseBtn = document.getElementById('product-modal-close-btn');
    const productForm = document.getElementById('product-form');

    // --- 2. STATE ---
    let allUserProducts = [];
    let currentUserId = null;
    let unsubscribeProducts = null;

    // --- 3. MODAL FUNCTIONS ---
    function openModal(mode = 'add', product = null) {
        if (!productModal) return;
        if (mode === 'add') {
            productModalTitle.textContent = 'Add New Product';
            productForm.reset();
            document.getElementById('product-id').value = '';
        } else if (mode === 'edit' && product) {
            productModalTitle.textContent = 'Edit Product';
            document.getElementById('product-id').value = product.id;
            document.getElementById('form-product-name').value = product.name;
            document.getElementById('form-product-price').value = product.price; // Price load karein
            document.getElementById('form-product-category').value = product.category || '';
        }
        productModal.style.display = 'block';
    }

    function closeProductModal() {
        if (productModal) productModal.style.display = 'none';
    }

    // --- 4. MODAL EVENTS ---
    if (addProductBtn) addProductBtn.addEventListener('click', () => openModal('add'));
    if (productModalCloseBtn) productModalCloseBtn.addEventListener('click', closeProductModal);

    window.addEventListener('click', (e) => {
        if (e.target == productModal) {
            closeProductModal();
        }
    });

    // --- 5. RENDER PRODUCTS ---
    function renderProductTable(searchTerm = "") {
        const lowerSearchTerm = searchTerm.toLowerCase();
        let matchingProducts = [];

        if (lowerSearchTerm) {
            matchingProducts = allUserProducts.filter(prod => prod.name.toLowerCase().includes(lowerSearchTerm));
        } else {
            matchingProducts = allUserProducts;
        }

        if (matchingProducts.length === 0) {
            productsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No products found.</td></tr>';
            return;
        }

        productsTableBody.innerHTML = ''; // Clear table
        matchingProducts.forEach(product => {
            renderProductRow(product);
        });
    }

    function renderProductRow(product) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>$${product.price.toFixed(2)}</td> <td>${product.category || 'N/A'}</td>
            <td>
                <button class="btn btn-secondary btn-edit" style="padding: 5px 10px;">Edit</button>
            </td>
        `;
        // "Edit" button par click listener
        row.querySelector('.btn-edit').addEventListener('click', () => {
            openModal('edit', product);
        });
        productsTableBody.appendChild(row);
    }

    // --- 6. LOAD PRODUCTS (LISTENER) ---
    function startProductListener(userId) {
        console.log("Loading products for user:", userId);
        if (unsubscribeProducts) unsubscribeProducts();

        const productsQuery = query(
            collection(db, 'products'),
            where("userId", "==", userId), // <-- Sirf apne products
            orderBy('name')
        );

        unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
            allUserProducts = [];
            snapshot.forEach(doc => {
                allUserProducts.push({ id: doc.id, ...doc.data() });
            });
            const currentSearch = productSearchInput ? productSearchInput.value : "";
            renderProductTable(currentSearch);
        });
    }

    // --- 7. SAVE PRODUCT (FORM SUBMIT) ---
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUserId) return alert("You must be logged in.");

            const productData = {
                name: document.getElementById('form-product-name').value,
                price: parseFloat(document.getElementById('form-product-price').value), // Price ko number mein save karein
                category: document.getElementById('form-product-category').value,
            };
            const productId = document.getElementById('product-id').value;

            try {
                if (productId) {
                    // --- UPDATE (PRICE YAHAN CHANGE HOGI) ---
                    console.log("Updating product:", productId);
                    const productRef = doc(db, 'products', productId);
                    await updateDoc(productRef, productData);
                    alert("Product price updated successfully!");
                } else {
                    // --- ADD NEW ---
                    console.log("Adding new product for user:", currentUserId);
                    await addDoc(collection(db, 'products'), {
                        ...productData,
                        userId: currentUserId,
                        icon: "fa-tag" // Default icon
                    });
                    alert("Product added successfully!");
                }
                closeProductModal();
            } catch (error) {
                console.error("Error saving product: ", error);
            }
        });
    }
    
    // --- 8. SEARCH ---
    if (productSearchInput) {
        productSearchInput.addEventListener('input', (e) => {
            renderProductTable(e.target.value);
        });
    }

    // --- 9. INIT ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserId = user.uid;
            if (addProductBtn) addProductBtn.disabled = false;
            startProductListener(currentUserId);
        } else {
            currentUserId = null;
            allUserProducts = [];
            if (unsubscribeProducts) unsubscribeProducts();
            productsTableBody.innerHTML = '<tr><td colspan="4">Please log in.</td></tr>';
            if (addProductBtn) addProductBtn.disabled = true;
            closeProductModal();
        }
    });
}
