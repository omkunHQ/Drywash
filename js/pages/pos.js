// js/pages/pos.js

// Firebase config se zaroori cheezein import karein
import { 
    db, collection, getDocs, addDoc, serverTimestamp 
} from 'js/firebase-config.js';

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

    // --- 3. INITIALIZATION & DATA LOADING ---
    async function loadProductsAndCategories() { 
        console.log("Loading products for POS...");
        
        allProducts = [];
        if (productFilters) {
            const existingFilters = productFilters.querySelectorAll('.filter-btn:not([data-category="all"])');
            existingFilters.forEach(btn => btn.remove());
        }

        try {
            const productsCol = collection(db, 'products');
            const snapshot = await getDocs(productsCol);
            
            const categories = new Set();
            snapshot.forEach(doc => {
                const product = { id: doc.id, ...doc.data() };
                allProducts.push(product);
                if (product.category) categories.add(product.category);
            });
            
            renderCategories(categories);
            renderProducts('all');

        } catch (error) {
            console.error("Error loading products from Firebase: ", error);
            if (productGrid) productGrid.innerHTML = '<p style="color: red;">Error loading products.</p>';
        }
    }

    // --- 4. CATEGORY & PRODUCT RENDERING ---
    function renderCategories(categories) {
        if (!productFilters) return;
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
        
        productGrid.innerHTML = ''; 
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

    // --- 5. CART LOGIC ---
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
        const discount = 0; // Placeholder
        const total = subtotal - discount;
        
        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    }

    // --- 6. EVENT HANDLERS ---
    if (productFilters) {
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
    loadProductsAndCategories();

}
