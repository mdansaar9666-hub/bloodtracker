// BloodLink Core Logic
// Simulating Backend with LocalStorage & Mock Data

// --- Mock Data & Initialization ---
const mockDonors = [
    { id: 1, name: "Rahul S.", blood: "O+", lat: 28.61, lon: 77.20, lastDonated: "2023-11-15", phone: "9876543210" },
    { id: 2, name: "Priya M.", blood: "A-", lat: 28.62, lon: 77.21, lastDonated: "2024-01-10", phone: "9898989898" },
    { id: 3, name: "Amit K.", blood: "O+", lat: 28.65, lon: 77.19, lastDonated: "2023-09-01", phone: "9988776655" }
];

// Load donors from LocalStorage or initialize
let donorDB = JSON.parse(localStorage.getItem('bloodLinkDonors')) || mockDonors;

function saveDonors() {
    localStorage.setItem('bloodLinkDonors', JSON.stringify(donorDB));
}

// --- Utility Functions ---

// Haversine Formula for Distance (km)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// AI Scoring Algorithm
function calculateUrgencyScore(request, donor, dist) {
    // 1. Urgency Weight (Max 40 pts)
    const urgencyWeights = { 'critical': 40, 'high': 30, 'scheduled': 15 };
    let score = urgencyWeights[request.urgency] || 15;

    // 2. Distance Factor (Max 30 pts) - Closer is better
    // If dist < 5km -> full 30, else decay
    let distScore = Math.max(0, 30 - (dist * 2));
    score += distScore;

    // 3. Blood Rarity Boost (Max 20 pts)
    const rareTypes = ['O-', 'AB-', 'B-'];
    if (rareTypes.includes(request.blood)) {
        score += 20;
    }

    // 4. Recency Score (Max 10 pts) - Encouraging regular but safe donors
    // Simple mock: Random "Reliability" factor for now
    const reliability = Math.random() * 10;
    score += reliability;

    return Math.round(score);
}

// --- DOM Interaction ---

document.addEventListener('DOMContentLoaded', () => {

    // OTP Logic System

    const otpModal = document.getElementById('otpModal');
    const otpInput = document.getElementById('otpInput');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const closeOtpBtn = document.getElementById('closeOtpBtn');
    const otpPhoneDisplay = document.getElementById('otpPhoneDisplay');

    let currentOtp = null;
    let pendingAction = null; // 'login' or 'register'
    let pendingData = null; // Data to be saved after verification

    function sendOTP(phone) {
        currentOtp = '1234'; // Mock OTP
        otpPhoneDisplay.textContent = phone;
        otpModal.classList.remove('hidden');
        otpInput.value = '';
        otpInput.focus();
        alert(`BloodLink Security Check:\nYour OTP is ${currentOtp}`);
    }

    verifyOtpBtn.addEventListener('click', () => {
        if (otpInput.value === currentOtp) {
            otpModal.classList.add('hidden');
            if (pendingAction === 'login') {
                completeLogin(pendingData);
            } else if (pendingAction === 'register') {
                completeRegistration(pendingData);
            }
        } else {
            alert('Invalid OTP. Please try again.');
            otpInput.value = '';
        }
    });

    closeOtpBtn.addEventListener('click', () => {
        otpModal.classList.add('hidden');
        pendingAction = null;
        pendingData = null;
    });

    // Donor Registration with OTP
    const donorForm = document.getElementById('donorForm');
    if (donorForm) {
        donorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const phone = document.getElementById('donorPhone').value;
            if (!phone || phone.length < 10) {
                alert("Please enter a valid phone number for verification.");
                return;
            }

            // Prepare data but don't save yet
            pendingData = {
                id: Date.now(),
                name: document.getElementById('donorName').value,
                blood: document.querySelector('input[name="donorBlood"]:checked')?.value || '',
                phone: phone,
                lat: 28.60 + (Math.random() * 0.1),
                lon: 77.20 + (Math.random() * 0.1),
                lastDonated: document.getElementById('lastDonation').value
            };

            pendingAction = 'register';
            sendOTP(phone);
        });
    }

    function completeRegistration(data) {
        donorDB.push(data);
        saveDonors();
        alert(`Verification Successful! Welcome, ${data.name}. You are now a registered hero.`);
        document.getElementById('donorForm').reset();
    }

    // Request Handling
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = requestForm.querySelector('button[type="submit"]');
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing Network...';

            const reqData = {
                blood: document.querySelector('input[name="reqBlood"]:checked')?.value || '',
                urgency: document.querySelector('input[name="urgency"]:checked').value,
                phone: document.getElementById('reqPhone').value,
                // Mock Request Location
                lat: 28.61,
                lon: 77.20
            };

            // Process Matching after delay (simulating AI processing)
            setTimeout(() => {
                const results = findMatches(reqData);
                displayResults(results);
                btn.innerHTML = 'Find Donors';
            }, 1500);
        });
    }

    // Login with OTP
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (loginBtn.innerText === 'Logout') {
                // Logout Logic
                alert("You have been logged out.");
                loginBtn.innerText = 'Login';
                loginBtn.classList.replace('btn-secondary', 'btn-primary');
                return;
            }

            // Login Logic
            const phone = prompt("Enter your registered phone number:", "9876543210");
            if (phone) {
                pendingAction = 'login';
                pendingData = phone; // Just the phone for mock login
                sendOTP(phone);
            }
        });
    }

    function completeLogin(phone) {
        alert("Login Successful! Welcome back.");
        const loginBtn = document.getElementById('loginBtn');
        loginBtn.innerText = 'Logout';
        loginBtn.classList.replace('btn-primary', 'btn-secondary');
    }
});

function findMatches(req) {
    // Filter by Blood Compatibility (Simplified: Exact Match + O- for everyone)
    let candidates = donorDB.filter(d =>
        d.blood === req.blood || d.blood === 'O-'
    );

    // Calculate Scores
    let scoredCandidates = candidates.map(d => {
        const dist = getDistance(req.lat, req.lon, d.lat, d.lon);
        const score = calculateUrgencyScore(req, d, dist);
        return { ...d, distance: dist.toFixed(1), score: score };
    });

    // Sort by Score Descending
    return scoredCandidates.sort((a, b) => b.score - a.score).slice(0, 5);
}

function displayResults(donors) {
    const list = document.getElementById('donorList');
    const container = document.getElementById('resultsArea');

    list.innerHTML = '';
    container.classList.remove('hidden');

    if (donors.length === 0) {
        list.innerHTML = '<li class="donor-card">No immediate matches found. Network Alert Sent.</li>';
        return;
    }

    donors.forEach(d => {
        const el = document.createElement('li');
        el.className = `donor-card ${d.score > 80 ? 'match-high' : ''}`;
        el.innerHTML = `
            <div>
                <h4>${d.name} <span style="font-size:0.8em; color:#ccc">(${d.blood})</span></h4>
                <div style="font-size: 0.9em; opacity: 0.8">
                    <i class="fa-solid fa-location-dot"></i> ${d.distance} km away
                </div>
            </div>
            <div style="text-align: right">
                <div class="match-score">${d.score}% Match</div>
                <div style="display: flex; gap: 5px; margin-top: 5px;">
                     <a href="tel:${d.phone}" class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; text-decoration: none;">
                        <i class="fa-solid fa-phone"></i> Call
                    </a>
                </div>
            </div>
        `;
        list.appendChild(el);
    });
}

function detectLocation(type) {
    const id = type === 'donor' ? 'donorLocation' : 'reqLocation';
    document.getElementById(id).value = "28.61° N, 77.20° E (Detected)";
}

// --- Nearby Services Logic ---

const mockBloodbanks = [
    { id: 1, name: "City Red Cross Blood Bank", lat: 28.63, lon: 77.22, phone: "011-23716441" },
    { id: 2, name: "Rotary Blood Bank", lat: 28.56, lon: 77.24, phone: "011-66006600" },
    { id: 3, name: "Lion's Blood Bank", lat: 28.68, lon: 77.15, phone: "011-45678901" }
];

const mockHospitals = [
    { id: 1, name: "AIIMS Trauma Center", lat: 28.57, lon: 77.20, phone: "011-26588500" },
    { id: 2, name: "Max Super Speciality Hospital", lat: 28.52, lon: 77.20, phone: "011-26515050" },
    { id: 3, name: "Fortis Hospital", lat: 28.54, lon: 77.25, phone: "011-42776222" }
];

window.findNearby = (type) => {
    const title = document.getElementById('locationsTitle');
    const list = document.getElementById('locationsList');
    const container = document.getElementById('locationsResults');
    const userLat = 28.61; // Mock User Location
    const userLon = 77.20;

    // Reset and Show Container
    list.innerHTML = '';
    container.classList.remove('hidden');
    document.getElementById('services').scrollIntoView({ behavior: 'smooth' });

    let data = [];
    if (type === 'bloodbank') {
        title.innerText = "Nearby Bloodbanks";
        data = mockBloodbanks;
    } else {
        title.innerText = "Nearby Hospitals";
        data = mockHospitals;
    }

    if (data.length === 0) {
        list.innerHTML = '<li class="donor-card">No facilities found nearby.</li>';
        return;
    }

    data.map(item => {
        const dist = getDistance(userLat, userLon, item.lat, item.lon).toFixed(1);
        return { ...item, distance: dist };
    }).sort((a, b) => a.distance - b.distance).forEach(item => {
        const el = document.createElement('li');
        el.className = 'donor-card';
        el.style.borderLeftColor = type === 'bloodbank' ? '#E63946' : '#2a9d8f';
        el.innerHTML = `
            <div>
                <h4>${item.name}</h4>
                <div style="font-size: 0.9em; opacity: 0.8">
                    <i class="fa-solid fa-location-dot"></i> ${item.distance} km away
                </div>
            </div>
            <div style="text-align: right">
                <a href="tel:${item.phone}" class="btn-primary" style="padding: 5px 10px; font-size: 0.8rem; text-decoration: none;">
                    <i class="fa-solid fa-phone"></i> Call
                </a>
            </div>
        `;
        list.appendChild(el);
    });
};
