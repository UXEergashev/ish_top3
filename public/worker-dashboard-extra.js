// ===== WORKER DASHBOARD EXTRA FUNCTIONS =====
// Live Search, Filters, Saved Jobs, Earnings, Reviews, Notifications, Alerts

let currentJobFilter = 'all';
let currentViewMode = 'list';
let currentFilterUrgent = false;
let currentFilterEscrow = false;
let savedJobs = [];

// ===== MOBILE SIDEBAR =====
function toggleMobileSidebar() {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}

// ===== PROFILE COMPLETION =====
function calculateProfileCompletion() {
    const profile = currentUser.profile || {};
    let score = 0;
    const tips = [];

    if (currentUser.name) score += 20; else tips.push('Ism kiriting');
    if (profile.region) score += 15; else tips.push('Hudud tanlang');
    if (profile.jobType) score += 20; else tips.push('Kasb tanlang');
    if (profile.experience) score += 15; else tips.push('Tajriba kiriting');
    if (profile.description) score += 10; else tips.push('O\'zingiz haqida yozing');
    if (currentUser.verified) score += 20; else tips.push('ID tasdiqlaing (+20%)');

    return { score, tips };
}

function updateProfileCompletionUI() {
    const { score, tips } = calculateProfileCompletion();

    const completionFill = document.getElementById('completionFill');
    const completionPercent = document.getElementById('completionPercent');
    const completionTips = document.getElementById('completionTips');
    const profileCompletionEl = document.getElementById('profileCompletion');

    if (completionFill) completionFill.style.width = score + '%';
    if (completionPercent) completionPercent.textContent = score + '%';
    if (profileCompletionEl) profileCompletionEl.textContent = score + '%';

    if (completionTips && tips.length > 0) {
        completionTips.innerHTML = tips.slice(0, 3).map(tip =>
            `<span class="completion-tip" onclick="showSection('profile')">➕ ${tip}</span>`
        ).join('');
    }

    const card = document.getElementById('profileCompletionCard');
    if (card) card.style.display = score >= 100 ? 'none' : 'block';
}

// ===== OPEN TO WORK TOGGLE =====
function toggleOpenToWork(checked) {
    const label = document.getElementById('openToWorkLabel');
    if (!currentUser.profile) currentUser.profile = {};
    currentUser.profile.openToWork = checked;
    updateCurrentUser();
    if (label) label.textContent = checked ? '✅ Ish qidirmoqman' : 'Ish qidirmoqman';
    showToast(checked ? '✅ Ish qidirish holati yoqildi' : 'Ish qidirish holati o\'chirildi', 'success');
}

function initOpenToWork() {
    const sw = document.getElementById('openToWorkSwitch');
    const label = document.getElementById('openToWorkLabel');
    if (sw && currentUser.profile) {
        sw.checked = currentUser.profile.openToWork || false;
        if (label) label.textContent = sw.checked ? '✅ Ish qidirmoqman' : 'Ish qidirmoqman';
    }
}

// ===== QUICK SEARCH (header) =====
function quickSearchJobs(query) {
    if (query.length > 0) {
        showSection('jobs');
        const searchEl = document.getElementById('searchQuery');
        if (searchEl) searchEl.value = query;
        liveSearchJobs();
    }
}

// ===== LIVE SEARCH + FILTERS =====
function liveSearchJobs() {
    const query = (document.getElementById('searchQuery')?.value || '').toLowerCase();
    const location = (document.getElementById('searchLocation')?.value || '').toLowerCase();
    const sortVal = document.getElementById('sortJobs')?.value || 'ai';

    let jobs = JSON.parse(localStorage.getItem('trustid_jobs') || '[]')
        .filter(j => j.status === 'active');

    // Text filter
    if (query) {
        jobs = jobs.filter(j =>
            j.title.toLowerCase().includes(query) ||
            j.category.toLowerCase().includes(query) ||
            j.description.toLowerCase().includes(query)
        );
    }
    // Location filter
    if (location) {
        jobs = jobs.filter(j => j.location.toLowerCase().includes(location));
    }
    // Tag filter
    if (currentJobFilter !== 'all') {
        jobs = jobs.filter(j => j.category === currentJobFilter);
    }
    // Urgent filter
    if (currentFilterUrgent) {
        jobs = jobs.filter(j => j.urgent);
    }
    // Escrow filter
    if (currentFilterEscrow) {
        jobs = jobs.filter(j => j.escrowRequired);
    }

    // Sort
    if (sortVal === 'salary_high') {
        jobs.sort((a, b) => b.salary - a.salary);
    } else if (sortVal === 'salary_low') {
        jobs.sort((a, b) => a.salary - b.salary);
    } else if (sortVal === 'newest') {
        jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortVal === 'urgent') {
        jobs.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
    } else {
        // AI sort
        const matched = calculateJobMatches(jobs);
        jobs = matched.map(m => m.job);
    }

    renderJobsList(jobs);
}

function sortAndRenderJobs() {
    liveSearchJobs();
}

function filterByTag(tag, el) {
    currentJobFilter = tag;
    currentFilterUrgent = false;
    currentFilterEscrow = false;
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    liveSearchJobs();
}

function filterByUrgent(el) {
    currentFilterUrgent = !currentFilterUrgent;
    currentFilterEscrow = false;
    currentJobFilter = 'all';
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    if (el) el.classList.toggle('active', currentFilterUrgent);
    liveSearchJobs();
}

function filterByEscrow(el) {
    currentFilterEscrow = !currentFilterEscrow;
    currentFilterUrgent = false;
    currentJobFilter = 'all';
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    if (el) el.classList.toggle('active', currentFilterEscrow);
    liveSearchJobs();
}

function toggleJobView(mode) {
    currentViewMode = mode;
    const gridBtn = document.getElementById('gridViewBtn');
    const listBtn = document.getElementById('listViewBtn');
    const container = document.getElementById('jobsList');

    if (gridBtn) gridBtn.classList.toggle('active', mode === 'grid');
    if (listBtn) listBtn.classList.toggle('active', mode === 'list');
    if (container) container.className = mode === 'grid'
        ? 'jobs-list-container jobs-grid-view'
        : 'jobs-list-container';

    liveSearchJobs();
}

function renderJobsList(jobs) {
    const container = document.getElementById('jobsList');
    const countEl = document.getElementById('jobsCount');
    if (!container) return;

    if (countEl) countEl.textContent = `${jobs.length} ta ish topildi`;

    if (jobs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-text">Mos ishlar topilmadi</div>
                <p style="color:var(--text-muted);margin-top:0.5rem">Qidiruv so'zini o'zgartiring</p>
            </div>`;
        return;
    }

    const matched = calculateJobMatches(jobs);

    container.innerHTML = matched.map(({ job, matchScore, matchReasons }) => {
        const isSaved = getSavedJobs().includes(job.id);
        return `
        <div class="job-card ${matchScore >= 80 ? 'ai-highlighted' : ''}" onclick="showJobDetail('${job.id}')">
            ${matchScore >= 70 ? `<div class="ai-badge">🤖 AI ${matchScore}%</div>` : ''}
            <div class="job-header">
                <div>
                    <div class="job-title">${job.title}</div>
                    <div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-top:0.4rem">
                        <span class="job-category">${job.category}</span>
                        ${job.escrowRequired ? '<span class="escrow-badge">🛡️ Kafolatli</span>' : ''}
                        ${job.urgent ? '<span class="urgent-badge">⚡ Tezkor</span>' : ''}
                    </div>
                </div>
                <div class="job-salary">${formatCurrency(job.salary)}</div>
            </div>
            <div class="job-meta">
                <span class="job-meta-item">📍 ${job.location}</span>
                <span class="job-meta-item">⏱️ ${job.duration}</span>
                ${job.employerRating ? `<span class="job-meta-item">⭐ ${job.employerRating.toFixed(1)}</span>` : ''}
                <span class="job-meta-item">👥 ${job.applicantsCount || 0} murojaat</span>
            </div>
            <div class="job-description">${job.description.substring(0, 120)}...</div>
            <div class="job-actions" onclick="event.stopPropagation()">
                <button class="btn-primary btn-small" onclick="oneClickApply('${job.id}')">
                    ⚡ Murojaat
                </button>
                <button class="btn-secondary btn-small" onclick="toggleSaveJob('${job.id}', this)">
                    ${isSaved ? '❤️ Saqlangan' : '🤍 Saqlash'}
                </button>
                <button class="btn-secondary btn-small" onclick="showJobDetail('${job.id}')">
                    Batafsil →
                </button>
            </div>
        </div>`;
    }).join('');
}

// ===== JOB DETAIL PANEL =====
function showJobDetail(jobId) {
    const jobs = JSON.parse(localStorage.getItem('trustid_jobs') || '[]');
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const match = calculateJobMatches([job])[0];
    const isSaved = getSavedJobs().includes(job.id);

    const panel = document.getElementById('jobDetailPanel');
    if (panel && window.innerWidth > 1024) {
        panel.innerHTML = `
            <div class="job-detail-content">
                ${match.matchScore >= 70 ? `<div class="ai-badge" style="margin-bottom:1rem;display:inline-block">🤖 AI Match ${match.matchScore}%</div>` : ''}
                <h2 style="margin-bottom:0.75rem">${job.title}</h2>
                <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1.5rem">
                    <span class="job-category">${job.category}</span>
                    ${job.escrowRequired ? '<span class="escrow-badge">🛡️ Kafolatli</span>' : ''}
                    ${job.urgent ? '<span class="urgent-badge">⚡ Tezkor</span>' : ''}
                </div>
                <div class="salary-box">
                    <div class="salary-amount">${formatCurrency(job.salary)}</div>
                    <div style="color:var(--text-secondary)">📍 ${job.location} | ⏱️ ${job.duration}</div>
                </div>
                <div style="margin:1.5rem 0">
                    <h3 style="margin-bottom:0.5rem">📝 Tavsif</h3>
                    <p style="color:var(--text-secondary);line-height:1.7">${job.description}</p>
                </div>
                ${job.requirements && job.requirements.length > 0 ? `
                <div style="margin-bottom:1.5rem">
                    <h3 style="margin-bottom:0.5rem">✅ Talablar</h3>
                    <ul style="color:var(--text-secondary);padding-left:1.5rem">
                        ${job.requirements.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>` : ''}
                ${match.matchReasons.length > 0 ? `
                <div class="match-reasons">
                    <strong>💡 Nima uchun mos:</strong>
                    <ul>${match.matchReasons.map(r => `<li>✓ ${r}</li>`).join('')}</ul>
                </div>` : ''}
                <div style="display:flex;gap:0.75rem;margin-top:1.5rem">
                    <button class="btn-primary" onclick="oneClickApply('${job.id}')" style="flex:1;justify-content:center">
                        ⚡ Murojaat yuborish
                    </button>
                    <button class="btn-secondary" onclick="toggleSaveJob('${job.id}', this)">
                        ${isSaved ? '❤️' : '🤍'}
                    </button>
                </div>
            </div>`;
        return;
    }

    // Mobile: open modal
    viewJobDetails(jobId);
}

// ===== SAVED JOBS =====
function getSavedJobs() {
    return JSON.parse(localStorage.getItem(`trustid_saved_${currentUser.id}`) || '[]');
}

function setSavedJobs(arr) {
    localStorage.setItem(`trustid_saved_${currentUser.id}`, JSON.stringify(arr));
}

function toggleSaveJob(jobId, btn) {
    let saved = getSavedJobs();
    if (saved.includes(jobId)) {
        saved = saved.filter(id => id !== jobId);
        if (btn) btn.textContent = '🤍 Saqlash';
        showToast('Ishlar saqlanganlardan olib tashlandi', 'info');
    } else {
        saved.push(jobId);
        if (btn) btn.textContent = '❤️ Saqlangan';
        showToast('✅ Ish saqlandi!', 'success');
    }
    setSavedJobs(saved);
    updateBadges();
    if (document.getElementById('section-saved')?.classList.contains('active')) {
        loadSavedJobs();
    }
}

function loadSavedJobs() {
    const savedIds = getSavedJobs();
    const jobs = JSON.parse(localStorage.getItem('trustid_jobs') || '[]');
    const savedJobsList = jobs.filter(j => savedIds.includes(j.id));

    const container = document.getElementById('savedJobsList');
    const countEl = document.getElementById('savedCount');
    if (!container) return;

    if (countEl) countEl.textContent = savedJobsList.length + ' ta';

    if (savedJobsList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❤️</div>
                <div class="empty-state-text">Saqlangan ishlar yo'q</div>
                <p style="color:var(--text-muted);margin-top:0.5rem">Ish qidirishda 🤍 tugmasini bosing</p>
            </div>`;
        return;
    }

    container.innerHTML = savedJobsList.map(job => `
        <div class="job-card">
            <div class="job-header">
                <div>
                    <div class="job-title">${job.title}</div>
                    <span class="job-category">${job.category}</span>
                    ${job.escrowRequired ? '<span class="escrow-badge">🛡️ Kafolatli</span>' : ''}
                </div>
                <div class="job-salary">${formatCurrency(job.salary)}</div>
            </div>
            <div class="job-meta">
                <span class="job-meta-item">📍 ${job.location}</span>
                <span class="job-meta-item">⏱️ ${job.duration}</span>
            </div>
            <div class="job-actions">
                <button class="btn-primary btn-small" onclick="oneClickApply('${job.id}')">⚡ Murojaat</button>
                <button class="btn-secondary btn-small" onclick="toggleSaveJob('${job.id}', this)">❤️ Olib tashlash</button>
            </div>
        </div>`).join('');
}

// ===== APPLICATIONS FILTER =====
function filterApps(status, btn) {
    document.querySelectorAll('.app-filter-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const applications = JSON.parse(localStorage.getItem('trustid_applications') || '[]');
    const jobs = JSON.parse(localStorage.getItem('trustid_jobs') || '[]');
    let userApps = applications.filter(a => a.workerId === currentUser.id);

    if (status !== 'all') userApps = userApps.filter(a => a.status === status);

    const container = document.getElementById('applicationsList');
    if (!container) return;

    if (userApps.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">Murojaatlar topilmadi</div></div>`;
        return;
    }

    container.innerHTML = userApps.map(app => {
        const job = jobs.find(j => j.id === app.jobId);
        if (!job) return '';
        const statusMap = { pending: '⏳ Kutilmoqda', accepted: '✅ Qabul', rejected: '❌ Rad' };
        return `
        <div class="application-card">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.75rem">
                <div>
                    <div style="font-size:1.1rem;font-weight:600">${job.title}</div>
                    <div style="color:var(--text-muted);font-size:0.85rem">📅 ${formatDate(app.appliedAt)}</div>
                </div>
                <span class="status-badge status-${app.status}">${statusMap[app.status] || app.status}</span>
            </div>
            <div style="color:var(--text-secondary);font-size:0.9rem">
                📍 ${job.location} | 💰 ${formatCurrency(job.salary)}
            </div>
            ${app.coverLetter ? `<div style="margin-top:0.75rem;padding:0.75rem;background:rgba(255,255,255,0.05);border-radius:0.5rem;font-size:0.85rem;color:var(--text-secondary)">${app.coverLetter}</div>` : ''}
        </div>`;
    }).join('');
}

// ===== CONTRACTS FILTER =====
function filterContracts(status, btn) {
    document.querySelectorAll('.contract-filter-tabs .tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    loadContracts(status);
}

// Override loadContracts to support filter
const _origLoadContracts = window.loadContracts;
window.loadContracts = function (statusFilter) {
    try {
        const contracts = JSON.parse(localStorage.getItem('trustid_contracts') || '[]');
        let userContracts = contracts.filter(c => c.workerId === currentUser.id);
        if (statusFilter && statusFilter !== 'all') {
            userContracts = userContracts.filter(c => c.status === statusFilter);
        }

        const container = document.getElementById('contractsList');
        if (!container) return;

        if (userContracts.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📄</div><div class="empty-state-text">Shartnomalar topilmadi</div></div>`;
            return;
        }

        container.innerHTML = userContracts.map(contract => `
            <div class="contract-card">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.75rem">
                    <div>
                        <div style="font-size:1.1rem;font-weight:600">${contract.jobTitle}</div>
                        <div style="color:var(--text-muted);font-size:0.85rem">📅 ${formatDate(contract.startDate)}</div>
                    </div>
                    <span class="status-badge status-${contract.status}">
                        ${contract.status === 'active' ? '🟢 Faol' : '✅ Tugallangan'}
                    </span>
                </div>
                <div style="color:var(--text-secondary);margin-bottom:0.75rem">
                    💰 ${formatCurrency(contract.amount)}
                    ${contract.escrowId ? ' <span style="color:#10b981">🛡️ Kafolatda</span>' : ''}
                </div>
                ${contract.status === 'active' ? `
                <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
                    <button class="btn-primary btn-small" onclick="completeContract('${contract.id}')">✅ Tugallandi</button>
                    ${contract.escrowId ? `<button class="btn-secondary btn-small" onclick="viewEscrowStatus('${contract.id}')">🛡️ Escrow</button>` : ''}
                </div>` :
                contract.status === 'completed' && !contract.rated ? `
                <button class="btn-secondary btn-small" onclick="submitRating('${contract.id}','${contract.employerId}')">⭐ Baholash</button>
                ` : ''}
            </div>`).join('');
    } catch (e) { console.error(e); }
};

// ===== EARNINGS SECTION =====
function loadEarnings() {
    try {
        const period = document.getElementById('earningsFilter')?.value || 'month';
        const transactions = JSON.parse(localStorage.getItem('trustid_transactions') || '[]');
        const userTx = transactions.filter(t => t.receiverId === currentUser.id && t.status === 'completed');

        const now = new Date();
        let filtered = userTx;
        if (period === 'week') {
            const weekAgo = new Date(now - 7 * 86400000);
            filtered = userTx.filter(t => new Date(t.date) >= weekAgo);
        } else if (period === 'month') {
            filtered = userTx.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        } else if (period === 'year') {
            filtered = userTx.filter(t => new Date(t.date).getFullYear() === now.getFullYear());
        }

        const total = userTx.reduce((s, t) => s + t.amount, 0);
        const monthTotal = filtered.reduce((s, t) => s + t.amount, 0);
        const contracts = JSON.parse(localStorage.getItem('trustid_contracts') || '[]');
        const pending = contracts.filter(c => c.workerId === currentUser.id && c.status === 'active')
            .reduce((s, c) => s + c.amount, 0);

        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setEl('totalEarningsDetail', formatCurrency(total));
        setEl('monthEarnings', formatCurrency(monthTotal));
        setEl('pendingEarnings', formatCurrency(pending));
        setEl('availableBalance', formatCurrency(currentUser.balance || 0));

        // Chart
        renderEarningsChart(userTx, period);

        // Transactions list
        const txContainer = document.getElementById('transactionsList');
        if (txContainer) {
            if (userTx.length === 0) {
                txContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💳</div><div class="empty-state-text">Hali to'lovlar yo'q</div></div>`;
            } else {
                txContainer.innerHTML = [...userTx].reverse().map(tx => `
                    <div class="transaction-card" style="display:flex;justify-content:space-between;align-items:center;padding:1rem;border-bottom:1px solid rgba(255,255,255,0.05)">
                        <div>
                            <div style="font-weight:600">💰 To'lov #${tx.id.slice(-6)}</div>
                            <div style="color:var(--text-muted);font-size:0.85rem">${formatDate(tx.date)}</div>
                        </div>
                        <div style="font-size:1.25rem;font-weight:700;color:#10b981">+${formatCurrency(tx.amount)}</div>
                    </div>`).join('');
            }
        }
    } catch (e) { console.error('Earnings error:', e); }
}

function renderEarningsChart(transactions, period) {
    const chartEl = document.getElementById('chartBars');
    if (!chartEl) return;

    const now = new Date();
    let labels = [];
    let data = [];

    if (period === 'week') {
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now - i * 86400000);
            labels.push(d.toLocaleDateString('uz-UZ', { weekday: 'short' }));
            const dayTotal = transactions.filter(t => {
                const td = new Date(t.date);
                return td.toDateString() === d.toDateString();
            }).reduce((s, t) => s + t.amount, 0);
            data.push(dayTotal);
        }
    } else if (period === 'month') {
        const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= days; i += 5) {
            labels.push(i + '-kun');
            const weekTotal = transactions.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() && d.getDate() >= i && d.getDate() < i + 5;
            }).reduce((s, t) => s + t.amount, 0);
            data.push(weekTotal);
        }
    } else {
        const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
        for (let m = 0; m < 12; m++) {
            labels.push(months[m]);
            const mTotal = transactions.filter(t => new Date(t.date).getMonth() === m).reduce((s, t) => s + t.amount, 0);
            data.push(mTotal);
        }
    }

    const maxVal = Math.max(...data, 1);
    chartEl.innerHTML = data.map((val, i) => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:0.25rem;flex:1">
            <div style="font-size:0.65rem;color:var(--text-muted)">${val > 0 ? (val / 1000).toFixed(0) + 'k' : ''}</div>
            <div style="width:100%;background:linear-gradient(180deg,#6366f1,#8b5cf6);border-radius:4px 4px 0 0;height:${(val / maxVal) * 120}px;min-height:2px;transition:height 0.5s"></div>
            <div style="font-size:0.65rem;color:var(--text-muted);text-align:center">${labels[i]}</div>
        </div>`).join('');
}

// ===== REVIEWS SECTION =====
function loadReviews() {
    try {
        const reviews = JSON.parse(localStorage.getItem('trustid_reviews') || '[]');
        const myReviews = reviews.filter(r => r.toUserId === currentUser.id);

        // Rating overview
        const overallEl = document.querySelector('.rating-number');
        const starsEl = document.getElementById('overallStars');
        const countEl = document.getElementById('ratingCount');

        if (myReviews.length > 0) {
            const avg = myReviews.reduce((s, r) => s + r.ratings.average, 0) / myReviews.length;
            if (overallEl) overallEl.textContent = avg.toFixed(1);
            if (starsEl) starsEl.textContent = getStarString(avg);
            if (countEl) countEl.textContent = myReviews.length + ' ta sharh';
        }

        // Breakdown
        const breakdown = document.getElementById('ratingBreakdown');
        if (breakdown && myReviews.length > 0) {
            const cats = ['quality', 'payment', 'behavior'];
            const catNames = { quality: 'Ish sifati', payment: "To'lov", behavior: 'Muomala' };
            breakdown.innerHTML = cats.map(cat => {
                const avg = myReviews.reduce((s, r) => s + (r.ratings[cat] || 0), 0) / myReviews.length;
                return `
                <div style="margin-bottom:0.5rem">
                    <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:0.25rem">
                        <span>${catNames[cat]}</span><span>${avg.toFixed(1)}</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.1);border-radius:4px;height:6px">
                        <div style="background:linear-gradient(90deg,#f59e0b,#fbbf24);width:${avg / 5 * 100}%;height:100%;border-radius:4px"></div>
                    </div>
                </div>`;
            }).join('');
        }

        // Reviews list
        const reviewsList = document.getElementById('reviewsList');
        if (reviewsList) {
            if (myReviews.length === 0) {
                reviewsList.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⭐</div><div class="empty-state-text">Hali sharhlar yo'q</div></div>`;
            } else {
                reviewsList.innerHTML = [...myReviews].reverse().map(r => `
                    <div style="padding:1rem;border-bottom:1px solid rgba(255,255,255,0.05)">
                        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
                            <div style="font-weight:600">${r.fromUserName || 'Foydalanuvchi'}</div>
                            <div style="color:#f59e0b">${getStarString(r.ratings.average)}</div>
                        </div>
                        ${r.comment ? `<p style="color:var(--text-secondary);font-size:0.9rem">${r.comment}</p>` : ''}
                        <div style="color:var(--text-muted);font-size:0.8rem;margin-top:0.5rem">${formatDate(r.createdAt)}</div>
                    </div>`).join('');
            }
        }

        // Skills & Certs
        loadSkillsUI();
    } catch (e) { console.error('Reviews error:', e); }
}

function getStarString(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

// ===== SKILLS =====
function loadSkillsUI() {
    const skills = currentUser.profile?.skills || [];
    const certs = currentUser.profile?.certificates || [];

    ['skillsList', 'profileSkillsList'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (skills.length === 0) {
            el.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem">Ko\'nikma qo\'shilmagan</p>';
        } else {
            el.innerHTML = skills.map((s, i) => `
                <span class="skill-tag" style="display:inline-flex;align-items:center;gap:0.35rem;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.4);border-radius:2rem;padding:0.35rem 0.75rem;margin:0.25rem;font-size:0.85rem">
                    ${s} <button onclick="removeSkill(${i})" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.9rem">×</button>
                </span>`).join('');
        }
    });

    const certEl = document.getElementById('certificatesList');
    if (certEl) {
        certEl.innerHTML = certs.length === 0
            ? '<p style="color:var(--text-muted);font-size:0.9rem">Sertifikat qo\'shilmagan</p>'
            : certs.map((c, i) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.05)">
                    <span>🏆 ${c}</span>
                    <button onclick="removeCertificate(${i})" class="btn-secondary btn-small">Olib tashlash</button>
                </div>`).join('');
    }
}

function addSkill() {
    const skill = prompt('Ko\'nikma nomini kiriting (masalan: Elektrik montaj, Kafel yotqizish):');
    if (!skill?.trim()) return;
    if (!currentUser.profile) currentUser.profile = {};
    if (!currentUser.profile.skills) currentUser.profile.skills = [];
    currentUser.profile.skills.push(skill.trim());
    updateCurrentUser();
    loadSkillsUI();
    showToast('✅ Ko\'nikma qo\'shildi!', 'success');
}

function removeSkill(index) {
    if (!currentUser.profile?.skills) return;
    currentUser.profile.skills.splice(index, 1);
    updateCurrentUser();
    loadSkillsUI();
}

function addCertificate() {
    const cert = prompt('Sertifikat nomini kiriting:');
    if (!cert?.trim()) return;
    if (!currentUser.profile) currentUser.profile = {};
    if (!currentUser.profile.certificates) currentUser.profile.certificates = [];
    currentUser.profile.certificates.push(cert.trim());
    updateCurrentUser();
    loadSkillsUI();
    showToast('✅ Sertifikat qo\'shildi!', 'success');
}

function removeCertificate(index) {
    if (!currentUser.profile?.certificates) return;
    currentUser.profile.certificates.splice(index, 1);
    updateCurrentUser();
    loadSkillsUI();
}

// ===== PROFILE HERO =====
function loadProfileHero() {
    const profile = currentUser.profile || {};
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    setEl('profileHeroName', currentUser.name || 'Ism');
    setEl('profileHeroTitle', profile.jobType || 'Kasb ko\'rsatilmagan');
    setEl('profileHeroLocation', '📍 ' + (profile.region || 'Hududingizni belgilang'));
    setEl('heroCompletedJobs', currentUser.completedJobs || 0);
    setEl('heroRating', (currentUser.rating || 0).toFixed(1) + '⭐');
    setEl('heroExperience', (profile.experience || 0) + ' yil');

    const avatarEl = document.getElementById('profileAvatarLarge');
    if (avatarEl) avatarEl.textContent = (currentUser.name || '?').charAt(0).toUpperCase();

    const verEl = document.getElementById('verificationStatus');
    if (verEl) {
        if (currentUser.verified) {
            verEl.innerHTML = '<div style="color:#10b981;font-size:1rem">✅ Tasdiqlangan profil</div>';
        } else if (currentUser.verificationStatus === 'pending') {
            verEl.innerHTML = '<div style="color:#f59e0b">⏳ Tekshirilmoqda...</div>';
        } else {
            verEl.innerHTML = '<div style="color:var(--text-muted)">❌ Tasdiqlanmagan</div>';
        }
    }
}

function requestVerification() {
    startVerificationProcess();
}

function shareProfile() {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({ title: 'TrustID - ' + currentUser.name, url });
    } else {
        navigator.clipboard?.writeText(url);
        showToast('🔗 Havola nusxalandi!', 'success');
    }
}

function saveProfile(event) {
    event.preventDefault();
    try {
        currentUser.name = document.getElementById('profileName')?.value || currentUser.name;
        if (!currentUser.profile) currentUser.profile = {};
        currentUser.profile.region = document.getElementById('profileRegion')?.value || '';
        currentUser.profile.jobType = document.getElementById('profileJobType')?.value || '';
        currentUser.profile.experience = document.getElementById('profileExperience')?.value || 0;
        currentUser.profile.expectedSalary = document.getElementById('profileExpectedSalary')?.value || 0;
        currentUser.profile.description = document.getElementById('profileDescription')?.value || '';
        currentUser.profile.availability = document.getElementById('profileAvailability')?.value || 'available';

        updateCurrentUser();
        loadProfileHero();
        updateProfileCompletionUI();
        loadAIRecommendedJobs();
        showToast('✅ Profil saqlandi!', 'success');
        document.getElementById('userInitials').textContent = currentUser.name.charAt(0).toUpperCase();
    } catch (e) {
        console.error(e);
        showToast('❌ Xatolik yuz berdi', 'error');
    }
}

// ===== NOTIFICATIONS =====
function loadNotifications() {
    const notifications = JSON.parse(localStorage.getItem('trustid_notifications') || '[]');
    const myNotifs = notifications.filter(n => n.userId === currentUser.id);
    const unread = myNotifs.filter(n => !n.read).length;

    const dotEl = document.getElementById('notifDot');
    const badgeEl = document.getElementById('alertsBadge');
    if (dotEl) dotEl.style.display = unread > 0 ? 'block' : 'none';
    if (badgeEl) { badgeEl.style.display = unread > 0 ? 'flex' : 'none'; badgeEl.textContent = unread; }

    const container = document.getElementById('notificationsList');
    if (!container) return;

    if (myNotifs.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔔</div><div class="empty-state-text">Bildirishnomalar yo'q</div></div>`;
        return;
    }

    container.innerHTML = [...myNotifs].reverse().map(n => `
        <div class="notification-item ${n.read ? '' : 'unread'}" onclick="markRead('${n.id}')"
             style="padding:1rem;display:flex;gap:1rem;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;${!n.read ? 'background:rgba(99,102,241,0.05)' : ''}">
            <div style="font-size:1.5rem">🔔</div>
            <div style="flex:1">
                <div style="font-weight:600;margin-bottom:0.25rem">${n.title}</div>
                <div style="color:var(--text-secondary);font-size:0.9rem">${n.message}</div>
                <div style="color:var(--text-muted);font-size:0.8rem;margin-top:0.35rem">${formatDate(n.createdAt)}</div>
            </div>
            ${!n.read ? '<div style="width:8px;height:8px;background:#6366f1;border-radius:50%;margin-top:0.5rem;flex-shrink:0"></div>' : ''}
        </div>`).join('');
}

function markRead(notifId) {
    const notifications = JSON.parse(localStorage.getItem('trustid_notifications') || '[]');
    const idx = notifications.findIndex(n => n.id === notifId);
    if (idx !== -1) {
        notifications[idx].read = true;
        localStorage.setItem('trustid_notifications', JSON.stringify(notifications));
        loadNotifications();
    }
}

function markAllRead() {
    const notifications = JSON.parse(localStorage.getItem('trustid_notifications') || '[]');
    notifications.forEach(n => { if (n.userId === currentUser.id) n.read = true; });
    localStorage.setItem('trustid_notifications', JSON.stringify(notifications));
    loadNotifications();
    showToast('✅ Hammasi o\'qildi', 'success');
}

// ===== JOB ALERTS =====
function loadJobAlerts() {
    const alerts = JSON.parse(localStorage.getItem(`trustid_alerts_${currentUser.id}`) || '[]');
    const dashContainer = document.getElementById('jobAlerts');
    const pageContainer = document.getElementById('alertsList');

    const renderAlerts = (container) => {
        if (!container) return;
        if (alerts.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem">Ogohlantirish yo\'q. Yangi qo\'shing.</p>';
            return;
        }
        container.innerHTML = alerts.map((a, i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid rgba(255,255,255,0.05)">
                <div>
                    <div style="font-weight:600">${a.category || 'Barcha'} - ${a.region || 'Barcha hudud'}</div>
                    <div style="color:var(--text-muted);font-size:0.85rem">Kunlik xabar</div>
                </div>
                <button onclick="deleteAlert(${i})" class="btn-secondary btn-small">🗑️</button>
            </div>`).join('');
    };

    renderAlerts(dashContainer);
    renderAlerts(pageContainer);
}

function createJobAlert() {
    const alertContent = document.getElementById('alertContent');
    if (alertContent) {
        alertContent.innerHTML = `
            <h2 style="margin-bottom:1.5rem">🔔 Yangi ogohlantirish</h2>
            <form onsubmit="saveJobAlert(event)" style="display:flex;flex-direction:column;gap:1rem">
                <div>
                    <label style="display:block;margin-bottom:0.5rem">Kasb turi</label>
                    <select id="alertCategory" class="sort-select" style="width:100%">
                        <option value="">Barchasi</option>
                        <option>Qurilish</option><option>Elektrik</option><option>Santexnik</option>
                        <option>Bog'dorchilik</option><option>Duradgorlik</option><option>Oshpazlik</option>
                    </select>
                </div>
                <div>
                    <label style="display:block;margin-bottom:0.5rem">Hudud</label>
                    <select id="alertRegion" class="sort-select" style="width:100%">
                        <option value="">Barchasi</option>
                        <option>Toshkent</option><option>Samarqand</option><option>Buxoro</option>
                        <option>Andijon</option><option>Farg'ona</option><option>Namangan</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary" style="width:100%;justify-content:center">Saqlash</button>
            </form>`;
    }
    openModal('alertModal');
}

function saveJobAlert(e) {
    e.preventDefault();
    const alerts = JSON.parse(localStorage.getItem(`trustid_alerts_${currentUser.id}`) || '[]');
    alerts.push({
        category: document.getElementById('alertCategory')?.value || '',
        region: document.getElementById('alertRegion')?.value || '',
        createdAt: new Date().toISOString()
    });
    localStorage.setItem(`trustid_alerts_${currentUser.id}`, JSON.stringify(alerts));
    closeAlertModal();
    loadJobAlerts();
    showToast('✅ Ogohlantirish yaratildi!', 'success');
}

function deleteAlert(index) {
    const alerts = JSON.parse(localStorage.getItem(`trustid_alerts_${currentUser.id}`) || '[]');
    alerts.splice(index, 1);
    localStorage.setItem(`trustid_alerts_${currentUser.id}`, JSON.stringify(alerts));
    loadJobAlerts();
}

// ===== URGENT JOBS (dashboard) =====
function loadUrgentJobs() {
    const jobs = JSON.parse(localStorage.getItem('trustid_jobs') || '[]')
        .filter(j => j.status === 'active' && j.urgent).slice(0, 3);
    const container = document.getElementById('urgentJobs');
    if (!container) return;
    if (jobs.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem">Hozircha shoshilinch ish yo\'q</p>';
        return;
    }
    container.innerHTML = jobs.map(job => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer" onclick="showSection('jobs')">
            <div>
                <div style="font-weight:600;font-size:0.95rem">${job.title}</div>
                <div style="color:var(--text-muted);font-size:0.8rem">📍 ${job.location}</div>
            </div>
            <div style="font-weight:700;color:#10b981;white-space:nowrap">${formatCurrency(job.salary)}</div>
        </div>`).join('');
}

// ===== BADGE UPDATES =====
function updateBadges() {
    const applications = JSON.parse(localStorage.getItem('trustid_applications') || '[]');
    const userApps = applications.filter(a => a.workerId === currentUser.id).length;
    const jobs = JSON.parse(localStorage.getItem('trustid_jobs') || '[]').filter(j => j.status === 'active').length;
    const saved = getSavedJobs().length;
    const notifications = JSON.parse(localStorage.getItem('trustid_notifications') || '[]')
        .filter(n => n.userId === currentUser.id && !n.read).length;

    const setBadge = (id, val) => {
        const el = document.getElementById(id);
        if (el) { el.textContent = val; el.style.display = val > 0 ? 'flex' : 'none'; }
    };
    setBadge('jobsBadge', jobs);
    setBadge('appsBadge', userApps);
    setBadge('savedBadge', saved);

    const notifDot = document.getElementById('notifDot');
    if (notifDot) notifDot.style.display = notifications > 0 ? 'block' : 'none';
}

// ===== MODALS =====
function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
}

function closeJobModal() {
    const m = document.getElementById('jobDetailModal');
    if (m) m.classList.remove('active');
}
function closeApplyModal() {
    const m = document.getElementById('applyModal');
    if (m) m.classList.remove('active');
}
function closeReviewModal() {
    const m = document.getElementById('reviewModal');
    if (m) m.classList.remove('active');
}
function closePremiumModal() {
    // Try both: dynamic modal and static modal in HTML
    ['premiumModal'].forEach(id => {
        const m = document.getElementById(id);
        if (m) { m.classList.remove('active'); if (m.dataset.dynamic) m.remove(); }
    });
}
function closeAlertModal() {
    const m = document.getElementById('alertModal');
    if (m) m.classList.remove('active');
}

// ===== TOAST =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const colors = { success: '#10b981', error: '#ef4444', info: '#6366f1', warning: '#f59e0b' };
    const toast = document.createElement('div');
    toast.style.cssText = `
        background:${colors[type] || colors.info};color:white;padding:0.75rem 1.5rem;
        border-radius:0.75rem;font-size:0.9rem;font-weight:500;
        box-shadow:0 4px 20px rgba(0,0,0,0.3);
        animation:slideInRight 0.3s ease;margin-top:0.5rem;
    `;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// Add toast animation
const toastStyle = document.createElement('style');
toastStyle.textContent = `
@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
.toast-container { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; flex-direction: column; }
.salary-box { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); border-radius: 1rem; padding: 1.25rem; margin-bottom: 1.5rem; }
.salary-amount { font-size: 1.75rem; font-weight: 800; color: #10b981; margin-bottom: 0.25rem; }
.job-detail-content { padding: 0.5rem; }
`;
document.head.appendChild(toastStyle);

// ===== OVERRIDE showSection to add extra loads =====
const _origShowSection = window.showSection;
window.showSection = function (sectionName) {
    if (_origShowSection) _origShowSection(sectionName);

    // Close mobile sidebar
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');

    // Update page subtitle
    const subtitles = {
        dashboard: 'Bugungi ish imkoniyatlari',
        jobs: 'Barcha mavjud ishlarni ko\'ring',
        saved: 'Saqlagan ishlaringiz',
        applications: 'Yuborilgan murojaatlar',
        contracts: 'Faol va tugallangan shartnomalar',
        earnings: 'Daromad va to\'lovlar',
        reviews: 'Sharhlar va ko\'nikmalar',
        profile: 'Shaxsiy ma\'lumotlar',
        alerts: 'Bildirishnomalar va sozlamalar'
    };
    const subtitleEl = document.getElementById('pageSubtitle');
    if (subtitleEl && subtitles[sectionName]) subtitleEl.textContent = subtitles[sectionName];

    // Extended titles
    const titles = {
        saved: 'Saqlangan ishlar', earnings: 'Daromad', reviews: 'Sharhlar', alerts: 'Bildirishnomalar'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl && titles[sectionName]) titleEl.textContent = titles[sectionName];

    // Header search visibility
    const headerSearch = document.getElementById('headerSearch');
    if (headerSearch) headerSearch.style.display = sectionName === 'jobs' ? 'none' : 'flex';

    // Load section specific data
    switch (sectionName) {
        case 'dashboard':
            updateProfileCompletionUI();
            loadUrgentJobs();
            loadJobAlerts();
            updateBadges();
            break;
        case 'jobs':
            liveSearchJobs();
            break;
        case 'saved':
            loadSavedJobs();
            break;
        case 'earnings':
            loadEarnings();
            break;
        case 'reviews':
            loadReviews();
            break;
        case 'profile':
            loadProfileHero();
            loadSkillsUI();
            updateProfileCompletionUI();
            break;
        case 'alerts':
            loadNotifications();
            loadJobAlerts();
            break;
    }
};

// ===== INIT EXTRAS on DOMContentLoaded =====
document.addEventListener('DOMContentLoaded', () => {
    // Wait for currentUser from enhanced.js
    setTimeout(() => {
        if (typeof currentUser !== 'undefined' && currentUser) {
            initOpenToWork();
            updateProfileCompletionUI();
            updateBadges();
            loadUrgentJobs();
            loadJobAlerts();
        }
    }, 200);
});
