// Employer Dashboard Logic with Escrow & AI Features
let currentUser = null;

// Storage keys
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!userStr) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = JSON.parse(userStr);
    if (currentUser.type !== 'employer') {
        window.location.href = 'index.html';
        return;
    }

    initializeDashboard();
});

function initializeDashboard() {
    try {
        // Initialize balance if not exists
        if (typeof currentUser.balance === 'undefined') {
            currentUser.balance = 10000000; // 10 million demo balance for testing
            const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex].balance = currentUser.balance;
                localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
            }
        }

        // Set user info
        document.getElementById('userBalance').textContent = formatCurrency(currentUser.balance || 0);
        document.getElementById('userInitials').textContent = currentUser.name.charAt(0).toUpperCase();

        // Load dashboard data
        loadDashboardStats();
        loadRecentApplicants();
        updateApplicantsBadge();

        console.log('Employer dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing employer dashboard:', error);
    }
}

// ===== MOBILE SIDEBAR =====
function toggleMobileSidebar() {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

// ===== TOAST =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const colors = { success: '#10b981', error: '#ef4444', info: '#6366f1', warning: '#f59e0b' };
    const toast = document.createElement('div');
    toast.style.cssText = `background:${colors[type] || colors.info};color:white;padding:0.75rem 1.5rem;border-radius:0.75rem;font-size:0.9rem;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,0.3);margin-top:0.5rem;`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// Add toast animation style
const _toastStyle = document.createElement('style');
_toastStyle.textContent = '@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}} .toast-container{position:fixed;bottom:5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;} @media(min-width:769px){.toast-container{bottom:1.5rem;}}';
document.head.appendChild(_toastStyle);

// ===== APPLICANTS BADGE =====
function updateApplicantsBadge() {
    const jobs = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
    const applications = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
    const myJobIds = jobs.filter(j => j.employerId === currentUser.id).map(j => j.id);
    const pendingCount = applications.filter(a => myJobIds.includes(a.jobId) && a.status === 'pending').length;
    const badge = document.getElementById('applicantsBadge');
    if (badge) {
        badge.textContent = pendingCount;
        badge.style.display = pendingCount > 0 ? 'flex' : 'none';
    }
}

// ===== BOTTOM NAV SYNC =====
function updateBottomNav(sectionName) {
    document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
    const mapping = {
        'dashboard': 'bnav-dashboard',
        'post-job': 'bnav-post-job',
        'my-jobs': 'bnav-my-jobs',
        'applicants': 'bnav-applicants',
        'contracts': 'bnav-contracts',
        'payments': 'bnav-contracts',
        'history': 'bnav-my-jobs'
    };
    const targetId = mapping[sectionName];
    if (targetId) {
        const el = document.getElementById(targetId);
        if (el) el.classList.add('active');
    }
}


// Section Navigation
function showSection(sectionName) {
    try {
        console.log('Showing section:', sectionName);

        // Close mobile sidebar
        closeMobileSidebar();

        // Update nav items
        const allNavItems = document.querySelectorAll('.nav-item');
        allNavItems.forEach(item => item.classList.remove('active'));

        // Find and activate the clicked nav item
        allNavItems.forEach(item => {
            if (item.getAttribute('onclick')?.includes(`'${sectionName}'`)) {
                item.classList.add('active');
            }
        });

        // Update sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(`section-${sectionName}`);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            console.error(`Section not found: section-${sectionName}`);
        }

        // Update page title & subtitle
        const titles = {
            dashboard: 'Bosh sahifa',
            'post-job': "Ish e'lon qilish",
            'my-jobs': 'Mening ishlarim',
            applicants: 'Murojaatlar',
            contracts: 'Shartnomalar',
            payments: "To'lovlar",
            history: 'Tarix'
        };
        const subtitles = {
            dashboard: "Bugungi ko'rsatkichlar",
            'post-job': 'Yangi ish qo\'shish',
            'my-jobs': 'Barcha e\'lon qilgan ishlaringiz',
            applicants: 'Ishchilarning murojaatlari',
            contracts: 'Faol va tugallangan shartnomalar',
            payments: 'To\'lovlar tarixi',
            history: 'Tugallangan ishlar'
        };

        const titleEl = document.getElementById('pageTitle');
        const subtitleEl = document.getElementById('pageSubtitle');
        if (titleEl && titles[sectionName]) titleEl.textContent = titles[sectionName];
        if (subtitleEl && subtitles[sectionName]) subtitleEl.textContent = subtitles[sectionName];

        // Update bottom nav
        updateBottomNav(sectionName);

        // Load section data
        loadSectionData(sectionName);
    } catch (error) {
        console.error('Error in showSection:', error);
    }
}


function loadSectionData(sectionName) {
    try {
        switch (sectionName) {
            case 'my-jobs':
                loadMyJobs();
                break;
            case 'applicants':
                loadAllApplicants();
                break;
            case 'contracts':
                loadContracts();
                break;
            case 'payments':
                loadPayments();
                break;
            case 'history':
                loadHistory();
                break;
        }
    } catch (error) {
        console.error('Error loading section data:', error);
    }
}

// Dashboard Stats
function loadDashboardStats() {
    try {
        const jobs = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
        const myJobs = jobs.filter(j => j.employerId === currentUser.id);

        const applications = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
        const myApplications = applications.filter(app => {
            const job = jobs.find(j => j.id === app.jobId);
            return job && job.employerId === currentUser.id;
        });

        const totalJobsEl = document.getElementById('totalJobs');
        const activeJobsEl = document.getElementById('activeJobs');
        const completedJobsEl = document.getElementById('completedJobs');
        const totalApplicantsEl = document.getElementById('totalApplicants');

        if (totalJobsEl) totalJobsEl.textContent = myJobs.length;
        if (activeJobsEl) activeJobsEl.textContent = myJobs.filter(j => j.status === 'active').length;
        if (completedJobsEl) completedJobsEl.textContent = myJobs.filter(j => j.status === 'completed').length;
        if (totalApplicantsEl) totalApplicantsEl.textContent = myApplications.length;

        console.log('Stats loaded:', {
            totalJobs: myJobs.length,
            activeJobs: myJobs.filter(j => j.status === 'active').length,
            applications: myApplications.length
        });
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Recent Applicants
function loadRecentApplicants() {
    try {
        const jobs = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
        const applications = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

        const myJobs = jobs.filter(j => j.employerId === currentUser.id);
        const myJobIds = myJobs.map(j => j.id);
        const myApplications = applications
            .filter(app => myJobIds.includes(app.jobId) && app.status === 'pending')
            .slice(0, 5);

        const container = document.getElementById('recentApplicants');
        if (!container) {
            console.warn('recentApplicants container not found');
            return;
        }

        if (myApplications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <div class="empty-state-text">Hozircha yangi murojaatlar yo'q</div>
                </div>
            `;
            return;
        }

        container.innerHTML = myApplications.map(app => {
            const job = jobs.find(j => j.id === app.jobId);
            const worker = users.find(u => u.id === app.workerId);

            return `
                <div class="application-card">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">
                                ${worker?.name || 'Noma\'lum'}
                            </div>
                            <div style="color: var(--text-muted); font-size: 0.875rem;">
                                ${job?.title || 'Noma\'lum ish'} uchun murojaat
                            </div>
                            <div style="color: var(--text-muted); font-size: 0.875rem;">
                                ${formatDate(app.appliedAt)}
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn-primary" onclick="acceptApplicant('${app.id}')">
                            Qabul qilish
                        </button>
                        <button class="btn-danger" onclick="rejectApplicant('${app.id}')">
                            Rad etish
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        console.log('Recent applicants loaded:', myApplications.length);
    } catch (error) {
        console.error('Error loading recent applicants:', error);
    }
}

// Post Job with Escrow & Urgent Features
document.getElementById('postJobForm')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('jobTitle').value;
    const description = document.getElementById('jobDescription').value;
    const category = document.getElementById('jobCategory').value;
    const salary = parseInt(document.getElementById('jobSalary').value);
    const location = document.getElementById('jobLocation').value;
    const duration = document.getElementById('jobDuration').value;
    const requirementsText = document.getElementById('jobRequirements').value;
    const escrowRequired = document.getElementById('escrowRequired')?.checked || false;
    const urgent = document.getElementById('urgentJob')?.checked || false;

    const requirements = requirementsText
        ? requirementsText.split('\n').filter(r => r.trim())
        : [];

    // Validate escrow - employer must have sufficient balance
    if (escrowRequired) {
        const employerBalance = currentUser.balance || 0;
        if (employerBalance < salary) {
            alert(`Escrow uchun hisobingizda yetarli mablag' yo'q!\n\nKerak: ${formatCurrency(salary)}\nMavjud: ${formatCurrency(employerBalance)}\n\nIltimos, hisobingizni to'ldiring.`);
            return;
        }
    }

    const jobs = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');

    const newJob = {
        id: Date.now().toString(),
        employerId: currentUser.id,
        employerName: currentUser.name,
        employerRating: currentUser.rating || 0,
        title,
        description,
        category,
        salary,
        location,
        duration,
        requirements,
        escrowRequired,
        urgent,
        requiredExperience: 0, // Can be added as a form field later
        minRating: 0,
        status: 'active',
        views: 0,
        applicantsCount: 0,
        createdAt: new Date().toISOString()
    };

    jobs.push(newJob);
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));

    // If escrow is required, create escrow record and deduct from employer balance
    if (escrowRequired) {
        const escrows = JSON.parse(localStorage.getItem(STORAGE_KEYS.ESCROW) || '[]');
        const newEscrow = {
            id: 'escrow_' + Date.now(),
            jobId: newJob.id,
            amount: salary,
            status: 'held', // held, released, returned
            employerId: currentUser.id,
            createdAt: new Date().toISOString()
        };
        escrows.push(newEscrow);
        localStorage.setItem(STORAGE_KEYS.ESCROW, JSON.stringify(escrows));

        // Deduct from employer balance
        currentUser.balance = (currentUser.balance || 0) - salary;
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].balance = currentUser.balance;
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        }

        // Update balance display
        document.getElementById('userBalance').textContent = formatCurrency(currentUser.balance);
    }

    alert(`✅ Ish muvaffaqiyatli e'lon qilindi!\n\n${escrowRequired ? '🛡️ Pul escrowda xavfsiz saqlanmoqda\n' : ''}${urgent ? '⚡ Tezkor ish sifatida e\'lon qilindi\n' : ''}`);
    e.target.reset();
    loadDashboardStats();
});

// My Jobs
function loadMyJobs() {
    const jobs = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
    const myJobs = jobs.filter(j => j.employerId === currentUser.id);

    const container = document.getElementById('myJobsList');

    if (myJobs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💼</div>
                <div class="empty-state-text">Siz hali ish e'lon qilmadingiz</div>
            </div>
        `;
        return;
    }

    container.innerHTML = myJobs.map(job => `
        <div class="job-card">
            <div class="job-header">
                <div>
                    <div class="job-title">${job.title}</div>
                    <span class="job-category">${job.category}</span>
                </div>
                <span class="status-badge status-${job.status}">
                    ${job.status === 'active' ? 'Faol' : 'Tugallangan'}
                </span>
            </div>
            <div class="job-meta">
                <span class="job-meta-item">📍 ${job.location}</span>
                <span class="job-meta-item">⏱️ ${job.duration}</span>
                <span class="job-meta-item">💰 ${formatCurrency(job.salary)}</span>
            </div>
            <div class="job-description">${job.description}</div>
            <div style="margin-top: 1rem; color: var(--text-muted); font-size: 0.875rem;">
                E'lon qilingan: ${formatDate(job.createdAt)}
            </div>
            ${job.status === 'active' ? `
                <div class="job-actions" style="margin-top: 1rem;">
                    <button class="btn-secondary" onclick="viewJobApplicants('${job.id}')">
                        Murojaatlarni ko'rish
                    </button>
                    <button class="btn-danger" onclick="deleteJob('${job.id}')">
                        O'chirish
                    </button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function deleteJob(jobId) {
    if (!confirm('Ishni o\'chirishni xohlaysizmi?')) return;

    const jobs = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
    const filteredJobs = jobs.filter(j => j.id !== jobId);
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(filteredJobs));

    alert('Ish o\'chirildi!');
    loadMyJobs();
    loadDashboardStats();
}

function viewJobApplicants(jobId) {
    showSection('applicants');
}

// All Applicants
function loadAllApplicants() {
    const jobs = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
    const applications = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

    const myJobs = jobs.filter(j => j.employerId === currentUser.id);
    const myJobIds = myJobs.map(j => j.id);
    const myApplications = applications.filter(app => myJobIds.includes(app.jobId));

    const container = document.getElementById('allApplicantsList');

    if (myApplications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <div class="empty-state-text">Hozircha murojaatlar yo'q</div>
            </div>
        `;
        return;
    }

    container.innerHTML = myApplications.map(app => {
        const job = jobs.find(j => j.id === app.jobId);
        const worker = users.find(u => u.id === app.workerId);

        return `
            <div class="application-card">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">
                            ${worker?.name || 'Noma\'lum'}
                        </div>
                        <div style="color: var(--text-secondary); margin-bottom: 0.5rem;">
                            📋 ${job?.title}
                        </div>
                        ${worker?.profile ? `
                            <div style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.25rem;">
                                💼 ${worker.profile.jobType || 'Ko\'rsatilmagan'}
                            </div>
                            <div style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.25rem;">
                                📍 ${worker.profile.region || 'Ko\'rsatilmagan'}
                            </div>
                            <div style="color: var(--text-muted); font-size: 0.875rem;">
                                ⭐ Tajriba: ${worker.profile.experience || 0} yil
                            </div>
                        ` : ''}
                        <div style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">
                            Yuborilgan: ${formatDate(app.appliedAt)}
                        </div>
                    </div>
                    <span class="status-badge status-${app.status}">
                        ${app.status === 'pending' ? 'Kutilmoqda' :
                app.status === 'accepted' ? 'Qabul qilindi' : 'Rad etildi'}
                    </span>
                </div>
                ${app.status === 'pending' ? `
                    <div style="display: flex; gap: 1rem;">
                        <button class="btn-primary" onclick="acceptApplicant('${app.id}')">
                            Qabul qilish
                        </button>
                        <button class="btn-danger" onclick="rejectApplicant('${app.id}')">
                            Rad etish
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function acceptApplicant(applicationId) {
    if (!confirm('Bu ishchini qabul qilishni xohlaysizmi? Shartnoma yaratiladi.')) return;

    const applications = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
    const appIndex = applications.findIndex(a => a.id === applicationId);

    if (appIndex === -1) return;

    applications[appIndex].status = 'accepted';
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));

    // Create contract
    const app = applications[appIndex];
    const jobs = JSON.parse(localStorage.getItem(STORAGE_KEYS.JOBS) || '[]');
    const job = jobs.find(j => j.id === app.jobId);

    if (job) {
        const contracts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTRACTS) || '[]');
        const newContract = {
            id: Date.now().toString(),
            jobId: job.id,
            jobTitle: job.title,
            employerId: currentUser.id,
            employerName: currentUser.name,
            workerId: app.workerId,
            workerName: app.workerName,
            amount: job.salary,
            status: 'active',
            startDate: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        contracts.push(newContract);
        localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(contracts));
    }

    alert('Ishchi qabul qilindi va shartnoma yaratildi!');
    loadAllApplicants();
    loadDashboardStats();
    updateApplicantsBadge();
    showToast('✅ Ishchi qabul qilindi!', 'success');

}

function rejectApplicant(applicationId) {
    if (!confirm('Bu murojaatni rad etishni xohlaysizmi?')) return;

    const applications = JSON.parse(localStorage.getItem(STORAGE_KEYS.APPLICATIONS) || '[]');
    const appIndex = applications.findIndex(a => a.id === applicationId);

    if (appIndex !== -1) {
        applications[appIndex].status = 'rejected';
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));

        alert('Murojaat rad etildi!');
        loadAllApplicants();
        updateApplicantsBadge();
        showToast('Murojaat rad etildi', 'info');
    }
}

// Contracts
function loadContracts() {
    const contracts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTRACTS) || '[]');
    const myContracts = contracts.filter(c => c.employerId === currentUser.id);

    const container = document.getElementById('contractsList');

    if (myContracts.length === 0) {
        container.innerHTML = `
        <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <div class="empty-state-text">Sizda faol shartnomalar yo'q</div>
            </div>
        `;
        return;
    }

    container.innerHTML = myContracts.map(contract => `
        <div class="contract-card">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                    <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">
                        ${contract.jobTitle}
                    </div>
                    <div style="color: var(--text-secondary); margin-bottom: 0.25rem;">
                        👤 Ishchi: ${contract.workerName}
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.875rem;">
                        Boshlanish: ${formatDate(contract.startDate)}
                    </div>
                </div>
                <span class="status-badge status-${contract.status}">
                    ${contract.status === 'active' ? 'Faol' : 'Tugallangan'}
                </span>
            </div>
            <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary); margin-bottom: 1rem;">
                💰 ${formatCurrency(contract.amount)}
            </div>
            ${contract.status === 'completed' && !contract.paid ? `
                <button class="btn-primary" onclick="approvePayment('${contract.id}')">
                    To'lovni tasdiqlash
                </button>
            ` : contract.paid ? `
                <div style="color: var(--success);">✅ To'lov amalga oshirildi</div>
            ` : `
                <div style="color: var(--text-muted);">Ish jarayonida...</div>
            `}
        </div>
    `).join('');
}

function approvePayment(contractId) {
    if (!confirm('To\'lovni tasdiqlaysizmi? Pul ishchiga o\'tkaziladi.')) return;

    const contracts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTRACTS) || '[]');
    const contractIndex = contracts.findIndex(c => c.id === contractId);

    if (contractIndex === -1) return;

    const contract = contracts[contractIndex];
    contracts[contractIndex].paid = true;
    contracts[contractIndex].paidDate = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify(contracts));

    // Create transaction
    const transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
    const newTransaction = {
        id: Date.now().toString(),
        contractId: contract.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverId: contract.workerId,
        receiverName: contract.workerName,
        amount: contract.amount * 0.95, // 5% commission
        commission: contract.amount * 0.05,
        status: 'completed',
        date: new Date().toISOString()
    };

    transactions.push(newTransaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));

    // Update worker balance
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const workerIndex = users.findIndex(u => u.id === contract.workerId);
    if (workerIndex !== -1) {
        users[workerIndex].balance = (users[workerIndex].balance || 0) + newTransaction.amount;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    alert('To\'lov muvaffaqiyatli amalga oshirildi!');
    loadContracts();
}

// Payments
function loadPayments() {
    const transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
    const myTransactions = transactions.filter(t => t.senderId === currentUser.id);

    const container = document.getElementById('paymentsList');

    if (myTransactions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💳</div>
                <div class="empty-state-text">Hali to'lovlar yo'q</div>
            </div>
        `;
        return;
    }

    container.innerHTML = myTransactions.map(tx => `
        <div class="transaction-card">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <div style="font-weight: 600; margin-bottom: 0.5rem;">
                        To'lov: ${tx.receiverName}
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.875rem;">
                        ${formatDate(tx.date)}
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.25rem;">
                        Komissiya: ${formatCurrency(tx.commission)}
                    </div>
                </div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">
                    -${formatCurrency(tx.amount + tx.commission)}
                </div>
            </div>
        </div>
    `).join('');
}

// History
function loadHistory() {
    const contracts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONTRACTS) || '[]');
    const completedContracts = contracts.filter(c =>
        c.employerId === currentUser.id && c.status === 'completed'
    );

    const container = document.getElementById('historyList');

    if (completedContracts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <div class="empty-state-text">Hali tugallangan ishlar yo'q</div>
            </div>
        `;
        return;
    }

    container.innerHTML = completedContracts.map(contract => `
        <div class="history-card">
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <div>
                    <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">
                        ${contract.jobTitle}
                    </div>
                    <div style="color: var(--text-secondary); margin-bottom: 0.25rem;">
                        👤 ${contract.workerName}
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.875rem;">
                        Tugallandi: ${formatDate(contract.completedDate)}
                    </div>
                </div>
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">
                    ${formatCurrency(contract.amount)}
                </div>
            </div>
            ${contract.paid ? `
                <div style="color: var(--success);">✅ To'langan</div>
            ` : `
                <button class="btn-primary" onclick="approvePayment('${contract.id}')">
                    To'lovni tasdiqlash
                </button>
            `}
        </div>
    `).join('');
}

// Helper Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
}

function formatDate(dateString) {
    if (!dateString) return 'Noma\'lum';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function logout() {
    if (confirm('Tizimdan chiqmoqchimisiz?')) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        window.location.href = 'index.html';
    }
}
