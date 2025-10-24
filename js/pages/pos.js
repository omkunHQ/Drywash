// js/pages/pos.js

// Firebase config se zaroori cheezein import karein
// Path ko ../ se shuru karein kyunki pos.js 'pages' folder ke andar hai
import {
    db, collection, getDocs, addDoc, serverTimestamp
} from '../firebase-config.js'; // <-- Path check karein (../)
import {
    auth, onAuthStateChanged // <-- onAuthStateChanged ko import karein
} from '../firebase-config.js'; // <-- Path check karein (../)

// Poora POS logic is ek function mein daal dein
export function initPosPage() {

    // Guard Clause: Agar POS page ke elements nahi hain, toh run mat karo
    const page = document.getElementById('page-pos');
    if (!page) return;

    // --- 1. DOM ELEMENTS ---
    const productGrid = document.getElementById('product-grid');
    const productFilters = document.getElementById('product-filters');
    const cartItemsList = document.getElementById('cart-items-list');
    const subtotalEl = document.getElementById('summary-subtotal');
    const totalEl = document.getElementById('summary-total');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const customItemForm = document.getElementById('custom-item-form');
    const customerPhoneInput = document.getElementById('customer-phone');
    const customerNameInput = document.getElementById('customer-name');
    const isExpressCheckbox = document.getElementById('is-express-order');

    // --- 2. STATE ---
    let cart = [];
    let allProducts = [];

    // --- 3. INITIALIZATION & DATA LOADING (YEH FUNCTION BADLA GAYA HAI) ---
    async function loadProductsAndCategories() {
        console.log("Loading products for POS...");
        if (productGrid) productGrid.innerHTML = '<p>Loading products...</p>'; // Loading message

        // Cleanup filters (if they exist)
        if (productFilters) {
             const existingFilters = productFilters.querySelectorAll('.filter-btn:not([data-category="all"])');
             existingFilters.forEach(btn => btn.remove());
        }

        // Pehle current user ka pata lagayein
        onAuthStateChanged(auth, async (user) => { // async yahaan add karein
            if (user) {
                const userId = user.uid;
                console.log("Fetching products for user:", userId);
                try {
                    // User ke products subcollection se data fetch karein
                    // COLLECTION PATH BADLA HAI
                    const productsCol = collection(db, 'users', userId, 'products');
                    const snapshot = await getDocs(productsCol);

                    allProducts = []; // Pehle clear karein
                    const categories = new Set();
                    if (snapshot.empty) {
                        console.log("No products found for this user yet.");
                        if (productGrid) productGrid.innerHTML = '<p>No products found. Add products in settings.</p>'; // Updated message
                        renderCategories(categories); // Render empty categories if needed
                        return; // Stop if no products
                    }

                    snapshot.forEach(doc => {
                        const product = { id: doc.id, ...doc.data() };
                        allProducts.push(product);
                        if (product.category) categories.add(product.category);
                    });

                    renderCategories(categories);
                    renderProducts('all'); // Render all products by default

                } catch (error) {
                    console.error("Error loading user products from Firebase: ", error);
                    if (productGrid) productGrid.innerHTML = '<p style="color: red;">Error loading products.</p>';
                }
            } else {
                // Agar user logged in nahi hai
                console.error("User not logged in, cannot load products.");
                if (productGrid) productGrid.innerHTML = '<p style="color: red;">Please log in to see products.</p>';
            }
        }); // onAuthStateChanged band karein
    }
    // --- FUNCTION KA UPDATE YAHAN KHATM ---


    // --- 4. CATEGORY & PRODUCT RENDERING --- (Koi badlav nahi)
    function renderCategories(categories) {
        if (!productFilters) return;
        // Pehle se maujood code...
         categories.forEach(category => {
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
        // Pehle se maujood code...
         productGrid.innerHTML = '';
        const filteredProducts = (category === 'all')
            ? allProducts
            : allProducts.filter(p => p.category === category);

        if (filteredProducts.length === 0) {
            // Updated message if needed, or keep the original
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

    // --- 5. CART LOGIC --- (Koi badlav nahi)
    function addToCart(id, name, price, qty) {
        // Pehle se maujood code...
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.qty += qty;
        } else {
            cart.push({ id, name, price: parseFloat(price), qty: parseFloat(qty) });
        }
        renderCart();
    }

    function updateQuantity(id, change) {
        // Pehle se maujood code...
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
        // Pehle se maujood code...
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
        // Pehle se maujood code...
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const discount = 0; // Placeholder
        const total = subtotal - discount;

        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    }

    // --- 6. EVENT HANDLERS --- (Koi badlav nahi)
    if (productFilters) {
        // Pehle se maujood code...
         productFilters.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.classList.contains('filter-btn')) {
                 const currentActive = productFilters.querySelector('.filter-btn.active');
                 if (currentActive) currentActive.classList.remove('active');
                 e.target.classList.add('active');
                 renderProducts(e.target.dataset.category);
            }
        });
    }

    if (cartItemsList) {
        // Pehle se maujood code...
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

    if (customItemForm) {
        // Pehle se maujood code...
         customItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('custom-item-name');
            const qtyInput = document.getElementById('custom-item-qty');
            const priceInput = document.getElementById('custom-item-price');

            const name = nameInput.value;
            const qty = parseFloat(qtyInput.value);
            const price = parseFloat(priceInput.value);

            if (!name || isNaN(qty) || isNaN(price) || qty <= 0 || price < 0) {
                alert("Please fill all custom item fields with valid inputs (Name, Qty > 0, Price >= 0).");
                return;
            }

            const customId = `custom-${Date.now()}`;
            addToCart(customId, name, price, qty);

            nameInput.value = '';
            qtyInput.value = 1;
            priceInput.value = '';
        });
    }

    if (placeOrderBtn) {
        // Pehle se maujood code...
         placeOrderBtn.addEventListener('click', async () => {
            const customerPhone = customerPhoneInput ? customerPhoneInput.value : '';
            if (cart.length === 0) {
                alert("Cart is empty!"); return;
            }
            if (!customerPhone) {
                alert("Customer Phone is required.");
                if (customerPhoneInput) customerPhoneInput.focus();
                return;
            }

            const orderData = {
                customerPhone: customerPhone,
                customerName: customerNameInput ? customerNameInput.value : '',
                items: cart,
                subtotal: parseFloat(subtotalEl.textContent.replace('$', '')),
                total: parseFloat(totalEl.textContent.replace('$', '')),
                status: 'PENDING',
                paymentStatus: 'UNPAID',
                isExpress: isExpressCheckbox ? isExpressCheckbox.checked : false,
                createdAt: serverTimestamp()
            };

            console.log("Saving order to Firebase...", orderData);
            placeOrderBtn.disabled = true;
            placeOrderBtn.textContent = 'Placing Order...';

            try {
                // Yahaan order save karne ka collection path check karein - shayad global 'orders' hi theek hai
                const docRef = await addDoc(collection(db, "orders"), orderData);
                alert(`Order Placed Successfully! Invoice ID: ${docRef.id}`);

                cart = [];
                renderCart();
                if (customerPhoneInput) customerPhoneInput.value = '';
                if (customerNameInput) customerNameInput.value = '';
                if (isExpressCheckbox) isExpressCheckbox.checked = false;

            } catch (error) {
                console.error("Error adding document: ", error);
                alert("Error placing order. Please check the console and try again.");
            } finally {
                 placeOrderBtn.disabled = false;
                 placeOrderBtn.textContent = 'Charge & Place Order';
            }
        });
    }

    // --- Init Function Call ---
    loadProductsAndCategories(); // Yeh function call zaroori hai

} // initPosPage band karein
