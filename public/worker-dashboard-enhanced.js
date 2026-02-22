// Enhanced Worker Dashboard with AI Matching & Premium Features
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Enhanced Worker Dashboard Loading...');

    // Check authentication
    const userStr = localStorage.getItem('trustid_current_user');
    if (!userStr) {
        console.log('No user found, redirecting to index');
        window.location.href = 'index.html';
        return;
    }

    currentUser = JSON.parse(userStr);
    console.log('Current user:', currentUser);

    if (currentUser.type !== 'worker') {
        console.log('User is not a worker, redirecting');
        window.location.href = 'index.html';
        return;
    }

    console.log('Initializing enhanced dashboard...');
    initializeDashboard();
});

function initializeDashboard() {
    try {
        // Set user info
        const balanceEl = document.getElementById('userBalance');
        const initialsEl = document.getElementById('userInitials');

        if (balanceEl) balanceEl.textContent = formatCurrency(currentUser.balance || 0);
        if (initialsEl) initialsEl.textContent = currentUser.name.charAt(0).toUpperCase();

        // Load dashboard data with AI
        loadDashboardStats();
        loadAIRecommendedJobs(); // AI-powered recommendations
        loadRecentActivity();
        loadProfile();

        // Check premium status
        checkPremiumStatus();

        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

// AI MATCHING SYSTEM - Recommends jobs based on worker profile
function loadAIRecommendedJobs() {
    try {
        const jobs = JSON.parse(localStorage.getItem('trustid_jobs') || '[]');
        const activeJobs = jobs.filter(j => j.status === 'active');

        const container = document.getElementById('recommendedJobs');
        if (!container) return;

        if (activeJobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💼</div>
                    <div class="empty-state-text">Hozircha mavjud ishlar yo'q</div>
                    <p style="color: var(--text-muted); margin-top: 0.5rem; font-size: 0.875rem;">
                        Ish beruvchilar ish e'lon qilganida AI sizga mos ishlarni tavsiya qiladi
                    </p>
                </div>
            `;
            return;
        }

        // AI MATCHING ALGORITHM
        const matchedJobs = calculateJobMatches(activeJobs);
        const topMatches = matchedJobs.slice(0, 3);

        container.innerHTML = topMatches.map(jobMatch => `
            <div class="job-card ${jobMatch.matchScore >= 80 ? 'ai-highlighted' : ''}">
                ${jobMatch.matchScore >= 80 ? `
                    <div class="ai-badge">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="margin-right: 0.25rem;">
                            <path d="M8 2L10 6L14 7L11 10L12 14L8 12L4 14L5 10L2 7L6 6L8 2Z" fill="currentColor"/>
                        </svg>
                        AI Match ${jobMatch.matchScore}%
                    </div>
                ` : ''}
                <div class="job-header">
                    <div>
                        <div class="job-title">${jobMatch.job.title}</div>
                        <span class="job-category">${jobMatch.job.category}</span>
                        ${jobMatch.job.escrowRequired ? '<span class="escrow-badge">🛡️ Kafolatli</span>' : ''}
                        ${jobMatch.job.urgent ? '<span class="urgent-badge">⚡ Tezkor</span>' : ''}
                    </div>
                    <div class="job-salary">${formatCurrency(jobMatch.job.salary)}</div>
                </div>
                <div class="job-meta">
                    <span class="job-meta-item">📍 ${jobMatch.job.location}</span>
                    <span class="job-meta-item">⏱️ ${jobMatch.job.duration}</span>
                    ${jobMatch.job.employerRating ? `<span class="job-meta-item">⭐ ${jobMatch.job.employerRating.toFixed(1)}</span>` : ''}
                </div>
                <div class="job-description">${jobMatch.job.description.substring(0, 100)}...</div>
                ${jobMatch.matchReasons.length > 0 ? `
                    <div class="match-reasons">
                        <strong>Nima uchun mos:</strong>
                        <ul>
                            ${jobMatch.matchReasons.map(reason => `<li>✓ ${reason}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                <div class="job-actions">
                    <button class="btn-primary" onclick="oneClickApply('${jobMatch.job.id}')">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 2L12 8L18 9L13 13L15 19L10 16L5 19L7 13L2 9L8 8L10 2Z" fill="currentColor"/>
                        </svg>
                        Bir bosishda murojaat
                    </button>
                    <button class="btn-secondary" onclick="viewJobDetails('${jobMatch.job.id}')">
                        Batafsil
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading AI recommended jobs:', error);
    }
}

// AI JOB MATCHING ALGORITHM
function calculateJobMatches(jobs) {
    const userProfile = currentUser.profile || {};
    const userJobType = userProfile.jobType || '';
    const userRegion = userProfile.region || '';
    const userExperience = parseInt(userProfile.experience) || 0;

    return jobs.map(job => {
        let score = 0;
        const reasons = [];

        // Match by job category (40 points)
        if (userJobType && job.category === userJobType) {
            score += 40;
            reasons.push(`${userJobType} mutaxassisligiga mos`);
        } else if (userJobType && job.category.includes(userJobType)) {
            score += 20;
        }

        // Match by location (30 points)
        if (userRegion && job.location === userRegion) {
            score += 30;
            reasons.push(`Sizning hududingizda (${userRegion})`);
        } else if (userRegion && job.location.includes(userRegion)) {
            score += 15;
        }

        // Match by experience (20 points)
        const requiredExp = job.requiredExperience || 0;
        if (userExperience >= requiredExp) {
            score += 20;
            if (requiredExp > 0) {
                reasons.push(`${requiredExp} yillik talabga javob berasiz`);
            }
        } else if (userExperience >= requiredExp * 0.7) {
            score += 10;
        }

        // Bonus points (10 points)
        if (job.escrowRequired) {
            score += 5;
            reasons.push('Kafolatli to\'lov');
        }
        if (currentUser.rating >= 4.0 && job.minRating && currentUser.rating >= job.minRating) {
            score += 5;
            reasons.push('Reytingingiz talabga mos');
        }

        return {
            job,
            matchScore: Math.min(100, score),
            matchReasons: reasons
        };
    }).sort((a, b) => b.matchScore - a.matchScore);
}

// ONE-CLICK APPLY FUNCTION
function oneClickApply(jobId) {
    try {
        const applications = JSON.parse(localStorage.getItem('trustid_applications') || '[]');

        // Check profile completeness
        const profile = currentUser.profile || {};
        if (!profile.jobType || !profile.region || !profile.experience) {
            if (confirm('Profilingiz to\'liq emas. Profilni to\'ldirmoqchimisiz?')) {
                showSection('profile');
            }
            return;
        }

        // Check if already applied
        if (applications.find(a => a.jobId === jobId && a.workerId === currentUser.id)) {
            alert('Siz allaqachon bu ishga murojaat yuborgansiz!');
            return;
        }

        // Check verification status
        if (!currentUser.verified) {
            if (confirm('Profilingiz tasdiqlanmagan. Tasdiqlash jarayonini boshlaysizmi?')) {
                startVerificationProcess();
            }
            return;
        }

        // ONE-CLICK APPLICATION
        const job = JSON.parse(localStorage.getItem('trustid_jobs') || '[]').find(j => j.id === jobId);

        const newApplication = {
            id: Date.now().toString(),
            jobId,
            workerId: currentUser.id,
            workerName: currentUser.name,
            workerProfile: {
                jobType: profile.jobType,
                experience: profile.experience,
                rating: currentUser.rating || 0,
                completedJobs: currentUser.completedJobs || 0,
                verified: currentUser.verified || false
            },
            status: 'pending',
            appliedAt: new Date().toISOString(),
            coverLetter: `Assalomu alaykum! Men ${profile.experience} yillik tajribaga ega ${profile.jobType} mutaxassisiman. ${job.title} ishiga qiziqaman va o'z tajribamni ulashishga tayyorman.`
        };

        applications.push(newApplication);
        localStorage.setItem('trustid_applications', JSON.stringify(applications));

        // Send notification to employer
        sendNotificationToEmployer(job.employerId, 'Yangi murojaat', `${currentUser.name} sizning "${job.title}" ishingizga murojaat yubordi.`);

        // Success animation
        alert('✅ Murojaat muvaffaqiyatli yuborildi!\n\nIsh beruvchi tez orada ko\'rib chiqadi.');
        loadApplications();

        // Refresh recommendations
        loadAIRecommendedJobs();
    } catch (error) {
        console.error('Error in one-click apply:', error);
        alert('Xatolik yuz berdi!');
    }
}

// VERIFICATION SYSTEM
function startVerificationProcess() {
    const modal = `
        <div class="modal active" id="verificationModal">
            <div class="modal-overlay" onclick="closeVerificationModal()"></div>
            <div class="modal-content" style="max-width: 600px;">
                <button class="modal-close" onclick="closeVerificationModal()">×</button>
                <h2 style="margin-bottom: 2rem; text-align: center;">
                    🔐 ID Verifikatsiya
                </h2>
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                        Profilingizni tasdiqlash uchun quyidagi hujjatlarni yuklang:
                    </p>
                    <ul style="color: var(--text-secondary); padding-left: 1.5rem;">
                        <li>Passport yoki ID karta rasmi</li>
                        <li>Selfie (yuzingiz bilan)</li>
                        <li>Sertifikat (agar mavjud bo'lsa)</li>
                    </ul>
                </div>
                <form onsubmit="submitVerification(event)" style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem;">Passport/ID rasmi</label>
                        <input type="file" id="idDocument" accept="image/*" required class="file-input">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem;">Selfie</label>
                        <input type="file" id="selfiePhoto" accept="image/*" required class="file-input">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem;">Sertifikat (ixtiyoriy)</label>
                        <input type="file" id="certificate" accept="image/*,application/pdf" class="file-input">
                    </div>
                    <button type="submit" class="btn-primary" style="width: 100%; justify-content: center;">
                        Yuborish
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}

function submitVerification(event) {
    event.preventDefault();

    // Simulate verification process
    alert('📤 Hujjatlaringiz yuborildi!\n\n✅ Admin 24 soat ichida ko\'rib chiqadi.');
    closeVerificationModal();

    // In real app, this would upload files to server
    // For demo, we'll mark as pending verification
    currentUser.verificationStatus = 'pending';
    updateCurrentUser();
}

function closeVerificationModal() {
    const modal = document.getElementById('verificationModal');
    if (modal) modal.remove();
}

// PREMIUM FEATURES
function checkPremiumStatus() {
    const premiumData = JSON.parse(localStorage.getItem('trustid_premium') || '{}');
    const userPremium = premiumData[currentUser.id];

    if (userPremium && new Date(userPremium.expiresAt) > new Date()) {
        currentUser.isPremium = true;
        currentUser.premiumExpiresAt = userPremium.expiresAt;
        showPremiumBadge();
    }
}

function showPremiumBadge() {
    const avatar = document.getElementById('userAvatar');
    if (avatar && !avatar.querySelector('.premium-badge')) {
        avatar.insertAdjacentHTML('beforeend', `
            <div class="premium-badge" title="Premium foydalanuvchi">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2L10 6L14 7L11 10L12 14L8 12L4 14L5 10L2 7L6 6L8 2Z" fill="gold"/>
                </svg>
            </div>
        `);
    }
}

function showPremiumUpgrade() {
    const modal = `
        <div class="modal active" id="premiumModal">
            <div class="modal-overlay" onclick="closePremiumModal()"></div>
            <div class="modal-content" style="max-width: 700px;">
                <button class="modal-close" onclick="closePremiumModal()">×</button>
                <h2 style="margin-bottom: 1rem; text-align: center;">
                    ⭐ Premium Obuna
                </h2>
                <p style="text-align: center; color: var(--text-muted); margin-bottom: 2rem;">
                    Premium obuna bilan ko'proq ish topib, yuqori daromad qiling!
                </p>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <div class="premium-feature">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🚀</div>
                        <h3 style="margin-bottom: 0.5rem;">Profilni ko'tarish</h3>
                        <p style="color: var(--text-muted); font-size: 0.875rem;">Profilingiz tepada ko'rinadi</p>
                    </div>
                    
                    <div class="premium-feature">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🤖</div>
                        <h3 style="margin-bottom: 0.5rem;">AI ustuvor tavsiya</h3>
                        <p style="color: var(--text-muted); font-size: 0.875rem;">Birinchi bo'lib mos ishlarni ko'ring</p>
                    </div>
                    
                    <div class="premium-feature">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📊</div>
                        <h3 style="margin-bottom: 0.5rem;">Kengaytirilgan statistika</h3>
                        <p style="color: var(--text-muted); font-size: 0.875rem;">Batafsil tahlil va hisobotlar</p>
                    </div>
                    
                    <div class="premium-feature">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚡</div>
                        <h3 style="margin-bottom: 0.5rem;">Cheksiz murojaat</h3>
                        <p style="color: var(--text-muted); font-size: 0.875rem;">Kunlik limitlarsiz</p>
                    </div>
                </div>
                
                <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 1.5rem; padding: 2rem; text-align: center; color: white;">
                    <div style="font-size: 3rem; font-weight: 800; margin-bottom: 0.5rem;">49,000 so'm</div>
                    <div style="font-size: 1.125rem; opacity: 0.9; margin-bottom: 1.5rem;">oyiga</div>
                    <button class="btn-primary" onclick="upgradeToPremium()" style="background: white; color: #6366f1; width: 100%; justify-content: center;">
                        Premium sotib olish
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}

function upgradeToPremium() {
    // Simulate payment process
    if (confirm('Premium obunani sotib olmoqchimisiz?\nNarxi: 49,000 so\'m/oy')) {
        const premiumData = JSON.parse(localStorage.getItem('trustid_premium') || '{}');
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        premiumData[currentUser.id] = {
            activatedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
            type: 'worker_premium'
        };

        localStorage.setItem('trustid_premium', JSON.stringify(premiumData));

        currentUser.isPremium = true;
        currentUser.premiumExpiresAt = expiresAt.toISOString();
        updateCurrentUser();

        alert('🎉 Premium obuna faollashtirildi!\n\nEndi siz premium imkoniyatlardan foydalana olasiz.');
        closePremiumModal();
        showPremiumBadge();
        loadAIRecommendedJobs(); // Refresh with premium priority
    }
}

function closePremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) modal.remove();
}

// ESCROW TRACKING - View escrow status
function viewEscrowStatus(contractId) {
    const contracts = JSON.parse(localStorage.getItem('trustid_contracts') || '[]');
    const contract = contracts.find(c => c.id === contractId);

    if (!contract) return;

    const escrows = JSON.parse(localStorage.getItem('trustid_escrow') || '[]');
    const escrow = escrows.find(e => e.contractId === contractId);

    alert(`
        💰 Escrow Holati
        
        Ish: ${contract.jobTitle}
        Summa: ${formatCurrency(contract.amount)}
        
        ${escrow ? `
        ✅ To'lov kafolatda saqlanmoqda
        Status: ${escrow.status === 'held' ? 'Ushlab turilgan' : escrow.status === 'released' ? 'To\'langan' : 'Qaytarilgan'}
        ${escrow.status === 'held' ? '\n⏳ Ish tugallangandan so\'ng avtomatik to\'lanadi' : ''}
        ` : '❌ Escrow topilmadi'}
    `);
}

// RATING SYSTEM - Submit rating after job completion
function submitRating(contractId, employerId) {
    const modal = `
        <div class="modal active" id="ratingModal">
            <div class="modal-overlay" onclick="closeRatingModal()"></div>
            <div class="modal-content">
                <button class="modal-close" onclick="closeRatingModal()">×</button>
                <h2 style="margin-bottom: 2rem; text-align: center;">⭐ Baho berish</h2>
                
                <form onsubmit="saveRating(event, '${contractId}', '${employerId}')" style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem;">Ish sifati (1-5)</label>
                        <div class="star-rating" id="qualityRating">
                            ${[1, 2, 3, 4, 5].map(i => `<span class="star" data-rating="${i}" onclick="setRating('qualityRating', ${i})">☆</span>`).join('')}
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem;">To'lov tizimi (1-5)</label>
                        <div class="star-rating" id="paymentRating">
                            ${[1, 2, 3, 4, 5].map(i => `<span class="star" data-rating="${i}" onclick="setRating('paymentRating', ${i})">☆</span>`).join('')}
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem;">Muomala madaniyati (1-5)</label>
                        <div class="star-rating" id="behaviorRating">
                            ${[1, 2, 3, 4, 5].map(i => `<span class="star" data-rating="${i}" onclick="setRating('behaviorRating', ${i})">☆</span>`).join('')}
                        </div>
                    </div>
                    
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem;">Izoh (ixtiyoriy)</label>
                        <textarea id="reviewComment" rows="3" style="width: 100%; padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.1); background: rgba(30,41,59,0.5); color: white;"></textarea>
                    </div>
                    
                    <button type="submit" class="btn-primary" style="width: 100%; justify-content: center;">
                        Baholashni saqlash
                    </button>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}

let ratingValues = { qualityRating: 0, paymentRating: 0, behaviorRating: 0 };

function setRating(ratingId, value) {
    ratingValues[ratingId] = value;
    const stars = document.querySelectorAll(`#${ratingId} .star`);
    stars.forEach((star, index) => {
        star.textContent = index < value ? '★' : '☆';
    });
}

function saveRating(event, contractId, employerId) {
    event.preventDefault();

    if (ratingValues.qualityRating === 0 || ratingValues.paymentRating === 0 || ratingValues.behaviorRating === 0) {
        alert('Iltimos, barcha baholarni bering!');
        return;
    }

    const averageRating = (ratingValues.qualityRating + ratingValues.paymentRating + ratingValues.behaviorRating) / 3;
    const comment = document.getElementById('reviewComment').value;

    const reviews = JSON.parse(localStorage.getItem('trustid_reviews') || '[]');
    reviews.push({
        id: Date.now().toString(),
        contractId,
        fromUserId: currentUser.id,
        fromUserName: currentUser.name,
        fromUserType: 'worker',
        toUserId: employerId,
        ratings: {
            quality: ratingValues.qualityRating,
            payment: ratingValues.paymentRating,
            behavior: ratingValues.behaviorRating,
            average: averageRating
        },
        comment,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem('trustid_reviews', JSON.stringify(reviews));

    // Update employer rating
    updateUserRating(employerId);

    alert('✅ Baho muvaffaqiyatli saqlandi!\nRahmat!');
    closeRatingModal();

    // Reset values
    ratingValues = { qualityRating: 0, paymentRating: 0, behaviorRating: 0 };
}

function closeRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (modal) modal.remove();
}

function updateUserRating(userId) {
    const reviews = JSON.parse(localStorage.getItem('trustid_reviews') || '[]');
    const userReviews = reviews.filter(r => r.toUserId === userId);

    if (userReviews.length > 0) {
        const avgRating = userReviews.reduce((sum, r) => sum + r.ratings.average, 0) / userReviews.length;

        const users = JSON.parse(localStorage.getItem('trustid_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].rating = avgRating;
            users[userIndex].totalReviews = userReviews.length;
            localStorage.setItem('trustid_users', JSON.stringify(users));
        }
    }
}

// NOTIFICATION SYSTEM
function sendNotificationToEmployer(employerId, title, message) {
    // In real app, this would send a push notification
    // For now, we'll store in localStorage
    const notifications = JSON.parse(localStorage.getItem('trustid_notifications') || '[]');
    notifications.push({
        id: Date.now().toString(),
        userId: employerId,
        title,
        message,
        read: false,
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('trustid_notifications', JSON.stringify(notifications));
}

// Section Navigation
function showSection(sectionName) {
    console.log('Showing section:', sectionName);

    try {
        // Update nav items
        const allNavItems = document.querySelectorAll('.nav-item');
        allNavItems.forEach(item => item.classList.remove('active'));

        // Find and activate the clicked nav item
        allNavItems.forEach(item => {
            const onclick = item.getAttribute('onclick');
            if (onclick && onclick.includes(`'${sectionName}'`)) {
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
        }

        // Update page title
        const titles = {
            dashboard: 'Bosh sahifa',
            profile: 'Profil',
            jobs: 'Ish qidirish',
            applications: 'Murojaatlarim',
            contracts: 'Shartnomalar',
            transactions: 'To\'lovlar',
            history: 'Tarix'
        };

        const titleEl = document.getElementById('pageTitle');
        if (titleEl && titles[sectionName]) {
            titleEl.textContent = titles[sectionName];
        }

        // Load section data
        loadSectionData(sectionName);
    } catch (error) {
        console.error('Error showing section:', error);
    }
}

function loadSectionData(sectionName) {
    try {
        switch (sectionName) {
            case 'jobs':
                loadAllJobs();
                break;
            case 'applications':
                loadApplications();
                break;
            case 'contracts':
                loadContracts();
                break;
            case 'transactions':
                loadTransactions();
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
        const contracts = JSON.parse(localStorage.getItem('trustid_contracts') || '[]');
        const userContracts = contracts.filter(c => c.workerId === currentUser.id);

        const activeJobs = userContracts.filter(c => c.status === 'active').length;
        const completedJobs = userContracts.filter(c => c.status === 'completed').length;

        const transactions = JSON.parse(localStorage.getItem('trustid_transactions') || '[]');
        const userTransactions = transactions.filter(t => t.receiverId === currentUser.id && t.status === 'completed');
        const totalEarnings = userTransactions.reduce((sum, t) => sum + t.amount, 0);

        document.getElementById('totalJobs').textContent = activeJobs;
        document.getElementById('completedJobs').textContent = completedJobs;
        document.getElementById('userRating').textContent = (currentUser.rating || 0).toFixed(1);
        document.getElementById('totalEarnings').textContent = formatCurrency(totalEarnings);

        // Update user object
        currentUser.completedJobs = completedJobs;
        updateCurrentUser();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Recent Activity
function loadRecentActivity() {
    try {
        const applications = JSON.parse(localStorage.getItem('trustid_applications') || '[]');
        const userApplications = applications.filter(a => a.workerId === currentUser.id).slice(0, 5);

        const activities = [
            {
                icon: currentUser.verified ? '✅' : '⚠️',
                title: currentUser.verified ? 'Profilingiz tasdiqlangan' : 'Profilni tasdiqlang',
                time: currentUser.verified ? 'Faol' : 'Harakatni boshlang',
                action: !currentUser.verified ? 'startVerificationProcess()' : null
            }
        ];

        userApplications.forEach(app => {
            activities.push({
                icon: '📝',
                title: `Murojaat yuborildi`,
                time: formatDate(app.appliedAt)
            });
        });

        if (activities.length === 1) {
            activities.push({
                icon: '💼',
                title: `${JSON.parse(localStorage.getItem('trustid_jobs') || '[]').filter(j => j.status === 'active').length} ta faol ish mavjud`,
                time: 'Bugun'
            });
            activities.push({
                icon: '🌟',
                title: 'Platformaga xush kelibsiz!',
                time: 'Yangi'
            });
        }

        const container = document.getElementById('recentActivity');
        if (!container) return;

        container.innerHTML = activities.map(activity => `
            <div class="activity-item" ${activity.action ? `onclick="${activity.action}" style="cursor: pointer;"` : ''}>
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading activity:', error);
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

// Profile form is handled by saveProfile() in worker-dashboard-extra.js

function updateCurrentUser() {
    // Update in storage
    const users = JSON.parse(localStorage.getItem('trustid_users') || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('trustid_users', JSON.stringify(users));
        localStorage.setItem('trustid_current_user', JSON.stringify(currentUser));
    }
}

// Job Search Functions (continued from previous file with trustid_ prefix)
function toggleFilters() {
    const filters = document.getElementById('jobFilters');
    if (filters) {
        filters.style.display = filters.style.display === 'none' ? 'block' : 'none';
    }
}

function loadAllJobs() {
    try {
        const jobs = JSON.parse(localStorage.getItem('trustid_jobs') || '[]');
        const activeJobs = jobs.filter(j => j.status === 'active');

        const container = document.getElementById('jobsList');
        if (!container) return;

        if (activeJobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">Hozircha ishlar topilmadi</div>
                </div>
            `;
            return;
        }

        // Sort by AI matching score if premium
        let displayJobs = activeJobs;
        if (currentUser.isPremium) {
            const matchedJobs = calculateJobMatches(activeJobs);
            displayJobs = matchedJobs.map(m => m.job);
        }

        container.innerHTML = displayJobs.map(job => `
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
                <div class="job-description">${job.description}</div>
                <div class="job-actions">
                    <button class="btn-primary" onclick="oneClickApply('${job.id}')">
                        Bir bosishda murojaat
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
}

function viewJobDetails(jobId) {
    const jobs = JSON.parse(localStorage.getItem('trustid_jobs') || '[]');
    const job = jobs.find(j => j.id === jobId);

    if (!job) return;

    // Calculate match score
    const match = calculateJobMatches([job])[0];

    const modal = `
        <div class="modal active" id="jobDetailModal">
            <div class="modal-overlay" onclick="closeJobDetailModal()"></div>
            <div class="modal-content" style="max-width: 700px;">
                <button class="modal-close" onclick="closeJobDetailModal()">×</button>
                
                ${match.matchScore >= 80 ? `
                    <div class="ai-badge" style="margin-bottom: 1rem; display: inline-block;">
                        ⭐ AI Match ${match.matchScore}%
                    </div>
                ` : ''}
                
                <h2 style="margin-bottom: 1rem;">${job.title}</h2>
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                    <span class="job-category">${job.category}</span>
                    ${job.escrowRequired ? '<span class="escrow-badge">🛡️ Kafolatli to\'lov</span>' : ''}
                    ${job.urgent ? '<span class="urgent-badge">⚡ Tezkor</span>' : ''}
                </div>
                
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem;">
                    <div style="font-size: 2rem; font-weight: 800; color: #10b981; margin-bottom: 0.5rem;">
                        ${formatCurrency(job.salary)}
                    </div>
                    <div style="color: var(--text-secondary);">
                        📍 ${job.location} | ⏱️ ${job.duration}
                    </div>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 0.5rem;">📝 Tavsif</h3>
                    <p style="color: var(--text-secondary); line-height: 1.7;">${job.description}</p>
                </div>
                
                ${job.requirements && job.requirements.length > 0 ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="margin-bottom: 0.5rem;">✅ Talablar</h3>
                        <ul style="color: var(--text-secondary); padding-left: 1.5rem;">
                            ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${match.matchReasons.length > 0 ? `
                    <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem;">
                        <h3 style="margin-bottom: 0.5rem;">💡 Nima uchun sizga mos:</h3>
                        <ul style="color: var(--text-secondary); padding-left: 1.5rem;">
                            ${match.matchReasons.map(reason => `<li>${reason}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <button class="btn-primary" onclick="oneClickApply('${job.id}')" style="width: 100%; justify-content: center;">
                    Bir bosishda murojaat yuborish
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}

function closeJobDetailModal() {
    const modal = document.getElementById('jobDetailModal');
    if (modal) modal.remove();
}

// Applications
function loadApplications() {
    try {
        const applications = JSON.parse(localStorage.getItem('trustid_applications') || '[]');
        const jobs = JSON.parse(localStorage.getItem('trustid_jobs') || '[]');
        const userApplications = applications.filter(a => a.workerId === currentUser.id);

        const container = document.getElementById('applicationsList');
        if (!container) return;

        if (userApplications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <div class="empty-state-text">Siz hali hech qanday murojaat yubormadingiz</div>
                </div>
            `;
            return;
        }

        container.innerHTML = userApplications.map(app => {
            const job = jobs.find(j => j.id === app.jobId);
            if (!job) return '';

            return `
                <div class="application-card">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">
                                ${job.title}
                            </div>
                            <div style="color: var(--text-muted); font-size: 0.875rem;">
                                Yuborilgan: ${formatDate(app.appliedAt)}
                            </div>
                        </div>
                        <span class="status-badge status-${app.status}">
                            ${app.status === 'pending' ? 'Kutilmoqda' :
                    app.status === 'accepted' ? 'Qabul qilindi' : 'Rad etildi'}
                        </span>
                    </div>
                    <div style="color: var(--text-secondary);">
                        📍 ${job.location} | 💰 ${formatCurrency(job.salary)}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

// Contracts
function loadContracts() {
    try {
        const contracts = JSON.parse(localStorage.getItem('trustid_contracts') || '[]');
        const userContracts = contracts.filter(c => c.workerId === currentUser.id);

        const container = document.getElementById('contractsList');
        if (!container) return;

        if (userContracts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📄</div>
                    <div class="empty-state-text">Sizda faol shartnomalar yo'q</div>
                </div>
            `;
            return;
        }

        container.innerHTML = userContracts.map(contract => `
            <div class="contract-card">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div>
                        <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">
                            ${contract.jobTitle}
                        </div>
                        <div style="color: var(--text-muted); font-size: 0.875rem;">
                            Boshlanish: ${formatDate(contract.startDate)}
                        </div>
                    </div>
                    <span class="status-badge status-${contract.status}">
                        ${contract.status === 'active' ? 'Faol' : 'Tugallangan'}
                    </span>
                </div>
                <div style="color: var(--text-secondary); margin-bottom: 1rem;">
                    💰 ${formatCurrency(contract.amount)}
                    ${contract.escrowId ? ' <span style="color: #10b981;">🛡️ Kafolatda</span>' : ''}
                </div>
                ${contract.status === 'active' ? `
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-primary" onclick="completeContract('${contract.id}')">
                            Ishni tugallangan deb belgilash
                        </button>
                        ${contract.escrowId ? `
                            <button class="btn-secondary" onclick="viewEscrowStatus('${contract.id}')">
                                Escrow holati
                            </button>
                        ` : ''}
                    </div>
                ` : contract.status === 'completed' && !contract.rated ? `
                    <button class="btn-secondary" onclick="submitRating('${contract.id}', '${contract.employerId}')">
                        Ish beruvchini baholash
                    </button>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading contracts:', error);
    }
}

function completeContract(contractId) {
    if (!confirm('Ishni tugalladingizmi? Bu amalni qaytarib bo\'lmaydi.')) return;

    try {
        const contracts = JSON.parse(localStorage.getItem('trustid_contracts') || '[]');
        const contractIndex = contracts.findIndex(c => c.id === contractId);

        if (contractIndex !== -1) {
            contracts[contractIndex].status = 'completed';
            contracts[contractIndex].completedDate = new Date().toISOString();
            localStorage.setItem('trustid_contracts', JSON.stringify(contracts));

            alert('Ish tugallangan deb belgilandi. Ish beruvchi tekshirishi kerak.');
            loadContracts();
            loadDashboardStats();
        }
    } catch (error) {
        console.error('Error completing contract:', error);
        alert('Xatolik yuz berdi!');
    }
}

// Transactions
function loadTransactions() {
    try {
        const transactions = JSON.parse(localStorage.getItem('trustid_transactions') || '[]');
        const userTransactions = transactions.filter(t => t.receiverId === currentUser.id);

        const container = document.getElementById('transactionsList');
        if (!container) return;

        if (userTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💰</div>
                    <div class="empty-state-text">Hali to'lovlar yo'q</div>
                </div>
            `;
            return;
        }

        container.innerHTML = userTransactions.map(tx => `
            <div class="transaction-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">
                            To'lov #${tx.id.slice(0, 8)}
                        </div>
                        <div style="color: var(--text-muted); font-size: 0.875rem;">
                            ${formatDate(tx.date)}
                        </div>
                    </div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">
                        +${formatCurrency(tx.amount)}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// History
function loadHistory() {
    try {
        const contracts = JSON.parse(localStorage.getItem('trustid_contracts') || '[]');
        const completedContracts = contracts.filter(c => c.workerId === currentUser.id && c.status === 'completed');

        const container = document.getElementById('historyList');
        if (!container) return;

        if (completedContracts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📚</div>
                    <div class="empty-state-text">Hali bajarilgan ishlar yo'q</div>
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
                        <div style="color: var(--text-muted); font-size: 0.875rem;">
                            Tugallandi: ${formatDate(contract.completedDate)}
                        </div>
                    </div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: #10b981;">
                        ${formatCurrency(contract.amount)}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading history:', error);
    }
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

function logout() {
    localStorage.removeItem('trustid_current_user');
    window.location.href = 'index.html';
}
