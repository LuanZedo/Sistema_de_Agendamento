// State Management
const state = {
    service: 'Corte Masculino',
    price: 40,
    duration: '30 min',
    professional: 'Lucas Almeida',
    date: '12 de nov. de 2025',
    time: '11:00',
    userName: 'João Silva',
    userPhone: '(11) 99999-1234'
};

// Switch View (Client vs Dashboard)
function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.switch-btn').forEach(el => el.classList.remove('active'));

    if (viewName === 'client') {
        document.getElementById('client-view').classList.add('active');
        document.getElementById('btn-client-view').classList.add('active');
    } else {
        document.getElementById('dashboard-view').classList.add('active');
        document.getElementById('btn-dashboard-view').classList.add('active');
    }
}

// Toggle Phone Mockup Mode
function toggleMockup() {
    const wrapper = document.getElementById('phone-wrapper');
    const btnText = document.getElementById('mockup-btn-text');
    
    wrapper.classList.toggle('flat-mode');
    if (wrapper.classList.contains('flat-mode')) {
        btnText.innerText = '📱 Ativar Mockup de Celular';
    } else {
        btnText.innerText = '📱 Desativar Mockup de Celular';
    }
}

// Navigation between Steps
function goToStep(stepNumber) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${stepNumber}`).classList.add('active');

    // Update Stepper Footer (only for steps 1-4)
    const footer = document.getElementById('stepper-footer');
    if (stepNumber <= 4) {
        footer.style.display = 'flex';
        document.querySelectorAll('.step-item').forEach((el, idx) => {
            if (idx + 1 <= stepNumber) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    } else {
        footer.style.display = 'none'; // Hide on success step
    }
}

// Service Selection
function selectService(name, price, duration) {
    state.service = name;
    state.price = price;
    state.duration = duration;

    // Update UI Summary
    document.getElementById('summary-service').innerText = name;
    document.getElementById('summary-price').innerText = `R$ ${price},00`;
    
    goToStep(2);
}

// Professional Selection
function selectPro(name) {
    state.professional = name;
    document.getElementById('summary-pro').innerText = name;
}

// Date Selection
function selectDate(dateStr) {
    state.date = dateStr;
    document.getElementById('summary-date').innerText = dateStr;
}

// Time Selection
function selectTime(timeStr, element) {
    state.time = timeStr;
    document.querySelectorAll('.slot').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('summary-time').innerText = timeStr;
}

// Confirm Booking Form Submit
function confirmBooking(event) {
    event.preventDefault();
    state.userName = document.getElementById('user-name').value;
    state.userPhone = document.getElementById('user-phone').value;

    // Update Receipt Screen
    document.getElementById('rec-service').innerText = state.service;
    document.getElementById('rec-pro').innerText = state.professional;
    document.getElementById('rec-date').innerText = state.date;
    document.getElementById('rec-time').innerText = state.time;
    document.getElementById('rec-price').innerText = `R$ ${state.price},00`;

    // Update Dashboard Agenda Slot dynamically
    const dynamicSlot = document.getElementById('dynamic-booking-slot');
    if (dynamicSlot) {
        dynamicSlot.innerHTML = `<strong>${state.userName}</strong><p>${state.service}</p>`;
    }

    goToStep(5);
}

// Toast Notification Helper
function showNotification(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}