// App State
const appState = {
    currentUser: null,
    userType: null,
    isLoggedIn: false
};

// LocalStorage keys
const STORAGE_KEYS = {
    USERS: 'trustid_users',
    CURRENT_USER: 'trustid_current_user',
    JOBS: 'trustid_jobs',
    APPLICATIONS: 'trustid_applications',
    CONTRACTS: 'trustid_contracts',
    TRANSACTIONS: 'trustid_transactions',
    RATINGS: 'trustid_ratings',
    ESCROW: 'trustid_escrow',
    REVIEWS: 'trustid_reviews',
    PREMIUM: 'trustid_premium'
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Check if user is logged in
    const currentUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (currentUser) {
        appState.currentUser = JSON.parse(currentUser);
        appState.isLoggedIn = true;
        appState.userType = appState.currentUser.type;

        // Redirect to appropriate dashboard
        redirectToDashboard();
    }

    // Initialize essential storage with demo data if empty
    if (!localStorage.getItem(STORAGE_KEYS.JOBS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS)).length === 0) {
        // demoData is available if demo-data.js is loaded
        if (typeof demoJobs !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(demoJobs));
            console.log('Demo jobs initialized');
        } else {
            localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify([]));
        }
    }
}

// Smooth scroll navigation
function setupNavigationLinks() {
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Navbar scroll effect
function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(15, 23, 42, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// Modal Functions
function showLogin() {
    const modal = document.getElementById('authModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h2 style="margin-bottom: 2rem; text-align: center;">Tizimga kirish</h2>
        <form onsubmit="handleLogin(event)" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div>
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Telefon raqam</label>
                <input type="tel" id="loginPhone" placeholder="+998 90 123 45 67" required 
                    style="width: 100%; padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.1); background: rgba(30,41,59,0.5); color: white; font-size: 1rem;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Parol</label>
                <input type="password" id="loginPassword" placeholder="••••••••" required 
                    style="width: 100%; padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.1); background: rgba(30,41,59,0.5); color: white; font-size: 1rem;">
            </div>
            <button type="submit" class="btn-primary" style="width: 100%; justify-content: center;">
                Kirish
            </button>
            <p style="text-align: center; color: var(--text-secondary);">
                Hisobingiz yo'qmi? <a href="#" onclick="showRegister(); return false;" style="color: var(--primary);">Ro'yxatdan o'ting</a>
            </p>
        </form>
    `;

    modal.classList.add('active');
}

function showRegister(userType = null) {
    const modal = document.getElementById('authModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h2 style="margin-bottom: 2rem; text-align: center;">Ro'yxatdan o'tish</h2>
        <form onsubmit="handleRegister(event)" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div>
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Foydalanuvchi turi</label>
                <select id="registerType" required 
                    style="width: 100%; padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.1); background: rgba(30,41,59,0.5); color: white; font-size: 1rem;">
                    <option value="">Tanlang</option>
                    <option value="worker" ${userType === 'worker' ? 'selected' : ''}>Ishchi</option>
                    <option value="employer" ${userType === 'employer' ? 'selected' : ''}>Ish beruvchi</option>
                </select>
            </div>
            <div>
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">To'liq ism</label>
                <input type="text" id="registerName" placeholder="Ismingiz" required 
                    style="width: 100%; padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.1); background: rgba(30,41,59,0.5); color: white; font-size: 1rem;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Telefon raqam</label>
                <input type="tel" id="registerPhone" placeholder="+998 90 123 45 67" required 
                    style="width: 100%; padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.1); background: rgba(30,41,59,0.5); color: white; font-size: 1rem;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Parol</label>
                <input type="password" id="registerPassword" placeholder="••••••••" required 
                    style="width: 100%; padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.1); background: rgba(30,41,59,0.5); color: white; font-size: 1rem;">
            </div>
            <button type="submit" class="btn-primary" style="width: 100%; justify-content: center;">
                Ro'yxatdan o'tish
            </button>
            <p style="text-align: center; color: var(--text-secondary);">
                Allaqachon hisobingiz bormi? <a href="#" onclick="showLogin(); return false;" style="color: var(--primary);">Kirish</a>
            </p>
        </form>
    `;

    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('active');
}

// Authentication Handlers
function handleLogin(event) {
    event.preventDefault();

    const phone = document.getElementById('loginPhone').value;
    const password = document.getElementById('loginPassword').value;

    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find(u => u.phone === phone && u.password === password);

    if (user) {
        appState.currentUser = user;
        appState.isLoggedIn = true;
        appState.userType = user.type;

        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

        closeModal();
        redirectToDashboard();
    } else {
        alert('Telefon raqam yoki parol noto\'g\'ri!');
    }
}

function handleRegister(event) {
    event.preventDefault();

    const type = document.getElementById('registerType').value;
    const name = document.getElementById('registerName').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;

    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

    // Check if user exists
    if (users.find(u => u.phone === phone)) {
        alert('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan!');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        type,
        name,
        phone,
        password,
        verified: true,
        rating: 0,
        completedJobs: 0,
        balance: 0,
        createdAt: new Date().toISOString(),
        profile: {
            region: '',
            jobType: '',
            experience: 0,
            description: ''
        }
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    appState.currentUser = newUser;
    appState.isLoggedIn = true;
    appState.userType = type;

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));

    closeModal();

    alert('Ro\'yxatdan o\'tish muvaffaqiyatli! Dashboard ochilmoqda...');

    setTimeout(() => {
        redirectToDashboard();
    }, 500);
}

function redirectToDashboard() {
    const path = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const targetFile = appState.userType === 'worker' ? 'worker-dashboard.html' : 'employer-dashboard.html';

    console.log('Redirecting to:', path + targetFile);
    window.location.href = targetFile; // relative path usually works better for static sites
}

function logout() {
    appState.currentUser = null;
    appState.isLoggedIn = false;
    appState.userType = null;

    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.location.href = 'index.html';
}

// Helper Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

