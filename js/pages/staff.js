// js/pages/staff.js

import { 
    db, doc, updateDoc, deleteDoc, collection, 
    addDoc, query, orderBy, onSnapshot 
} from '../firebase-config.js';

export function initStaffPage() {
    
    // Guard Clause
    const page = document.getElementById('page-staff');
    if (!page) return;

    // --- 1. DOM ELEMENTS ---
    const staffListBody = document.getElementById('staff-list-body');
    const openStaffModalBtn = document.getElementById('add-staff-btn');
    const staffModal = document.getElementById('staff-modal');
    const staffModalTitle = document.getElementById('staff-modal-title');
    const closeStaffModalBtn = staffModal ? staffModal.querySelector('.close-btn[data-modal="staff-modal"]') : null;
    const staffForm = document.getElementById('staff-form');
    const staffIdInput = document.getElementById('staff-id');
    const staffNameInput = document.getElementById('staff-name');

    // --- 2. HELPER FUNCTIONS ---
    function openStaffModal(mode = 'add', rider = null) {
        if (!staffModal) return;
        staffForm.reset();
        staffIdInput.value = '';

        if (mode === 'add') {
            staffModalTitle.textContent = 'Add New Rider';
        } else if (mode === 'edit' && rider) {
            staffModalTitle.textContent = 'Edit Rider';
            staffIdInput.value = rider.id;
            staffNameInput.value = rider.name;
        }
        staffModal.style.display = 'block';
    }

    function closeStaffModal() {
        if (staffModal) staffModal.style.display = 'none';
    }

    // --- 3. LOAD & RENDER STAFF LIST ---
    function loadStaffList() {
        if (!staffListBody) return;
        
        const q = query(collection(db, "riders"), orderBy("name"));
        
        onSnapshot(q, (snapshot) => {
            staffListBody.innerHTML = ''; 
            
            if (snapshot.empty) {
                staffListBody.innerHTML = '<tr><td colspan="2" style="text-align: center;">No riders added yet.</td></tr>';
                return;
            }

            snapshot.forEach(doc => {
                const rider = { id: doc.id, ...doc.data() };
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${rider.name}</td>
                    <td style="display: flex; gap: 10px;">
                        <button class="btn btn-secondary btn-edit-staff" data-id="${rider.id}" data-name="${rider.name}" style="padding: 5px 10px;">
                            <i class="fa-solid fa-pencil"></i> Edit
                        </button>
                        <button class="btn btn-danger btn-delete-staff" data-id="${rider.id}" data-name="${rider.name}" style="padding: 5px 10px; background-color: var(--primary-red); color: white; border: none;">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                staffListBody.appendChild(row);
            });
        });
    }

    // --- 4. SAVE/UPDATE STAFF ---
    async function handleStaffFormSubmit(e) {
        e.preventDefault();
        if (!staffNameInput.value) return;

        const riderId = staffIdInput.value;
        const riderName = staffNameInput.value;
        
        const riderData = {
            name: riderName
        };

        try {
            if (riderId) {
                // EDIT MODE
                const docRef = doc(db, "riders", riderId);
                await updateDoc(docRef, riderData);
                alert('Rider updated successfully!');
            } else {
                // ADD MODE
                await addDoc(collection(db, "riders"), riderData);
                alert('Rider added successfully!');
            }
            closeStaffModal();
        } catch (error) {
            console.error("Error saving rider: ", error);
            alert('Failed to save rider.');
        }
    }

    // --- 5. DELETE STAFF ---
    async function handleDeleteStaff(riderId, riderName) {
        if (!riderId || !riderName) return;
        
        if (confirm(`Are you sure you want to delete rider "${riderName}"?`)) {
            try {
                await deleteDoc(doc(db, "riders", riderId));
                alert('Rider deleted successfully!');
            } catch (error) {
                console.error("Error deleting rider: ", error);
                alert('Failed to delete rider.');
            }
        }
    }

    // --- 6. EVENT LISTENERS SETUP ---
    function setupStaffEventListeners() {
        // Modal buttons
        if (openStaffModalBtn) {
            openStaffModalBtn.addEventListener('click', () => openStaffModal('add'));
        }
        if (closeStaffModalBtn) {
            closeStaffModalBtn.addEventListener('click', closeStaffModal);
        }
        window.addEventListener('click', (e) => {
            if (e.target == staffModal) closeStaffModal();
        });

        // Form submit
        if (staffForm) {
            staffForm.addEventListener('submit', handleStaffFormSubmit);
        }

        // Edit/Delete buttons (Event Delegation)
        if (staffListBody) {
            staffListBody.addEventListener('click', (e) => {
                const editButton = e.target.closest('.btn-edit-staff');
                const deleteButton = e.target.closest('.btn-delete-staff');

                if (editButton) {
                    const riderId = editButton.dataset.id;
                    const riderName = editButton.dataset.name;
                    openStaffModal('edit', { id: riderId, name: riderName });
                } 
                else if (deleteButton) {
                    const riderId = deleteButton.dataset.id;
                    const riderName = deleteButton.dataset.name;
                    handleDeleteStaff(riderId, riderName);
                }
            });
        }
    }

    // --- 7. INITIALIZATION ---
    setupStaffEventListeners();
    loadStaffList();
}