// js/pages/cash-register.js

import { 
    db, doc, setDoc, collection, query, 
    orderBy, onSnapshot, serverTimestamp 
} from '../firebase-config.js';

export function initCashRegisterPage() {
    
    // Guard Clause
    const page = document.getElementById('page-cash-register');
    if (!page) return;

    // --- 1. DOM ELEMENTS ---
    const summaryOpeningEl = document.getElementById('summary-opening');
    const summaryCashInEl = document.getElementById('summary-cash-in');
    const summaryCashOutEl = document.getElementById('summary-cash-out');
    const summaryClosingEl = document.getElementById('summary-closing');
    const cashLogBody = document.getElementById('cash-log-body');

    const openingModal = document.getElementById('opening-balance-modal');
    const cashInModal = document.getElementById('cash-in-modal');
    const cashOutModal = document.getElementById('cash-out-modal');
    
    const openOpeningBtn = document.getElementById('set-opening-balance-btn');
    const openCashInBtn = document.getElementById('add-cash-in-btn');
    const openCashOutBtn = document.getElementById('add-cash-out-btn');
    const closeModalBtns = document.querySelectorAll('#page-cash-register .modal .close-btn, #opening-balance-modal .close-btn, #cash-in-modal .close-btn, #cash-out-modal .close-btn');

    const openingForm = document.getElementById('opening-balance-form');
    const cashInForm = document.getElementById('cash-in-form');
    const cashOutForm = document.getElementById('cash-out-form');

    // --- 2. STATE ---
    let cashLog = []; // Local state, Firebase se sync hoga
    let todayLogId = new Date().toISOString().split('T')[0]; // e.g., '2025-10-23'

    // --- 3. MODAL HELPER FUNCTIONS ---
    function openModal(modal) {
        if (modal) modal.style.display = 'block';
    }
    function closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }

    // --- 4. EVENT LISTENERS (Buttons) ---
    if (openOpeningBtn) openOpeningBtn.addEventListener('click', () => openModal(openingModal));
    if (openCashInBtn) openCashInBtn.addEventListener('click', () => openModal(cashInModal));
    if (openCashOutBtn) openCashOutBtn.addEventListener('click', () => openModal(cashOutModal));

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            closeModal(document.getElementById(modalId));
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target == openingModal) closeModal(openingModal);
        if (e.target == cashInModal) closeModal(cashInModal);
        if (e.target == cashOutModal) closeModal(cashOutModal);
    });

    // --- 5. EVENT LISTENERS (Forms) ---
    if (openingForm) {
        openingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('form-opening-amount').value);
            if (isNaN(amount)) return;
            
            const existing = cashLog.find(log => log.type === 'Opening');
            if (existing) {
                alert('Opening balance is already set.');
                return;
            }

            addTransaction('Opening', amount, 'Opening Balance');
            closeModal(openingModal);
            openingForm.reset();
        });
    }

    if (cashInForm) {
        cashInForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('form-cash-in-amount').value);
            const notes = document.getElementById('form-cash-in-notes').value;
            if (isNaN(amount) || amount <= 0) return;

            addTransaction('In', amount, notes);
            closeModal(cashInModal);
            cashInForm.reset();
        });
    }
    
    if (cashOutForm) {
        cashOutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('form-cash-out-amount').value);
            const notes = document.getElementById('form-cash-out-notes').value;
            if (isNaN(amount) || amount <= 0) return;

            addTransaction('Out', amount, notes);
            closeModal(cashOutModal);
            cashOutForm.reset();
        });
    }
    
    // --- 6. CORE LOGIC ---
    async function addTransaction(type, amount, notes) {
        const transaction = {
            id: `txn_${Date.now()}`,
            time: serverTimestamp(), // Use server time
            type: type, // 'Opening', 'In', 'Out'
            amount: amount,
            notes: notes || 'N/A'
        };

        // Save to Firebase
        try {
            const logRef = doc(db, 'cashRegister', todayLogId, 'logs', transaction.id);
            await setDoc(logRef, transaction);
            console.log('Transaction saved to Firebase');
        } catch (e) {
            console.error("Error saving transaction: ", e);
            alert('Failed to save transaction.');
        }
    }
    
    function updateUI() {
        renderCashLog();
        updateSummary();
    }
    
    function renderCashLog() {
        if (!cashLogBody) return;
        cashLogBody.innerHTML = '';
        
        // cashLog is already sorted by time from Firebase
        if (cashLog.length === 0) {
            cashLogBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No transactions for today.</td></tr>';
            return;
        }

        cashLog.forEach(log => {
            const row = document.createElement('tr');
            
            // Format time
            const timeString = log.time ? log.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...';
            
            let amountCell = '';
            if (log.type === 'In' || log.type === 'Opening') {
                amountCell = `<td style="color: var(--success-green); font-weight: 500;">+ ₹${log.amount.toFixed(2)}</td>`;
            } else if (log.type === 'Out') {
                amountCell = `<td style="color: var(--primary-red); font-weight: 500;">- ₹${log.amount.toFixed(2)}</td>`;
            }

            row.innerHTML = `
                <td>${timeString}</td>
                <td>${log.type}</td>
                ${amountCell}
                <td>${log.notes}</td>
            `;
            cashLogBody.appendChild(row);
        });
    }

    function updateSummary() {
        if (!summaryOpeningEl) return;

        let opening = 0;
        let cashIn = 0;
        let cashOut = 0;

        cashLog.forEach(log => {
            if (log.type === 'Opening') {
                opening += log.amount;
            } else if (log.type === 'In') {
                cashIn += log.amount;
            } else if (log.type === 'Out') {
                cashOut += log.amount;
            }
        });

        const closing = (opening + cashIn) - cashOut;

        summaryOpeningEl.textContent = `₹${opening.toFixed(2)}`;
        summaryCashInEl.textContent = `₹${cashIn.toFixed(2)}`;
        summaryCashOutEl.textContent = `₹${cashOut.toFixed(2)}`;
        summaryClosingEl.textContent = `₹${closing.toFixed(2)}`;
    }

    // --- 7. INITIALIZATION ---
    function initCashRegister() {
        console.log("Initializing Cash Register for:", todayLogId);
        
        // Listen for today's logs
        const logsCol = collection(db, 'cashRegister', todayLogId, 'logs');
        const q = query(logsCol, orderBy('time', 'asc'));
        
        onSnapshot(q, (snapshot) => {
            cashLog = []; // Clear local array
            snapshot.forEach(doc => {
                const data = doc.data();
                // Convert Firebase Timestamp back to JS Date
                if (data.time) {
                    data.time = data.time.toDate(); 
                }
                cashLog.push(data);
            });
            updateUI(); // Update UI with Firebase data
        });
    }

    // Run when the page module is loaded
    initCashRegister();
}