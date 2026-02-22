// Worker Dashboard - Optimized & Clean
let currentUser = null;

//Storage keys
const STORAGE_KEYS = {
    USERS: 'trustid_users',
    CURRENT_USER: 'trustid_current_user',
    JOBS: 'trustid_jobs',
    APPLICATIONS: 'trustid_applications',
    CONTRACTS: 'trustid_contracts',
    TRANSACTIONS: 'trustid_transactions'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!userStr) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = JSON.parse(userStr);
    if (currentUser.type !== 'worker') {
        window.location.href = 'index.html';
        return;
    }

    initializeDashboard();
});

function initializeDashboard() {
    try {
        document.getElementById('userBalance').textContent = formatCurrency(currentUser.balance || 0);
        document.getElementById('userInitials').textContent = currentUser.name.charAt(0).toUpperCase();

        loadDashboardStats();
        loadRecommendedJobs();
        loadRecentActivity();
        loadProfile();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

// Section Navigation
function showSection(sectionName) {
    try {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.getAttribute('onclick')?.includes(`'${sectionName}'`)) {
                item.classList.add('active');
            }
        });

        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        document.getElementById(`section-${sectionName}`)?.classList.add('active');

        const titles = {
            dashboard: 'Bosh sahifa',
            profile: 'Profil',
            jobs: 'Ish qidirish',
            applications: 'Murojaatlarim',
            contracts: 'Shartnomalar',
            transactions: "To'lovlar",
            history: 'Tarix'
        };
        if (titles[sectionName]) {
            document.getElementById('pageTitle').textContent = titles[sectionName];
        }

        loadSectionData(sectionName);
    } catch (error) {
        console.error('Error showing section:', error);
    }
}

function loadSectionData(sectionName) {
    const loaders = {
        jobs: loadAllJobs,
        applications: loadApplications,
        contracts: loadContracts,
        transactions: loadTransactions,
        history: loadHistory
    };
    loaders[sectionName]?.();
}

// Dashboard Stats
function loadDashboardStats() {
    const contracts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTRACTS) || '[]');
    const userContracts = contracts.filter(c => c.workerId === currentUser.id);

    document.getElementById('totalJobs').textContent = userContracts.filter(c => c.status === 'active').length;
    document.getElementById('completedJobs').textContent = userContracts.filter(c => c.status === 'completed').length;
    document.getElementById('userRating').textContent = (currentUser.rating || 0).toFixed(1);

    const transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
    const earnings = transactions.filter(t => t.receiverId === currentUser.id && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);
    document.getElementById('totalEarnings').textContent = formatCurrency(earnings);
}

// Recommended Jobs
function loadRecommendedJobs() {
    const jobs = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
    const activeJobs = jobs.filter(j => j.status === 'active').slice(0, 3);
    const container = document.getElementById('recommendedJobs');
    if (!container) return;

    if (activeJobs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💼</div>
                <div class="empty-state-text">Hozircha mavjud ishlar yo'q</div>
            </div>
        `;
        return;
    }

    container.innerHTML = activeJobs.map(job => `
        <div class="job-card">
            <div class="job-header">
                <div>
                    <div class="job-title">${job.title}</div>
                    <span class="job-category">${job.category}</span>
                </div>
                <div class="job-salary">${formatCurrency(job.salary)}</div>
            </div>
            <div class="job-meta">
                <span class="job-meta-item">📍 ${job.location}</span>
                <span class="job-meta-item">⏱️ ${job.duration}</span>
            </div>
            <div class="job-description">${job.description.substring(0, 100)}...</div>
            <div class="job-actions">
                <button class="btn-primary" onclick="applyToJob('${job.id}')">Murojaat yuborish</button>
            </div>
        </div>
    `).join('');
}

// Recent Activity
function loadRecentActivity() {
    const activities = [
        { icon: '✅', title: 'Profilingiz faol', time: 'Hozir' },
        {
            icon: '💼',
            title: `${JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]').filter(j => j.status === 'active').length} ta faol ish mavjud`,
            time: 'Bugun'
        },
        { icon: '📝', title: 'Platformaga xush kelibsiz!', time: 'Yangi' }
    ];

    const container = document.getElementById('recentActivity');
    if (container) {
        container.innerHTML = activities.map(a => `
            <div class="activity-item">
                <div class="activity-icon">${a.icon}</div>
                <div class="activity-content">
                    <div class="activity-title">${a.title}</div>
                    <div class="activity-time">${a.time}</div>
                </div>
            </div>
        `).join('');
    }
}

// Profile Management
function loadProfile() {
    try {
        const nameEl = document.getElementById('profileName');
        const phoneEl = document.getElementById('profilePhone');
        const regionEl = document.getElementById('profileRegion');
        const jobTypeEl = document.getElementById('profileJobType');
        const experienceEl = document.getElementById('profileExperience');
        const descriptionEl = document.getElementById('profileDescription');

        if (nameEl) nameEl.value = currentUser.name || '';
        if (phoneEl) phoneEl.value = currentUser.phone || '';
        if (regionEl) regionEl.value = currentUser.profile?.region || '';
        if (jobTypeEl) jobTypeEl.value = currentUser.profile?.jobType || '';
        if (experienceEl) experienceEl.value = currentUser.profile?.experience || 0;
        if (descriptionEl) descriptionEl.value = currentUser.profile?.description || '';
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

document.getElementById('profileForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    currentUser.name = document.getElementById('profileName').value;
    currentUser.profile = {
        region: document.getElementById('profileRegion').value,
        jobType: document.getElementById('profileJobType').value,
        experience: document.getElementById('profileExperience').value,
        description: document.getElementById('profileDescription').value
    };

    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    }
    alert('Profil muvaffaqiyatli saqlandi!');
});

// Job Search
function toggleFilters() {
    const filters = document.getElementById('jobFilters');
    if (filters) filters.style.display = filters.style.display === 'none' ? 'block' : 'none';
}

function loadAllJobs() {
    const jobs = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
    const activeJobs = jobs.filter(j => j.status === 'active');
    const container = document.getElementById('jobsList');
    if (!container) return;

    if (activeJobs.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">Hozircha ishlar topilmadi</div></div>`;
        return;
    }

    container.innerHTML = activeJobs.map(job => `
        <div class="job-card">
            <div class="job-header">
                <div>
                    <div class="job-title">${job.title}</div>
                    <span class="job-category">${job.category}</span>
                </div>
                <div class="job-salary">${formatCurrency(job.salary)}</div>
            </div>
            <div class="job-meta">
                <span class="job-meta-item">📍 ${job.location}</span>
                <span class="job-meta-item">⏱️ ${job.duration}</span>
            </div>
            <div class="job-description">${job.description}</div>
            <div class="job-actions">
                <button class="btn-primary" onclick="applyToJob('${job.id}')">Murojaat yuborish</button>
            </div>
        </div>
    `).join('');
}

function searchJobs() {
    // Simplified search
    loadAllJobs();
}

function applyToJob(jobId) {
    const applications = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
    if (applications.find(a => a.jobId === jobId && a.workerId === currentUser.id)) {
        alert('Siz allaqachon bu ishga murojaat yuborgansiz!');
        return;
    }

    applications.push({
        id: Date.now().toString(),
        jobId,
        workerId: currentUser.id,
        workerName: currentUser.name,
        status: 'pending',
        appliedAt: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
    alert('Murojaat muvaffaqiyatli yuborildi!');
}

// Applications
function loadApplications() {
    const applications = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
    const jobs = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
    const userApps = applications.filter(a => a.workerId === currentUser.id);
    const container = document.getElementById('applicationsList');
    if (!container) return;

    if (userApps.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">Siz hali hech qanday murojaat yubormadingiz</div></div>`;
        return;
    }

    container.innerHTML = userApps.map(app => {
        const job = jobs.find(j => j.id === app.jobId);
        if (!job) return '';
        return `
            <div class="application-card">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <div style="font-size: 1.25rem; font-weight: 600;">${job.title}</div>
                        <div style="color: var(--text-muted); font-size: 0.875rem;">Yuborilgan: ${formatDate(app.appliedAt)}</div>
                    </div>
                    <span class="status-badge status-${app.status}">${app.status === 'pending' ? 'Kutilmoqda' : app.status === 'accepted' ? 'Qabul qilindi' : 'Rad etildi'}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Contracts
function loadContracts() {
    const contracts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTRACTS) || '[]');
    const userContracts = contracts.filter(c => c.workerId === currentUser.id);
    const container = document.getElementById('contractsList');
    if (!container) return;

    if (userContracts.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📄</div><div class="empty-state-text">Sizda faol shartnomalar yo'q</div></div>`;
        return;
    }

    container.innerHTML = userContracts.map(c => `
        <div class="contract-card">
            <div style="display: flex; justify-content: space-between;">
                <div>
                    <div style="font-size: 1.25rem; font-weight: 600;">${c.jobTitle}</div>
                    <div style="color: var(--text-muted);">Boshlanish: ${formatDate(c.startDate)}</div>
                    <div style="color: var(--text-secondary); margin-top: 0.5rem;">💰 ${formatCurrency(c.amount)}</div>
                </div>
                <span class="status-badge status-${c.status}">${c.status === 'active' ? 'Faol' : 'Tugallangan'}</span>
            </div>
            ${c.status === 'active' ? `<button class="btn-primary" onclick="completeContract('${c.id}')">Ishni tugallangan deb belgilash</button>` : ''}
        </div>
    `).join('');
}

function completeContract(contractId) {
    if (!confirm('Ishni tugalladingizmi?')) return;
    const contracts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTRACTS) || '[]');
    const index = contracts.findIndex(c => c.id === contractId);
    if (index !== -1) {
        contracts[index].status = 'completed';
        contracts[index].completedDate = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(contracts));
        alert('Ish tugallangan deb belgilandi!');
        loadContracts();
    }
}

// Transactions
function loadTransactions() {
    const transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
    const userTxs = transactions.filter(t => t.receiverId === currentUser.id);
    const container = document.getElementById('transactionsList');
    if (!container) return;

    if (userTxs.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💰</div><div class="empty-state-text">Hali to'lovlar yo'q</div></div>`;
        return;
    }

    container.innerHTML = userTxs.map(tx => `
        <div class="transaction-card">
            <div style="display: flex; justify-content: space-between;">
                <div>
                    <div style="font-weight: 600;">To'lov #${tx.id.slice(0, 8)}</div>
                    <div style="color: var(--text-muted); font-size: 0.875rem;">${formatDate(tx.date)}</div>
                </div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">+${formatCurrency(tx.amount)}</div>
            </div>
        </div>
    `).join('');
}

// History
function loadHistory() {
    const contracts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTRACTS) || '[]');
    const completed = contracts.filter(c => c.workerId === currentUser.id && c.status === 'completed');
    const container = document.getElementById('historyList');
    if (!container) return;

    if (completed.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📚</div><div class="empty-state-text">Hali bajarilgan ishlar yo'q</div></div>`;
        return;
    }

    container.innerHTML = completed.map(c => `
        <div class="history-card">
            <div style="display: flex; justify-content: space-between;">
                <div>
                    <div style="font-size: 1.25rem; font-weight: 600;">${c.jobTitle}</div>
                    <div style="color: var(--text-muted);">Tugallandi: ${formatDate(c.completedDate)}</div>
                </div>
                <div style="font-size: 1.25rem; font-weight: 700; color: #10b981;">${formatCurrency(c.amount)}</div>
            </div>
        </div>
    `).join('');
}

// Premium
function showPremiumUpgrade() {
    alert('Premium funksiya tez orada ishga tushadi!');
}

// Helpers
function formatCurrency(amount) {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
}

function formatDate(dateString) {
    if (!dateString) return "Noma'lum";
    return new Date(dateString).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

function logout() {
    if (confirm('Tizimdan chiqmoqchimisiz?')) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        window.location.href = 'index.html';
    }
}
