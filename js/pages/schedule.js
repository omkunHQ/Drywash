// js/pages/schedule.js

import { 
    db, doc, collection, getDocs, setDoc, deleteDoc, 
    updateDoc, query, where, onSnapshot 
} from '../firebase-config.js';

export function initSchedulePage() {
    
    // Guard Clause
    const page = document.getElementById('page-schedule');
    if (!page) return;

    // --- 1. DOM ELEMENTS ---
    const calendarEl = document.getElementById('schedule-calendar');
    const scheduleModal = document.getElementById('schedule-modal');
    const form = document.getElementById('schedule-form');
    const modalTitle = document.getElementById('schedule-modal-title');
    const openModalBtn = document.getElementById('add-schedule-event-btn');
    const closeModalBtn = scheduleModal ? scheduleModal.querySelector('.close-btn[data-modal="schedule-modal"]') : null;
    const deleteBtn = document.getElementById('delete-event-btn');
    
    // Form fields
    const eventIdInput = document.getElementById('event-id');
    const eventOrderSelect = document.getElementById('event-order-select');
    const eventTitleInput = document.getElementById('event-title'); // Hidden
    const eventTypeInput = document.getElementById('event-type');
    const eventRiderSelect = document.getElementById('event-rider-select');
    const eventDateInput = document.getElementById('event-date');
    const eventTimeInput = document.getElementById('event-time');

    // Recurring
    const isRecurringCheckbox = document.getElementById('is-recurring');
    const recurringOptionsDiv = document.getElementById('recurring-options');
    const recurringDaysContainer = document.getElementById('recurring-days');
    const recurringDaysButtons = recurringDaysContainer ? recurringDaysContainer.querySelectorAll('.day-btn') : [];
    const recurringEndDateInput = document.getElementById('recurring-end-date');

    // Route Optimize
    const routeRiderSelect = document.getElementById('route-rider-select');
    const optimizeRouteBtn = document.getElementById('optimize-route-btn');
    const YOUR_SHOP_ADDRESS = "Aapka Shop Address Yahaan Daalein"; // IMPORTANT
    
    // --- 2. STATE & CALENDAR OBJECT ---
    let calendar;
    let selectedRecurringDays = [];
    
    // --- 3. MODAL & DATA FUNCTIONS ---
    function openModalForCreate(dateStr) {
        if (!scheduleModal) return; 
        form.reset();
        modalTitle.textContent = 'Add New Entry';
        deleteBtn.style.display = 'none';
        eventIdInput.value = '';
        
        loadOrdersIntoDropdown(); 
        loadRidersIntoDropdown(eventRiderSelect);
        
        eventOrderSelect.style.display = 'block';
        eventDateInput.value = dateStr;
        
        isRecurringCheckbox.checked = false;
        if(recurringOptionsDiv) recurringOptionsDiv.style.display = 'none';
        recurringDaysButtons.forEach(btn => btn.classList.remove('active'));
        selectedRecurringDays = [];
        
        scheduleModal.style.display = 'block'; 
    }
    
    async function openModalForEdit(event) { 
        if (!scheduleModal) return; 
        form.reset();
        modalTitle.textContent = 'Edit Entry';
        deleteBtn.style.display = 'block';
        
        await loadOrdersIntoDropdown();
        await loadRidersIntoDropdown(eventRiderSelect); 
        
        eventIdInput.value = event.id;
        eventTitleInput.value = event.title;
        eventTypeInput.value = event.extendedProps.type;
        eventRiderSelect.value = event.extendedProps.riderId || "";
        
        const eventDate = new Date(event.start);
        eventDateInput.value = eventDate.toISOString().split('T')[0];
        if (!event.allDay) {
            eventTimeInput.value = eventDate.toTimeString().split(' ')[0].substring(0, 5);
        }

        if (event.extendedProps.orderId) {
            eventOrderSelect.style.display = 'none';
        } else {
            eventOrderSelect.style.display = 'block';
        }

        if (event.extendedProps.isRecurring) {
            isRecurringCheckbox.checked = true;
            recurringOptionsDiv.style.display = 'block';
            const rule = event.extendedProps.recurringRule;
            selectedRecurringDays = rule.days;
            recurringDaysButtons.forEach(btn => {
                if (rule.days.includes(btn.dataset.day)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            recurringEndDateInput.value = rule.end || '';
        } else {
            isRecurringCheckbox.checked = false;
            recurringOptionsDiv.style.display = 'none';
        }
        
        scheduleModal.style.display = 'block'; 
    }
    
    function closescheduleModal() {
        if (scheduleModal) scheduleModal.style.display = 'none';
    }
    
    function getEventColor(type) {
        return (type === 'PICKUP') ? '#3699FF' : '#50CD89';
    }

    // --- Feature: Data Loading Functions (Firebase) ---
    async function loadOrdersIntoDropdown() {
        if (!eventOrderSelect) return;
        
        eventOrderSelect.innerHTML = '<option value="">-- Select an Order --</option><option value="CUSTOM">-- Custom (No Order) --</option>';

        const q = query(collection(db, "orders"), 
                        where("status", "in", ["PENDING", "READY"]));
        
        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const order = { id: doc.id, ...doc.data() };
                const option = document.createElement('option');
                option.value = JSON.stringify(order); 
                option.textContent = `${order.id.substring(0,6)} - ${order.customerName} (${order.status})`;
                eventOrderSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error loading orders into dropdown: ", error);
        }
    }
    
    async function loadRidersIntoDropdown(selectElement) {
        if (!selectElement) return;
        
        // Cache check
        if(selectElement.options.length > 2 && selectElement.id === 'event-rider-select') return; 

        console.log(`Loading riders for ${selectElement.id}...`);
        selectElement.innerHTML = (selectElement.id === 'event-rider-select') 
            ? '<option value="">-- Unassigned --</option>' 
            : '<option value="">-- Select Rider --</option>';
        
        try {
            const querySnapshot = await getDocs(collection(db, "riders"));
            querySnapshot.forEach((doc) => {
                const rider = { id: doc.id, ...doc.data() };
                const option = document.createElement('option');
                option.value = rider.id;
                option.textContent = rider.name;
                selectElement.appendChild(option);
            });
            
            // Clone options from modal select to route select to avoid second fetch
            if(selectElement.id === 'event-rider-select' && routeRiderSelect) {
                 routeRiderSelect.innerHTML = selectElement.innerHTML;
                 routeRiderSelect.options[0].textContent = '-- Select Rider --';
            }
            
        } catch (error) {
            console.error("Error loading riders into dropdown: ", error);
        }
    }

    // --- 4. CALENDAR INITIALIZATION ---
    function initCalendar() {
        if (!calendarEl) {
            console.warn("Calendar element not found. Skipping init.");
            return;
        }
        if (calendar) { 
            return;
        }

        console.log("Initializing Calendar...");
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek,dayGridDay'
            },
            editable: true,
            
            events: function(fetchInfo, successCallback, failureCallback) {
                const q = query(collection(db, "schedule"));
                
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    let events = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        
                        if (data.daysOfWeek) { // Recurring event
                            events.push({
                                id: doc.id,
                                title: data.title,
                                daysOfWeek: data.daysOfWeek,
                                startTime: data.startTime,
                                endTime: data.endTime,
                                startRecur: data.startRecur,
                                endRecur: data.endRecur,
                                backgroundColor: data.backgroundColor,
                                borderColor: data.borderColor,
                                extendedProps: data.extendedProps
                            });
                        } 
                        else { // Normal event
                            events.push({
                                id: doc.id,
                                title: data.title,
                                start: data.start.toDate(), 
                                allDay: data.allDay,
                                backgroundColor: data.backgroundColor,
                                borderColor: data.borderColor,
                                extendedProps: data.extendedProps
                            });
                        }
                    });
                    successCallback(events);
                }, (error) => {
                    console.error("Error fetching schedule: ", error);
                    failureCallback(error);
                });
            },

            dateClick: (info) => openModalForCreate(info.dateStr),
            eventClick: (info) => openModalForEdit(info.event),
            
            eventDrop: async (info) => { 
                try {
                    const eventRef = doc(db, "schedule", info.event.id);
                    await updateDoc(eventRef, {
                        start: info.event.start 
                    });
                    console.log("Event drop updated in Firebase!");
                } catch (error) {
                    console.error("Error updating event drop:", error);
                }
            }
        });
        
        calendar.render();
    }

    // --- 5. EVENT LISTENERS SETUP ---
    if(openModalBtn) openModalBtn.addEventListener('click', () => openModalForCreate(new Date().toISOString().split('T')[0]));
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closescheduleModal);
    }

    window.addEventListener('click', (e) => {
        if (e.target == scheduleModal) closescheduleModal();
    });

    if(isRecurringCheckbox) isRecurringCheckbox.addEventListener('change', () => {
        recurringOptionsDiv.style.display = isRecurringCheckbox.checked ? 'block' : 'none';
    });

    recurringDaysButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            const day = btn.dataset.day;
            if (btn.classList.contains('active')) {
                selectedRecurringDays.push(day);
            } else {
                selectedRecurringDays = selectedRecurringDays.filter(d => d !== day);
            }
        });
    });

    if(form) form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = eventIdInput.value;
        const type = eventTypeInput.value;
        const date = eventDateInput.value;
        const time = eventTimeInput.value;
        
        const selectedRiderId = eventRiderSelect.value;
        const selectedRiderName = selectedRiderId ? eventRiderSelect.options[eventRiderSelect.selectedIndex].text : null;
        const riderPrefix = selectedRiderName ? `[${selectedRiderName}] ` : "[Unassigned] ";
        
        let title = '';
        let extendedProps = {
            type: type,
            riderId: selectedRiderId,
            riderName: selectedRiderName
        };
        
        const selectedOrderValue = eventOrderSelect.value;
        if (!id && !selectedOrderValue) { // Only require on create
            alert('Please select an order or a custom task.');
            return;
        }

        if (selectedOrderValue === "CUSTOM") {
            title = prompt("Please enter a custom title for this event:", "Custom Task");
            if (!title) return;
            extendedProps.customerName = "Custom";
        } else if (selectedOrderValue) { // if an order is selected
            const order = JSON.parse(selectedOrderValue);
            const typeText = (type === 'PICKUP') ? 'Pickup' : 'Delivery';
            title = `${typeText} - ${order.customerName} (${order.id.substring(0,6)})`;
            
            extendedProps.orderId = order.id;
            extendedProps.customerName = order.customerName;
            extendedProps.customerPhone = order.customerPhone;
            extendedProps.customerAddress = order.address || null; // Zaroori
        }

        if (id) { 
            let oldTitle = eventTitleInput.value.replace(/^\[.*?\]\s*/, "");
            title = riderPrefix + oldTitle;
        } else {
            title = riderPrefix + title;
        }
        
        eventTitleInput.value = title; 

        let newEventData = {
            id: id || doc(collection(db, "schedule")).id, // Nayi ID
            title: title,
            backgroundColor: getEventColor(type),
            borderColor: getEventColor(type),
            extendedProps: extendedProps
        };
        
        if (isRecurringCheckbox.checked) {
            if (selectedRecurringDays.length === 0) {
                alert('Please select at least one day for recurring event.');
                return;
            }
            newEventData.daysOfWeek = selectedRecurringDays;
            newEventData.startTime = time || '09:00:00';
            newEventData.startRecur = date;
            if (recurringEndDateInput.value) {
                newEventData.endRecur = recurringEndDateInput.value;
            }
            
            extendedProps.isRecurring = true;
            extendedProps.recurringRule = {
                freq: 'WEEKLY',
                days: selectedRecurringDays,
                end: recurringEndDateInput.value || null
            };
        } else {
            // Normal event
            if (time) {
                newEventData.start = new Date(`${date}T${time}:00`); 
                newEventData.allDay = false;
            } else {
                newEventData.start = new Date(date);
                newEventData.allDay = true;
            }
            // Remove any old recurring fields if editing
            newEventData.daysOfWeek = deleteDoc; // Firestore delete field
            newEventData.startTime = deleteDoc;
            // ... etc
        }

        try {
            const eventRef = doc(db, "schedule", newEventData.id);
            await setDoc(eventRef, newEventData, { merge: true }); // Use merge:true
            
            console.log("Event saved to Firebase!");
            closescheduleModal();
        } catch (error) {
            console.error("Error saving event:", error);
            alert("Failed to save event.");
        }
    });
    
    if(deleteBtn) deleteBtn.addEventListener('click', async () => {
        const id = eventIdInput.value;
        if (id && confirm('Are you sure you want to delete this entry?')) {
            try {
                await deleteDoc(doc(db, "schedule", id));
                console.log("Event deleted from Firebase!");
                closescheduleModal();
            } catch (error) {
                console.error("Error deleting event:", error);
                alert('Failed to delete event.');
            }
        }
    });

    if (optimizeRouteBtn) {
        optimizeRouteBtn.addEventListener('click', async () => {
            const riderId = routeRiderSelect.value;
            if (!riderId) {
                alert('Please select a rider to optimize.');
                return;
            }
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const todayDayOfWeek = String(today.getDay());

            // 1. Aaj ke normal tasks
            const q1 = query(collection(db, "schedule"),
                where("extendedProps.riderId", "==", riderId),
                where("start", ">=", today),
                where("start", "<", tomorrow)
            );
            
            // 2. Aaj ke recurring tasks
            const q2 = query(collection(db, "schedule"),
                where("extendedProps.riderId", "==", riderId),
                where("daysOfWeek", "array-contains", todayDayOfWeek)
            );
            
            try {
                const [normalTasksSnapshot, recurringTasksSnapshot] = await Promise.all([
                    getDocs(q1),
                    getDocs(q2)
                ]);

                let tasksForToday = [];
                normalTasksSnapshot.forEach(doc => tasksForToday.push(doc.data()));
                recurringTasksSnapshot.forEach(doc => tasksForToday.push(doc.data()));

                if (tasksForToday.length === 0) {
                    alert('No tasks found for this rider today.');
                    return;
                }
                
                const addresses = tasksForToday
                    .map(task => task.extendedProps.customerAddress)
                    .filter(addr => addr); // Sirf woh task jinka address hai

                if (addresses.length === 0) {
                    alert('No tasks with valid addresses found for today.');
                    return;
                }

                // Google Maps URL banayein
                let mapsUrl = `https://www.google.com/maps/dir/`;
                mapsUrl += `${encodeURIComponent(YOUR_SHOP_ADDRESS)}/`; // Origin
                mapsUrl += addresses.map(addr => encodeURIComponent(addr)).join('/');
                mapsUrl += `/${encodeURIComponent(YOUR_SHOP_ADDRESS)}`; // Waapis
                
                console.log("Opening Maps URL:", mapsUrl);
                window.open(mapsUrl, '_blank');
                
            } catch (error) {
                console.error("Error optimizing route: ", error);
                alert('Could not get tasks for optimization.');
            }
        });
    }

    // --- 6. INITIALIZATION ---
    // Page load hote hi run karein
    initCalendar();
    loadRidersIntoDropdown(eventRiderSelect);
    // Note: loadRidersIntoDropdown() ab automatically routeRiderSelect ko bhi populate kar dega.
}