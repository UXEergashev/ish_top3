// Demo Data Generator for TrustID Platform
// This creates sample jobs to demonstrate AI matching, escrow, and other features

function generateDemoData() {
    // Sample Jobs with various attributes
    const demoJobs = [
        {
            id: 'job_' + Date.now() + '_1',
            title: 'Uy qurilish ishchi kerak',
            category: 'Qurilish',
            description: 'Hovli devoriga g\'isht terish, 3 kun davomida. Tajribali ishchilar kerak. Barcha materiallar tayyorlangan.',
            requirements: ['3 yildan ortiq tajriba', 'G\'isht terish ko\'nikmalari', 'O\'z asboblari bilan'],
            salary: 2500000,
            location: 'Toshkent',
            duration: '3 kun',
            employerId: 'demo_employer_1',
            employerName: 'Akmal Usmonov',
            employerRating: 4.8,
            status: 'active',
            escrowRequired: true,
            urgent: false,
            requiredExperience: 3,
            minRating: 0,
            createdAt: new Date().toISOString()
        },
        {
            id: 'job_' + Date.now() + '_2',
            title: 'Elektrik simlar o\'tkazish',
            category: 'Elektrik',
            description: 'Yangi qurilayotgan binoga elektr tarmog\'ini o\'tkazish. Hamma xil elektr ishlari. Kafolatli to\'lov.',
            requirements: ['Elektr sertifikati', '5 yildan ortiq tajriba', 'O\'zbekiston standartlarini bilish'],
            salary: 4000000,
            location: 'Toshkent',
            duration: '1 hafta',
            employerId: 'demo_employer_2',
            employerName: 'Botir Rahimov',
            employerRating: 4.5,
            status: 'active',
            escrowRequired: true,
            urgent: true,
            requiredExperience: 5,
            minRating: 4.0,
            createdAt: new Date().toISOString()
        },
        {
            id: 'job_' + Date.now() + '_3',
            title: 'Bog\' parvarish qilish',
            category: 'Bog\'dorchilik',
            description: 'Katta bog\'da daraxtlarni kesish, maysalarni tozalash, gul ekish. Haftada 3 kun.',
            requirements: ['Bog\'dorchilik tajribasi', 'O\'simliklar parvarishini bilish'],
            salary: 1200000,
            location: 'Samarqand',
            duration: 'Haftada 3 kun',
            employerId: 'demo_employer_3',
            employerName: 'Dilshod Karimov',
            employerRating: 4.2,
            status: 'active',
            escrowRequired: false,
            urgent: false,
            requiredExperience: 1,
            minRating: 0,
            createdAt: new Date().toISOString()
        },
        {
            id: 'job_' + Date.now() + '_4',
            title: 'Plombachilik ishlari',
            category: 'Santexnik',
            description: 'Kvartiraning hamomini ta\'mirlash, yangi quvurlar o\'rnatish, vanna montaj qilish.',
            requirements: ['Santexnik ko\'nikmalari', 'Zamonaviy uskunalar bilan ishlash'],
            salary: 1800000,
            location: 'Buxoro',
            duration: '2 kun',
            employerId: 'demo_employer_4',
            employerName: 'Sardor Aliyev',
            employerRating: 4.6,
            status: 'active',
            escrowRequired: true,
            urgent: false,
            requiredExperience: 2,
            minRating: 0,
            createdAt: new Date().toISOString()
        },
        {
            id: 'job_' + Date.now() + '_5',
            title: 'Mebel yig\'ish ustasi',
            category: 'Duradgorlik',
            description: 'IKEA mebellarini yig\'ish, shkaflar, stol-stullar o\'rnatish. Bir kunlik ish.',
            requirements: ['Mebel yig\'ish tajribasi', 'Ehtiyotkorlik'],
            salary: 800000,
            location: 'Toshkent',
            duration: '1 kun',
            employerId: 'demo_employer_5',
            employerName: 'Jasur Niyazov',
            employerRating: 4.9,
            status: 'active',
            escrowRequired: false,
            urgent: true,
            requiredExperience: 0,
            minRating: 0,
            createdAt: new Date().toISOString()
        },
        {
            id: 'job_' + Date.now() + '_6',
            title: 'Restoranda oshpaz yordamchisi',
            category: 'Oshpazlik',
            description: 'O\'zbek milliy taomlarini tayyorlash bo\'yicha yordamchi kerak. Doimiy ish.',
            requirements: ['Milliy oshxonani bilish', 'Toza ishlash', 'Mas\'uliyatli bo\'lish'],
            salary: 3500000,
            location: 'Farg\'ona',
            duration: 'Doimiy',
            employerId: 'demo_employer_6',
            employerName: 'Sherzod Mahmudov',
            employerRating: 4.7,
            status: 'active',
            escrowRequired: false,
            urgent: false,
            requiredExperience: 2,
            minRating: 4.5,
            createdAt: new Date().toISOString()
        },
        {
            id: 'job_' + Date.now() + '_7',
            title: 'Tomirovka ishlari',
            category: 'Qurilish',
            description: 'Hovli devori va uy tashqi qismini tomirlash. Sifatli materiallar bilan.',
            requirements: ['Tomirlash tajribasi', 'Sifatli ish ko\'nikmalari'],
            salary: 2200000,
            location: 'Andijon',
            duration: '4 kun',
            employerId: 'demo_employer_7',
            employerName: 'Aziz Toshmatov',
            employerRating: 4.4,
            status: 'active',
            escrowRequired: true,
            urgent: false,
            requiredExperience: 3,
            minRating: 0,
            createdAt: new Date().toISOString()
        },
        {
            id: 'job_' + Date.now() + '_8',
            title: 'Konditsioner o\'rnatish',
            category: 'Elektrik',
            description: '3 xonali kvartirada 3 ta konditsioner o\'rnatish va sozlash kerak.',
            requirements: ['Konditsioner o\'rnatish tajribasi', 'Mexanik ko\'nikma', 'Kafolat berish'],
            salary: 1500000,
            location: 'Toshkent',
            duration: '1 kun',
            employerId: 'demo_employer_8',
            employerName: 'Kamol Ismoilov',
            employerRating: 4.3,
            status: 'active',
            escrowRequired: true,
            urgent: true,
            requiredExperience: 2,
            minRating: 0,
            createdAt: new Date().toISOString()
        }
    ];

    // Save jobs to localStorage
    const existingJobs = JSON.parse(localStorage.getItem('trustid_jobs') || '[]');

    // Only add if there are no jobs yet
    if (existingJobs.length === 0) {
        localStorage.setItem('trustid_jobs', JSON.stringify(demoJobs));
        console.log('✅ Demo jobs created:', demoJobs.length);
        return true;
    } else {
        console.log('ℹ️ Jobs already exist, skipping demo data generation');
        return false;
    }
}

// Auto-generate demo data when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only generate on index page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/ish_top/')) {
        const generated = generateDemoData();
        if (generated) {
            console.log('🎉 TrustID demo data initialized!');
        }
    }
});

// Expose function globally for manual trigger
window.generateDemoData = generateDemoData;

// Function to reset all data (for testing)
window.resetTrustIDData = function () {
    if (confirm('Barcha ma\'lumotlarni o\'chirmoqchimisiz? Bu amalni qaytarib bo\'lmaydi!')) {
        localStorage.removeItem('trustid_jobs');
        localStorage.removeItem('trustid_applications');
        localStorage.removeItem('trustid_contracts');
        localStorage.removeItem('trustid_transactions');
        localStorage.removeItem('trustid_reviews');
        localStorage.removeItem('trustid_escrow');
        localStorage.removeItem('trustid_premium');
        console.log('✅ All data cleared!');
        location.reload();
    }
};

// Function to add more jobs (for testing)
window.addMoreDemoJobs = function () {
    const jobs = JSON.parse(localStorage.getItem('trustid_jobs') || '[]');
    const newJobs = generateDemoData();
    if (newJobs) {
        console.log('✅ More demo jobs added!');
        location.reload();
    }
};
