// BloodConnect Global Controller Logic

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLocalDB();
    
    // Page-specific routing logic based on DOM elements
    if (document.getElementById('stat-donors')) {
        initHomeStats();
    }
    if (document.getElementById('register-form')) {
        initRegisterForm();
    }
    if (document.getElementById('search-btn') || document.getElementById('search-city')) {
        initSearchPage();
    }
    if (document.getElementById('urgency-container')) {
        initUrgencyBoard();
    }
    if (document.getElementById('admin-donors-table')) {
        initAdminPortal();
    }
    if (document.getElementById('admin-login-form')) {
        initAdminLoginForm();
    }
});

// ==========================================
// 1. Theme Controller (Dark/Light Persistence)
// ==========================================
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    if (!themeToggle || !themeIcon) return;

    // Apply saved theme
    const savedTheme = localStorage.getItem('bloodconnect-theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeIcon.className = 'fa-solid fa-sun';
    } else {
        document.body.classList.remove('dark-theme');
        themeIcon.className = 'fa-solid fa-moon';
    }

    // Toggle event listener
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        if (isDark) {
            localStorage.setItem('bloodconnect-theme', 'dark');
            themeIcon.className = 'fa-solid fa-sun';
            
            // Re-trigger Leaflet dark-style map update if on search page
            if (window.leafletMapRef) {
                updateLeafletTheme('dark');
            }
        } else {
            localStorage.setItem('bloodconnect-theme', 'light');
            themeIcon.className = 'fa-solid fa-moon';
            
            if (window.leafletMapRef) {
                updateLeafletTheme('light');
            }
        }
    });
}

// ==========================================
// 2. Mock Local Database Core
// ==========================================
function initLocalDB() {
    // Initial Seed Donors
    if (!localStorage.getItem('bc-donors')) {
        const seedDonors = [
            { id: 1, name: 'Rahul Sharma', bloodGroup: 'O+', city: 'Delhi', phone: '9876543210', email: 'rahul@gmail.com', active: true, registeredAt: '2026-05-10' },
            { id: 2, name: 'Priya Patel', bloodGroup: 'B+', city: 'Mumbai', phone: '9123456789', email: 'priya@yahoo.com', active: true, registeredAt: '2026-05-12' },
            { id: 3, name: 'Amit Verma', bloodGroup: 'A-', city: 'Delhi', phone: '9898989898', email: 'amit.v@outlook.com', active: true, registeredAt: '2026-05-15' },
            { id: 4, name: 'Sneha Reddy', bloodGroup: 'AB+', city: 'Bangalore', phone: '8877665544', email: 'sneha@rediff.com', active: true, registeredAt: '2026-05-18' },
            { id: 5, name: 'Vikram Singh', bloodGroup: 'O-', city: 'Jaipur', phone: '7766554433', email: 'vikram.s@gmail.com', active: false, registeredAt: '2026-05-20' },
            { id: 6, name: 'Ananya Sen', bloodGroup: 'A+', city: 'Kolkata', phone: '9988776655', email: 'ananya@gmail.com', active: true, registeredAt: '2026-05-22' },
            { id: 7, name: 'Rohan Joshi', bloodGroup: 'O+', city: 'Mumbai', phone: '9000012345', email: 'rohan.j@gmail.com', active: true, registeredAt: '2026-05-24' }
        ];
        localStorage.setItem('bc-donors', JSON.stringify(seedDonors));
    }

    // Initial Seed Urgent Requests
    if (!localStorage.getItem('bc-requests')) {
        const seedRequests = [
            { id: 1, patientName: 'Rajesh Gupta', bloodGroup: 'O-', hospital: 'Fortis Hospital', city: 'Delhi', phone: '9876543210', urgency: 'critical', status: 'pending', createdAt: '2026-05-28' },
            { id: 2, patientName: 'Meera Deshmukh', bloodGroup: 'AB+', hospital: 'Lilavati Hospital', city: 'Mumbai', phone: '9123456789', urgency: 'medium', status: 'fulfilled', createdAt: '2026-05-27' },
            { id: 3, patientName: 'Suresh Kumar', bloodGroup: 'B+', hospital: 'Apollo Clinic', city: 'Bangalore', phone: '8877665544', urgency: 'low', status: 'pending', createdAt: '2026-05-29' }
        ];
        localStorage.setItem('bc-requests', JSON.stringify(seedRequests));
    }
}

function getDonors() {
    return JSON.parse(localStorage.getItem('bc-donors') || '[]');
}

function saveDonors(donors) {
    localStorage.setItem('bc-donors', JSON.stringify(donors));
}

function getRequests() {
    return JSON.parse(localStorage.getItem('bc-requests') || '[]');
}

function saveRequests(requests) {
    localStorage.setItem('bc-requests', JSON.stringify(requests));
}

// ==========================================
// 3. Home Screen Stats Animator
// ==========================================
function initHomeStats() {
    Promise.all([
        fetch("http://localhost:5000/donors").then(res => res.json()),
        fetch("http://localhost:5000/requests").then(res => res.json())
    ])
    .then(([donorsData, requestsData]) => {
        const donors = donorsData.filter(d => d.active).length;
        const fulfilled = requestsData.filter(r => r.status === 'fulfilled').length;
        
        // Dynamic calculation
        const donorsCount = donors + 142; // base offset to make it look active
        const fulfilledCount = fulfilled + 53; 
        const savedCount = (donorsCount * 3) + (fulfilledCount * 4);

        animateCounter('stat-donors', donorsCount, 1500);
        animateCounter('stat-fulfilled', fulfilledCount, 1500);
        animateCounter('stat-saved', savedCount, 1800);
    })
    .catch(err => {
        console.error("Failed to fetch home statistics:", err);
        // Fallback to local storage
        const donors = getDonors().filter(d => d.active).length;
        const requests = getRequests();
        const fulfilled = requests.filter(r => r.status === 'fulfilled').length;
        
        const donorsCount = donors + 142;
        const fulfilledCount = fulfilled + 53; 
        const savedCount = (donorsCount * 3) + (fulfilledCount * 4);

        animateCounter('stat-donors', donorsCount, 1500);
        animateCounter('stat-fulfilled', fulfilledCount, 1500);
        animateCounter('stat-saved', savedCount, 1800);
    });
}

function animateCounter(id, target, duration) {
    const element = document.getElementById(id);
    if (!element) return;
    
    let start = 0;
    const increment = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = start + '+';
        }
    }, 16);
}

// ==========================================
// 4. Become a Donor Form Controller
// ==========================================
function initRegisterForm() {
    const bloodChips = document.querySelectorAll('.blood-chip');
    const selectedGroupInput = document.getElementById('selected-blood-group');
    const form = document.getElementById('register-form');
    const modal = document.getElementById('success-modal');
    const modalClose = document.getElementById('modal-close-btn');

    // Handle Blood Chips Selection
    bloodChips.forEach(chip => {
        chip.addEventListener('click', () => {
            bloodChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedGroupInput.value = chip.dataset.group;
        });
    });

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('donor-name').value.trim();
            const group = selectedGroupInput.value;
            const city = document.getElementById('donor-city').value.trim();
            const phone = document.getElementById('donor-phone').value.trim();
            const email = document.getElementById('donor-email').value.trim();
            const emergencyToggle = document.getElementById('availability-toggle').checked;

            if (!group) {
                alert('Please select a Blood Group.');
                return;
            }
            fetch("http://localhost:5000/register-donor", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    bloodGroup: group,
                    city,
                    phone,
                    email,
                    active: emergencyToggle
                })
            })
            .then(res => res.json())
            .then(data => {
                console.log(data);
                if (data.success) {
                    if (modal) {
                        modal.classList.add('active');
                    } else {
                        alert('Registration successful!');
                        window.location.href = 'search.html';
                    }
                } else {
                    alert("Failed to register donor: " + data.message);
                }
            })
            .catch(err => {
                console.log(err);
                alert("Failed to register donor");
            });
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.classList.remove('active');
            window.location.href = 'search.html';
        });
    }
}

// ==========================================
// 5. Blood Finder and Map Controller
// ==========================================
function initSearchPage() {
    const searchGroup = document.getElementById('search-group');
    const searchCity = document.getElementById('search-city');
    const donorsList = document.getElementById('donors-list');
    const recordsCount = document.getElementById('records-count');
    const mockMap = document.querySelector('.mock-map');

    function renderSearchResults() {
        if (!donorsList) return;

        const groupFilter = searchGroup.value;
        const cityFilter = searchCity.value.trim().toLowerCase();

        fetch("http://localhost:5000/donors")
            .then(res => res.json())
            .then(data => {
                const donors = data
                    .map(d => ({
                        id: d.id,
                        name: d.name,
                        bloodGroup: d.blood_group,
                        city: d.city,
                        phone: d.phone,
                        email: d.email,
                        active: d.active,
                        registeredAt: d.registered_at
                    }))
                    .filter(d => d.active);

                const filtered = donors.filter(donor => {
                    const matchesGroup = !groupFilter || donor.bloodGroup === groupFilter;
                    const matchesCity = !cityFilter || donor.city.toLowerCase().includes(cityFilter);
                    return matchesGroup && matchesCity;
                });

                recordsCount.textContent = filtered.length;
                donorsList.innerHTML = "";

                if (filtered.length === 0) {
                    donorsList.innerHTML = `
                        <div class="glass-card text-center" style="grid-column: 1/-1; padding: 40px 20px;">
                            <i class="fa-solid fa-circle-info" style="font-size: 3rem; color: var(--primary); margin-bottom: 16px;"></i>
                            <h3>No Active Donors Found</h3>
                            <p style="color: var(--text-secondary); margin-top: 8px;">Try changing the filter options or expand search coordinates.</p>
                        </div>
                    `;
                    return;
                }

                filtered.forEach(donor => {
                    const waText = encodeURIComponent(`Hello ${donor.name}, I found your contact on BloodConnect. We urgently require ${donor.bloodGroup} blood in ${donor.city}. Can you please help?`);
                    const waLink = `https://wa.me/91${donor.phone}?text=${waText}`;

                    const card = document.createElement("div");
                    card.className = "donor-row-card";
                    card.innerHTML = `
                        <div class="donor-info">
                            <div class="donor-avatar">${donor.bloodGroup}</div>
                            <div class="donor-details">
                                <h4>${donor.name}</h4>
                                <p><i class="fa-solid fa-location-dot"></i> ${donor.city} &bull; <i class="fa-solid fa-clock"></i> Active Now</p>
                            </div>
                        </div>
                        <div class="donor-meta">
                            <a href="${waLink}" target="_blank" class="btn primary-btn" style="padding: 8px 16px; font-size: 13px;">
                                <i class="fa-brands fa-whatsapp"></i> SOS Alert
                            </a>
                        </div>
                    `;
                    donorsList.appendChild(card);
                });

                updateMockMapPins(filtered);
            })
            .catch(err => {
                console.error("Failed to fetch donors from API, falling back to local storage:", err);
                const donors = getDonors().filter(d => d.active);
                const filtered = donors.filter(donor => {
                    const matchesGroup = !groupFilter || donor.bloodGroup === groupFilter;
                    const matchesCity = !cityFilter || donor.city.toLowerCase().includes(cityFilter);
                    return matchesGroup && matchesCity;
                });

                recordsCount.textContent = filtered.length;
                donorsList.innerHTML = "";

                if (filtered.length === 0) {
                    donorsList.innerHTML = `
                        <div class="glass-card text-center" style="grid-column: 1/-1; padding: 40px 20px;">
                            <i class="fa-solid fa-circle-info" style="font-size: 3rem; color: var(--primary); margin-bottom: 16px;"></i>
                            <h3>No Active Donors Found</h3>
                        </div>
                    `;
                    return;
                }

                filtered.forEach(donor => {
                    const waText = encodeURIComponent(`Hello ${donor.name}, I found your contact on BloodConnect. We urgently require ${donor.bloodGroup} blood in ${donor.city}. Can you please help?`);
                    const waLink = `https://wa.me/91${donor.phone}?text=${waText}`;

                    const card = document.createElement("div");
                    card.className = "donor-row-card";
                    card.innerHTML = `
                        <div class="donor-info">
                            <div class="donor-avatar">${donor.bloodGroup}</div>
                            <div class="donor-details">
                                <h4>${donor.name}</h4>
                                <p><i class="fa-solid fa-location-dot"></i> ${donor.city} &bull; <i class="fa-solid fa-clock"></i> Active Now</p>
                            </div>
                        </div>
                        <div class="donor-meta">
                            <a href="${waLink}" target="_blank" class="btn primary-btn" style="padding: 8px 16px; font-size: 13px;">
                                <i class="fa-brands fa-whatsapp"></i> SOS Alert
                            </a>
                        </div>
                    `;
                    donorsList.appendChild(card);
                });

                updateMockMapPins(filtered);
            });
    }

    // Set search events
    if (searchGroup) searchGroup.addEventListener('change', renderSearchResults);
    if (searchCity) searchCity.addEventListener('input', renderSearchResults);

    // Initial load search render
    renderSearchResults();
}

// Draw dynamic animated markers inside mock Leaflet map representing coordinate simulation
function updateMockMapPins(filteredDonors) {
    const mockMap = document.querySelector('.mock-map');
    if (!mockMap) return;

    // Clear old pins except center ripple
    const oldPins = mockMap.querySelectorAll('.map-pin');
    oldPins.forEach(p => p.remove());

    const centerCity = document.getElementById('search-city').value || 'Delhi';
    
    // Preset coordinates for beautiful visual look
    const offsets = [
        { top: '30%', left: '40%', name: 'City Hospital' },
        { top: '65%', left: '25%', name: 'Red Cross Center' },
        { top: '45%', left: '70%', name: 'Sanjivani Blood Bank' },
        { top: '20%', left: '60%', name: 'Apex Blood Bank' },
        { top: '75%', left: '55%', name: 'Metro Clinic' }
    ];

    // Map over filtered list (up to 5 items)
    filteredDonors.slice(0, 5).forEach((donor, index) => {
        const offset = offsets[index % offsets.length];
        
        const pin = document.createElement('div');
        pin.className = 'map-pin';
        pin.style.top = offset.top;
        pin.style.left = offset.left;
        pin.innerHTML = `
            <i class="fa-solid fa-droplet" style="color: var(--primary);"></i>
            <div class="pin-label">${donor.name} (${donor.bloodGroup})</div>
        `;
        
        mockMap.appendChild(pin);
    });
}

// ==========================================
// 6. Urgency Board SOS Controller
// ==========================================
function initUrgencyBoard() {
    const urgencyContainer = document.getElementById('urgency-container');
    const criticalCount = document.getElementById('critical-count');
    const openBoardBtn = document.getElementById('open-request-modal');
    const boardModal = document.getElementById('request-modal');
    const closeBoardBtn = document.getElementById('board-modal-close');
    const submitRequestForm = document.getElementById('urgency-request-form');

    function renderUrgencyBoard() {
        if (!urgencyContainer) return;

        fetch("http://localhost:5000/pending-requests")
            .then(res => res.json())
            .then(data => {
                const pendingRequests = data.map(r => ({
                    id: r.id,
                    patientName: r.patient_name,
                    bloodGroup: r.blood_group,
                    hospital: r.hospital,
                    city: r.city,
                    phone: r.phone,
                    urgency: r.urgency,
                    status: r.status,
                    createdAt: new Date(r.created_at).toISOString().split('T')[0]
                }));

                // Critical alerts counter
                const criticalAlerts = pendingRequests.filter(r => r.urgency === 'critical').length;
                if (criticalCount) {
                    criticalCount.textContent = criticalAlerts;
                }

                urgencyContainer.innerHTML = '';

                if (pendingRequests.length === 0) {
                    urgencyContainer.innerHTML = `
                        <div class="glass-card text-center" style="grid-column: 1/-1; padding: 60px 20px;">
                            <i class="fa-solid fa-circle-check" style="font-size: 3.5rem; color: var(--success); margin-bottom: 20px;"></i>
                            <h3>No Pending Emergencies</h3>
                            <p style="color: var(--text-secondary); margin-top: 10px;">All critical cases are happily matched or fulfilled. Thank you donors!</p>
                        </div>
                    `;
                    return;
                }

                pendingRequests.forEach(request => {
                    const card = document.createElement('div');
                    card.className = `urgency-card ${request.urgency}-border`;

                    const waText = encodeURIComponent(`Urgently need blood: Group ${request.bloodGroup} for patient ${request.patientName} at ${request.hospital}, ${request.city}. Immediate contact needed!`);
                    const waLink = `https://wa.me/91${request.phone}?text=${waText}`;

                    card.innerHTML = `
                        <div class="urgency-card-header">
                            <div>
                                <h3>${request.patientName}</h3>
                                <span class="badge-urgency urgency-${request.urgency}">${request.urgency}</span>
                            </div>
                            <div class="donor-avatar" style="border-radius: 8px;">${request.bloodGroup}</div>
                        </div>
                        <div class="urgency-card-body">
                            <p><i class="fa-solid fa-hospital"></i> Hospital: ${request.hospital}</p>
                            <p><i class="fa-solid fa-location-dot"></i> City: ${request.city}</p>
                            <p><i class="fa-solid fa-phone"></i> Contact: +91 ${request.phone}</p>
                            <p><i class="fa-solid fa-calendar-days"></i> Posted: ${request.createdAt}</p>
                        </div>
                        <div class="urgency-card-footer">
                            <a href="${waLink}" target="_blank" class="btn primary-btn" style="flex: 1; padding: 10px 14px; font-size: 13px;">
                                <i class="fa-brands fa-whatsapp"></i> WhatsApp SOS
                            </a>
                            <button class="btn secondary-btn fulfill-btn" data-id="${request.id}" style="padding: 10px 14px; font-size: 13px;">
                                <i class="fa-solid fa-check"></i> Fulfill
                            </button>
                        </div>
                    `;

                    urgencyContainer.appendChild(card);
                });

                // Set Fulfill Button Clicks
                document.querySelectorAll('.fulfill-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = parseInt(btn.dataset.id);
                        fulfillUrgentRequest(id);
                    });
                });
            })
            .catch(err => {
                console.error("Failed to fetch pending requests from API, falling back to local storage:", err);
                const requests = getRequests();
                const pendingRequests = requests.filter(r => r.status === 'pending');
                const criticalAlerts = pendingRequests.filter(r => r.urgency === 'critical').length;
                if (criticalCount) {
                    criticalCount.textContent = criticalAlerts;
                }

                urgencyContainer.innerHTML = '';

                if (pendingRequests.length === 0) {
                    urgencyContainer.innerHTML = `
                        <div class="glass-card text-center" style="grid-column: 1/-1; padding: 60px 20px;">
                            <i class="fa-solid fa-circle-check" style="font-size: 3.5rem; color: var(--success); margin-bottom: 20px;"></i>
                            <h3>No Pending Emergencies</h3>
                        </div>
                    `;
                    return;
                }

                pendingRequests.forEach(request => {
                    const card = document.createElement('div');
                    card.className = `urgency-card ${request.urgency}-border`;

                    const waText = encodeURIComponent(`Urgently need blood: Group ${request.bloodGroup} for patient ${request.patientName} at ${request.hospital}, ${request.city}. Immediate contact needed!`);
                    const waLink = `https://wa.me/91${request.phone}?text=${waText}`;

                    card.innerHTML = `
                        <div class="urgency-card-header">
                            <div>
                                <h3>${request.patientName}</h3>
                                <span class="badge-urgency urgency-${request.urgency}">${request.urgency}</span>
                            </div>
                            <div class="donor-avatar" style="border-radius: 8px;">${request.bloodGroup}</div>
                        </div>
                        <div class="urgency-card-body">
                            <p><i class="fa-solid fa-hospital"></i> Hospital: ${request.hospital}</p>
                            <p><i class="fa-solid fa-location-dot"></i> City: ${request.city}</p>
                            <p><i class="fa-solid fa-phone"></i> Contact: +91 ${request.phone}</p>
                            <p><i class="fa-solid fa-calendar-days"></i> Posted: ${request.createdAt}</p>
                        </div>
                        <div class="urgency-card-footer">
                            <a href="${waLink}" target="_blank" class="btn primary-btn" style="flex: 1; padding: 10px 14px; font-size: 13px;">
                                <i class="fa-brands fa-whatsapp"></i> WhatsApp SOS
                            </a>
                            <button class="btn secondary-btn fulfill-btn" data-id="${request.id}" style="padding: 10px 14px; font-size: 13px;">
                                <i class="fa-solid fa-check"></i> Fulfill
                            </button>
                        </div>
                    `;
                    urgencyContainer.appendChild(card);
                });

                document.querySelectorAll('.fulfill-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = parseInt(btn.dataset.id);
                        fulfillUrgentRequest(id);
                    });
                });
            });
    }

    function fulfillUrgentRequest(id) {
        fetch(`http://localhost:5000/requests/${id}/fulfill`, {
            method: "PUT"
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderUrgencyBoard();
            } else {
                alert("Failed to fulfill request on server.");
            }
        })
        .catch(err => {
            console.error("Failed to fulfill request on backend, falling back to local storage:", err);
            const requests = getRequests();
            const updated = requests.map(req => {
                if (req.id === id) {
                    req.status = 'fulfilled';
                }
                return req;
            });
            saveRequests(updated);
            renderUrgencyBoard();
        });
    }

    // Modal Control
    if (openBoardBtn && boardModal) {
        openBoardBtn.addEventListener('click', () => boardModal.classList.add('active'));
    }
    if (closeBoardBtn && boardModal) {
        closeBoardBtn.addEventListener('click', () => boardModal.classList.remove('active'));
    }

    // Form Submit
    if (submitRequestForm) {
        submitRequestForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const patientName = document.getElementById('patient-name').value.trim();
            const bloodGroup = document.getElementById('patient-blood-group').value;
            const hospital = document.getElementById('patient-hospital').value.trim();
            const city = document.getElementById('patient-city').value.trim();
            const phone = document.getElementById('patient-phone').value.trim();
            const urgency = document.getElementById('patient-urgency').value;

            fetch("http://localhost:5000/requests", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    patientName,
                    bloodGroup,
                    hospital,
                    city,
                    phone,
                    urgency
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    boardModal.classList.remove('active');
                    submitRequestForm.reset();
                    renderUrgencyBoard();
                } else {
                    alert("Failed to publish emergency request.");
                }
            })
            .catch(err => {
                console.error("Failed to submit request to backend, falling back to local storage:", err);
                const requests = getRequests();
                const newReq = {
                    id: Date.now(),
                    patientName,
                    bloodGroup,
                    hospital,
                    city,
                    phone,
                    urgency,
                    status: 'pending',
                    createdAt: new Date().toISOString().split('T')[0]
                };
                requests.unshift(newReq);
                saveRequests(requests);
                boardModal.classList.remove('active');
                submitRequestForm.reset();
                renderUrgencyBoard();
            });
        });
    }

    renderUrgencyBoard();
}

// ==========================================
// 7. Admin Dashboard Analytics Portal
// ==========================================
function initAdminPortal() {
    const token = localStorage.getItem('bc-admin-token');
    if (!token) {
        window.location.href = 'admin-login.html';
        return;
    }

    const tableBody = document.getElementById('admin-donors-table');
    
    // Aggregate cards elements
    const aggDonors = document.getElementById('agg-donors');
    const aggFulfilled = document.getElementById('agg-fulfilled');
    const aggCritical = document.getElementById('agg-critical');
    const aggBbanks = document.getElementById('agg-bbanks');

    function renderPortal() {
        Promise.all([
            fetch("http://localhost:5000/donors", {
                headers: { "Authorization": `Bearer ${token}` }
            }).then(res => res.json()),
            fetch("http://localhost:5000/requests", {
                headers: { "Authorization": `Bearer ${token}` }
            }).then(res => res.json())
        ])
        .then(([donorsData, requestsData]) => {
            const donors = donorsData.map(d => ({
                id: d.id,
                name: d.name,
                bloodGroup: d.blood_group,
                city: d.city,
                phone: d.phone,
                email: d.email,
                active: d.active,
                registeredAt: new Date(d.registered_at).toISOString().split('T')[0]
            }));

            const requests = requestsData.map(r => ({
                id: r.id,
                patientName: r.patient_name,
                bloodGroup: r.blood_group,
                hospital: r.hospital,
                city: r.city,
                phone: r.phone,
                urgency: r.urgency,
                status: r.status,
                createdAt: new Date(r.created_at).toISOString().split('T')[0]
            }));

            // Cards aggregations update
            if (aggDonors) aggDonors.textContent = donors.length;
            if (aggFulfilled) aggFulfilled.textContent = requests.filter(r => r.status === 'fulfilled').length;
            if (aggCritical) aggCritical.textContent = requests.filter(r => r.status === 'pending' && r.urgency === 'critical').length;
            if (aggBbanks) aggBbanks.textContent = 25; // standard bank mock size

            // Update Charts Visually
            updateCharts(donors);

            // Render Database Sheet Table rows
            if (!tableBody) return;
            tableBody.innerHTML = '';

            donors.forEach(donor => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${donor.name}</strong></td>
                    <td><span class="donor-avatar" style="width:34px; height:34px; font-size:13px; font-weight:700;">${donor.bloodGroup}</span></td>
                    <td>${donor.city}</td>
                    <td>+91 ${donor.phone}</td>
                    <td>${donor.registeredAt}</td>
                    <td>
                        <span class="badge-status ${donor.active ? 'status-active' : 'status-inactive'}">
                            ${donor.active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        <button class="btn secondary-btn toggle-status-btn" data-id="${donor.id}" style="padding:6px 12px; font-size:11px; margin-right:6px;">
                            <i class="fa-solid fa-arrows-rotate"></i> Toggle
                        </button>
                        <button class="btn primary-btn delete-donor-btn" data-id="${donor.id}" style="padding:6px 12px; font-size:11px; background:var(--danger);">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            // Set action clicks
            document.querySelectorAll('.toggle-status-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.dataset.id);
                    toggleDonorStatus(id);
                });
            });

            document.querySelectorAll('.delete-donor-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to remove this donor from registry?')) {
                        const id = parseInt(btn.dataset.id);
                        deleteDonor(id);
                    }
                });
            });
        })
        .catch(err => {
            console.error("Failed to load admin portal live data, falling back to local storage:", err);
            const donors = getDonors();
            const requests = getRequests();

            if (aggDonors) aggDonors.textContent = donors.length;
            if (aggFulfilled) aggFulfilled.textContent = requests.filter(r => r.status === 'fulfilled').length;
            if (aggCritical) aggCritical.textContent = requests.filter(r => r.status === 'pending' && r.urgency === 'critical').length;
            if (aggBbanks) aggBbanks.textContent = 25;

            updateCharts(donors);

            if (!tableBody) return;
            tableBody.innerHTML = '';

            donors.forEach(donor => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${donor.name}</strong></td>
                    <td><span class="donor-avatar" style="width:34px; height:34px; font-size:13px; font-weight:700;">${donor.bloodGroup}</span></td>
                    <td>${donor.city}</td>
                    <td>+91 ${donor.phone}</td>
                    <td>${donor.registeredAt}</td>
                    <td>
                        <span class="badge-status ${donor.active ? 'status-active' : 'status-inactive'}">
                            ${donor.active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        <button class="btn secondary-btn toggle-status-btn" data-id="${donor.id}" style="padding:6px 12px; font-size:11px; margin-right:6px;">
                            <i class="fa-solid fa-arrows-rotate"></i> Toggle
                        </button>
                        <button class="btn primary-btn delete-donor-btn" data-id="${donor.id}" style="padding:6px 12px; font-size:11px; background:var(--danger);">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            document.querySelectorAll('.toggle-status-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.dataset.id);
                    toggleDonorStatusLocalStorage(id);
                });
            });

            document.querySelectorAll('.delete-donor-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to remove this donor from registry?')) {
                        const id = parseInt(btn.dataset.id);
                        deleteDonorLocalStorage(id);
                    }
                });
            });
        });
    }

    function toggleDonorStatus(id) {
        fetch(`http://localhost:5000/donors/${id}/status`, {
            method: "PUT",
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderPortal();
            } else {
                alert("Failed to toggle donor status on server.");
            }
        })
        .catch(err => {
            console.error("Failed to toggle donor status on backend, trying local storage:", err);
            toggleDonorStatusLocalStorage(id);
        });
    }

    function toggleDonorStatusLocalStorage(id) {
        const donors = getDonors();
        const updated = donors.map(d => {
            if (d.id === id) {
                d.active = !d.active;
            }
            return d;
        });
        saveDonors(updated);
        renderPortal();
    }

    function deleteDonor(id) {
        fetch(`http://localhost:5000/donors/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderPortal();
            } else {
                alert("Failed to delete donor on server.");
            }
        })
        .catch(err => {
            console.error("Failed to delete donor on backend, trying local storage:", err);
            deleteDonorLocalStorage(id);
        });
    }

    function deleteDonorLocalStorage(id) {
        const donors = getDonors();
        const filtered = donors.filter(d => d.id !== id);
        saveDonors(filtered);
        renderPortal();
    }

    renderPortal();
}

// Render dynamic CSS bars and doughnut legends in real-time based on database records
function updateCharts(donors) {
    // 1. Bar Chart (City Distribution)
    const cityBars = {
        'Delhi': document.getElementById('bar-delhi'),
        'Mumbai': document.getElementById('bar-mumbai'),
        'Bangalore': document.getElementById('bar-bangalore'),
        'Jaipur': document.getElementById('bar-jaipur'),
        'Kolkata': document.getElementById('bar-kolkata')
    };

    const counts = { Delhi: 0, Mumbai: 0, Bangalore: 0, Jaipur: 0, Kolkata: 0 };
    donors.forEach(d => {
        const city = d.city;
        if (counts[city] !== undefined) {
            counts[city]++;
        }
    });

    const maxVal = Math.max(...Object.values(counts), 1);

    for (let city in cityBars) {
        const bar = cityBars[city];
        if (bar) {
            const valSpan = bar.querySelector('.bar-val');
            const fillDiv = bar.querySelector('.bar-fill');
            const count = counts[city];

            if (valSpan && fillDiv) {
                valSpan.textContent = count;
                const percentageHeight = (count / maxVal) * 160; // scale limit 160px
                fillDiv.style.height = `${percentageHeight}px`;
            }
        }
    }

    // 2. Doughnut Chart (Blood groups distribution)
    const groups = { 'O+': 0, 'B+': 0, 'A-': 0, 'AB+': 0, 'A+': 0, 'O-': 0 };
    donors.forEach(d => {
        if (groups[d.bloodGroup] !== undefined) {
            groups[d.bloodGroup]++;
        }
    });

    const totalGroupCount = donors.length || 1;
    
    // Render legends
    for (let group in groups) {
        const count = groups[group];
        const valElem = document.getElementById(`val-group-${group.toLowerCase().replace('+', 'p').replace('-', 'm')}`);
        if (valElem) {
            valElem.textContent = `${count} (${Math.round((count / totalGroupCount) * 100)}%)`;
        }
    }
}

// ==========================================
// 8. Admin Login Page Controller
// ==========================================
function initAdminLoginForm() {
    const loginForm = document.getElementById('admin-login-form');
    const errorContainer = document.getElementById('login-error-container');
    const errorText = document.getElementById('login-error-text');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-username').value.trim();
            const password = document.getElementById('admin-password').value.trim();

            if (errorContainer) errorContainer.style.display = 'none';

            fetch("http://localhost:5000/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.message || "Invalid credentials") });
                }
                return res.json();
            })
            .then(data => {
                if (data.success && data.token) {
                    localStorage.setItem('bc-admin-token', data.token);
                    window.location.href = 'admin.html';
                } else {
                    throw new Error("Invalid response from server.");
                }
            })
            .catch(err => {
                console.error("Login failed:", err);
                if (errorContainer && errorText) {
                    errorText.textContent = err.message || "Invalid username or password.";
                    errorContainer.style.display = 'flex';
                } else {
                    alert(err.message || "Login failed.");
                }
            });
        });
    }
}

