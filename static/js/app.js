// app.js

// Global variables
let currentTheme = 'dark';
let activeSection = 'home';
let currentProfile = null;
let allCourses = [];
let voiceSynthesizer = window.speechSynthesis;
let speechRecognizer = null;
let isListening = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadVFSTRKnowledge();
    checkActiveProfile();
    initPlacementChart();
    initDeptDistributionChart();
});

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('vfstr_theme') || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vfstr_theme', theme);
    
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.innerHTML = theme === 'dark' 
            ? '<i class="fa-solid fa-sun"></i>' 
            : '<i class="fa-solid fa-moon"></i>';
    }
}

function toggleTheme() {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

// --- Dynamic View Routing ---
function switchSection(sectionId) {
    // Hide active section
    const currentActive = document.getElementById(`section-${activeSection}`);
    if (currentActive) {
        currentActive.classList.remove('active-section');
    }
    
    // Show target section
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active-section');
    }
    
    // Update navbar active state
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    activeSection = sectionId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Specific section loaders
    if (sectionId === 'admin') {
        loadAdminAnalytics();
    }
}

// --- Fetch Knowledge Base Data for Frontend View ---
function loadVFSTRKnowledge() {
    // Standard static data fallback matching the JSON database
    allCourses = [
        { id: "btech-cse", degree: "B.Tech", name: "Computer Science and Engineering (CSE)", duration: "4 Years", stream: "Engineering", fee: 380000, eligibility: "60% aggregate in 10+2 with PCM. VSAT / JEE / EAMCET rank.", career: "Software Engineer, Cloud Architect, Data Engineer." },
        { id: "btech-aiml", degree: "B.Tech", name: "Artificial Intelligence & Machine Learning", duration: "4 Years", stream: "Engineering", fee: 380000, eligibility: "60% aggregate in 10+2 with PCM. VSAT / JEE / EAMCET rank.", career: "AI Developer, Data Scientist, ML Engineer." },
        { id: "btech-cyber", degree: "B.Tech", name: "CSE - Cyber Security", duration: "4 Years", stream: "Engineering", fee: 380000, eligibility: "60% aggregate in 10+2 with PCM. VSAT / JEE / EAMCET rank.", career: "Penetration Tester, Security Operations Analyst." },
        { id: "btech-ece", degree: "B.Tech", name: "Electronics and Communication Engineering (ECE)", duration: "4 Years", stream: "Engineering", fee: 300000, eligibility: "60% aggregate in 10+2 with PCM. VSAT / JEE / EAMCET rank.", career: "VLSI Designer, Embedded Systems Engineer." },
        { id: "btech-biotech", degree: "B.Tech", name: "Biotechnology", duration: "4 Years", stream: "Agriculture", fee: 220000, eligibility: "60% aggregate in 10+2 with BiPC or MPC. VSAT / EAPCET.", career: "Bioinformatician, Research Associate, Clinical Scientist." },
        { id: "btech-agri", degree: "B.Tech", name: "Agricultural Engineering", duration: "4 Years", stream: "Agriculture", fee: 220000, eligibility: "60% aggregate in 10+2 with MPC or BiPC. VSAT / EAPCET.", career: "Irrigation Manager, Farm Consultant." },
        { id: "mba", degree: "MBA", name: "Master of Business Administration", duration: "2 Years", stream: "Management", fee: 160000, eligibility: "Graduation with 55%. CAT / MAT / ICET.", career: "Business Consultant, HR Manager, Financial Analyst." },
        { id: "mca", degree: "MCA", name: "Master of Computer Applications", duration: "2 Years", stream: "Management", fee: 120000, eligibility: "Graduation with Maths in class 12. ICET score.", career: "Database Administrator, Software Developer." },
        { id: "bpharmacy", degree: "B.Pharmacy", name: "Bachelor of Pharmacy", duration: "4 Years", stream: "Pharmacy", fee: 180000, eligibility: "60% aggregate in 10+2 with BiPC/MPC. EAPCET rank.", career: "Pharmacist, Drug Inspector, Quality Control Analyst." }
    ];

    renderCourses(allCourses);
    renderScholarshipSlabs();
    renderTimelineAndDocs();
    renderHostelsAndClubs();
}

// --- Courses Grid Rendering ---
function renderCourses(courses) {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (courses.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-secondary py-5">No programs matched your filters.</div>';
        return;
    }
    
    courses.forEach(c => {
        const card = document.createElement('div');
        card.className = 'col-lg-4 col-md-6';
        card.innerHTML = `
            <div class="card glass-card h-100 border-0 rounded-4 overflow-hidden course-card transition-all">
                <div class="card-body p-4 d-flex flex-col justify-content-between">
                    <div>
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="badge bg-indigo-soft text-indigo rounded-pill px-3 py-1 text-xs fw-semibold">${c.degree}</span>
                            <span class="text-indigo fw-bold text-sm">₹${(c.fee/100000).toFixed(2)} Lakh/yr</span>
                        </div>
                        <h5 class="fw-bold text-primary-text mb-3">${c.name}</h5>
                        <p class="text-secondary text-xs mb-2"><strong>Duration:</strong> ${c.duration}</p>
                        <p class="text-secondary text-xs mb-2"><strong>Eligibility:</strong> ${c.eligibility}</p>
                        <p class="text-secondary text-xs mb-0"><strong>Careers:</strong> ${c.career}</p>
                    </div>
                    <div class="mt-4 pt-2 border-top border-glass d-flex gap-2">
                        <button class="btn btn-indigo btn-sm flex-grow-1 rounded-pill" onclick="applyCourse('${c.name}')">Apply Now</button>
                        <button class="btn btn-glass btn-sm rounded-circle" onclick="askAboutCourse('${c.name}')" title="Ask Rama Lakshmi"><i class="fa-solid fa-robot"></i></button>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filterCourses() {
    const q = document.getElementById('courseSearch').value.toLowerCase();
    const filtered = allCourses.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.degree.toLowerCase().includes(q) ||
        c.career.toLowerCase().includes(q)
    );
    renderCourses(filtered);
}

function filterCourseCategory(stream, btn) {
    // Toggle active btn state
    document.querySelectorAll('#section-courses .btn-glass').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if (stream === 'all') {
        renderCourses(allCourses);
        return;
    }
    
    const filtered = allCourses.filter(c => c.stream === stream);
    renderCourses(filtered);
}

function applyCourse(courseName) {
    showToast(`Navigating to application portal for ${courseName}. Enrollment is currently active!`);
    switchSection('profile');
    document.getElementById('profPrefCourse').value = courseName;
}

function askAboutCourse(courseName) {
    switchSection('chat');
    sendQuickQuery(`What is the fee and placements scope for B.Tech ${courseName}?`);
}

// --- Timeline & Document Renderers ---
function renderTimelineAndDocs() {
    const timelineData = [
        { title: "Application Phase Start", date: "January 15, 2026", desc: "Online application portal opens for V-SAT 2026." },
        { title: "Application Closing Date", date: "February 25, 2026", desc: "Last date to submit applications online or offline." },
        { title: "V-SAT 2026 Exam Window", date: "March 1 – April 15, 2026", desc: "Computer-based test slots across Guntur, GSPC and other centers." },
        { title: "Result & Ranks", date: "April 30, 2026", desc: "VSAT rank list published on the official admission portal." },
        { title: "Counselling Slots", date: "May 10 – June 5, 2026", desc: "Merit-based counselling at Vadlamudi campus." }
    ];
    
    const docs = [
        "10th Class (SSC) Marksheet & Certificate",
        "12th Class (Intermediate) Marksheet",
        "Transfer Certificate (TC) & Conduct Certificate",
        "Study & Bonafide Certificate (Class 6 to 12)",
        "Entrance Exam Rank Card (V-SAT / JEE / EAMCET)",
        "Aadhar Card copy",
        "Caste Certificate (if claiming reservation/scholarship)",
        "4 Passport size photographs"
    ];
    
    const tContainer = document.getElementById('timelineList');
    const dContainer = document.getElementById('documentsList');
    
    if (tContainer) {
        tContainer.innerHTML = timelineData.map(t => `
            <div class="timeline-item">
                <h6 class="fw-bold mb-1 text-primary-text">${t.title} <span class="badge bg-indigo-soft text-indigo text-xs ms-2">${t.date}</span></h6>
                <p class="text-secondary text-sm mb-0">${t.desc}</p>
            </div>
        `).join('');
    }
    
    if (dContainer) {
        dContainer.innerHTML = docs.map(d => `
            <li class="mb-2 d-flex align-items-center"><i class="fa-solid fa-circle-check text-success me-2"></i> ${d}</li>
        `).join('');
    }
}

// --- Hostel & Campus Life Renderers ---
function renderHostelsAndClubs() {
    const amenities = [
        { icon: "fa-shield-halved", text: "24/7 Security & CCTV" },
        { icon: "fa-wifi", text: "High-Speed Wi-Fi everywhere" },
        { icon: "fa-utensils", text: "Hygienic Mess (Veg & Non-Veg)" },
        { icon: "fa-shirt", text: "Daily Laundry included" },
        { icon: "fa-dumbbell", text: "Modern Gym Facility" },
        { icon: "fa-truck-medical", text: "24/7 Medical & Ambulance" },
        { icon: "fa-basketball", text: "Sports Courts" }
    ];
    
    const rules = [
        "In-time for hostels is 8:30 PM.",
        "Outings allowed only on Sundays with warden digital approval.",
        "Heaters and high-power appliances are forbidden in rooms."
    ];
    
    const clubs = [
        { name: "Vignan Coding Club", desc: "Weekly hackathons, programming practice, and project labs." },
        { name: "Inspiria (Cultural Club)", desc: "Annual singing, theatrical arts, and dancing." },
        { name: "Literary Seminars Club", desc: "Debating, public speaking training, and essay publication." },
        { name: "E-Cell (Entrepreneurship)", desc: "Startup incubator spaces, project funding, and incubation guidelines." }
    ];
    
    const fests = [
        { name: "Mahotsav", type: "National Youth Festival", desc: "Annual 3-day mega fest bringing over 20,000 students from all over India." },
        { name: "Srujanankura", type: "National Tech Fest", desc: "Project exhibitions, code sprints, and robotic combat events." }
    ];
    
    const infra = [
        "Central Library with 100,000+ volumes and digital subscriptions.",
        "Air-conditioned Seminar Halls and open-air theatres.",
        "Fully equipped Laboratories and incubation center rooms.",
        "Comprehensive Sports Complex with synthetic athletics track."
    ];
    
    const aContainer = document.getElementById('hostelAmenities');
    const rContainer = document.getElementById('hostelRules');
    const cContainer = document.getElementById('campusClubs');
    const fContainer = document.getElementById('campusFestivals');
    const iContainer = document.getElementById('campusInfrastructure');
    
    if (aContainer) {
        aContainer.innerHTML = amenities.map(a => `
            <div class="col-6 col-md-4">
                <div class="d-flex align-items-center p-2 border border-glass rounded-3 text-secondary text-sm">
                    <i class="fa-solid ${a.icon} text-indigo me-2 fs-5"></i> ${a.text}
                </div>
            </div>
        `).join('');
    }
    if (rContainer) {
        rContainer.innerHTML = rules.map(r => `<li class="mb-2 d-flex align-items-start"><i class="fa-solid fa-triangle-exclamation text-warning me-2 mt-1"></i> ${r}</li>`).join('');
    }
    if (cContainer) {
        cContainer.innerHTML = clubs.map(c => `
            <div class="col-md-6">
                <div class="card glass-card p-3 border-0 rounded-4">
                    <h6 class="fw-bold text-primary-text mb-2"><i class="fa-solid fa-people-group text-indigo me-2"></i> ${c.name}</h6>
                    <p class="text-secondary text-sm mb-0">${c.desc}</p>
                </div>
            </div>
        `).join('');
    }
    if (fContainer) {
        fContainer.innerHTML = fests.map(f => `
            <div class="mb-3 pb-3 border-bottom border-glass">
                <h6 class="fw-bold text-primary-text mb-1">${f.name} <small class="text-indigo text-xs">(${f.type})</small></h6>
                <p class="text-secondary text-sm mb-0">${f.desc}</p>
            </div>
        `).join('');
    }
    if (iContainer) {
        iContainer.innerHTML = infra.map(i => `<li class="mb-2"><i class="fa-solid fa-city text-indigo me-2"></i> ${i}</li>`).join('');
    }
}

// --- Scholarship Slabs Renderers ---
function renderScholarshipSlabs() {
    const slabs = [
        { slab: "100% Waiver", vsat: "Rank 1-100", jee: ">98 percentile", eapcet: "<2000", inter: ">98%" },
        { slab: "50% Waiver", vsat: "Rank 101-500", jee: "95-98 percentile", eapcet: "2001-5000", inter: "95-97.9%" },
        { slab: "25% Waiver", vsat: "Rank 501-2000", jee: "90-95 percentile", eapcet: "5001-15000", inter: "90-94.9%" },
        { slab: "10% Waiver", vsat: "Rank 2001-5000", jee: "85-90 percentile", eapcet: "15001-25000", inter: "85-89.9%" }
    ];
    
    const body = document.getElementById('scholarshipTableBody');
    if (body) {
        body.innerHTML = slabs.map(s => `
            <tr class="border-bottom border-glass text-secondary">
                <td class="fw-bold text-indigo">${s.slab}</td>
                <td>${s.vsat}</td>
                <td>${s.jee}</td>
                <td>${s.eapcet}</td>
                <td>${s.inter}</td>
            </tr>
        `).join('');
    }
}

// --- Scholarship Calculator ---
function calculateScholarship(event) {
    event.preventDefault();
    const exam = document.getElementById('schExam').value;
    const score = parseFloat(document.getElementById('schScore').value);
    const resultBox = document.getElementById('estimateResult');
    
    if (isNaN(score)) return;
    
    let waiver = 0;
    let message = "";
    
    if (exam === 'V-SAT') {
        if (score <= 100) { waiver = 100; }
        else if (score <= 500) { waiver = 50; }
        else if (score <= 2000) { waiver = 25; }
        else if (score <= 5000) { waiver = 10; }
    } else if (exam === 'JEE Main') {
        if (score >= 98) { waiver = 100; }
        else if (score >= 95) { waiver = 50; }
        else if (score >= 90) { waiver = 25; }
        else if (score >= 85) { waiver = 10; }
    } else if (exam === 'EAPCET') {
        if (score <= 2000) { waiver = 100; }
        else if (score <= 5000) { waiver = 50; }
        else if (score <= 15000) { waiver = 25; }
        else if (score <= 25000) { waiver = 10; }
    } else if (exam === 'Intermediate') {
        if (score >= 98) { waiver = 100; }
        else if (score >= 95) { waiver = 50; }
        else if (score >= 90) { waiver = 25; }
        else if (score >= 85) { waiver = 10; }
    }
    
    resultBox.classList.remove('d-none');
    
    if (waiver > 0) {
        resultBox.className = "estimate-result-card mt-4 p-3 rounded-4 bg-success-soft text-success border border-success";
        resultBox.innerHTML = `
            <h6 class="fw-bold mb-1"><i class="fa-solid fa-circle-check"></i> Eligible for ${waiver}% Scholarship!</h6>
            <p class="text-xs mb-0">Based on your ${exam} score of ${score}, you qualify for a ${waiver}% waiver on annual tuition fees.</p>
        `;
    } else {
        resultBox.className = "estimate-result-card mt-4 p-3 rounded-4 bg-warning-soft text-warning border border-warning";
        resultBox.innerHTML = `
            <h6 class="fw-bold mb-1"><i class="fa-solid fa-circle-info"></i> Standard Tuition Fee Applies</h6>
            <p class="text-xs mb-0">No direct scholarship matched. Try qualifying under higher rankings in V-SAT or reach out for Sports/NCC quotas.</p>
        `;
    }
}

// --- Chat Service Management ---
function sendQuickQuery(query) {
    const input = document.getElementById('queryInput');
    input.value = query;
    document.getElementById('chatForm').dispatchEvent(new Event('submit'));
}

async function submitChat(event) {
    event.preventDefault();
    const input = document.getElementById('queryInput');
    const query = input.value.trim();
    if (!query) return;
    
    // Add user message
    appendMessage('user', query);
    input.value = '';
    
    // Scroll to bottom
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.scrollTop = chatWindow.scrollHeight;
    
    // Show typing indicator
    const indicator = document.getElementById('typingIndicator');
    indicator.classList.remove('d-none');
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: query })
        });
        const data = await response.json();
        
        // Hide typing indicator
        indicator.classList.add('d-none');
        
        if (data.response) {
            appendMessage('bot', data.response);
            // Update connection label
            const connLbl = document.getElementById('connectionStatus');
            if (data.is_live_watsonx) {
                connLbl.innerHTML = '<i class="fa-solid fa-plug-circle-check text-success me-1"></i> Live IBM watsonx.ai (Granite)';
            } else {
                connLbl.innerHTML = '<i class="fa-solid fa-plug-circle-exclamation text-warning me-1"></i> Local DB & IBM Granite (Simulated)';
            }
        } else {
            appendMessage('bot', 'Sorry, I encountered an error communicating with the backend. Please check connection.');
        }
    } catch (err) {
        indicator.classList.add('d-none');
        appendMessage('bot', 'Offline or Server connection failed. Please ensure the Flask app.py is active.');
    }
    
    // Scroll to bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendMessage(role, text) {
    const chatWindow = document.getElementById('chatWindow');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const messageNode = document.createElement('div');
    messageNode.className = `chat-message ${role}-message d-flex mb-4`;
    
    const avatar = role === 'user' ? '👤' : '🤖';
    
    // Marked parsing for markdown support
    let parsedText = text;
    try {
        parsedText = marked.parse(text);
    } catch (e) {
        console.warn("Marked failed to parse. Outputting raw text.");
    }
    
    // Add dynamic bookmark button only to bot bubbles
    const bookmarkBtn = role === 'bot' && currentProfile
        ? `<button class="btn-bookmark ms-2" onclick="toggleSaveBookmark(this, \`${text.replace(/`/g, '\\`').replace(/"/g, '&quot;')}\`)" title="Bookmark Response"><i class="fa-regular fa-bookmark"></i></button>`
        : '';

    messageNode.innerHTML = `
        <div class="message-avatar me-3">${avatar}</div>
        <div class="message-content-wrapper">
            <div class="message-bubble">
                <div class="markdown-body">${parsedText}</div>
            </div>
            <div class="d-flex align-items-center justify-content-between mt-1">
                <span class="message-time">${timeStr}</span>
                <div class="d-flex gap-1 align-items-center">
                    ${bookmarkBtn}
                    ${role === 'bot' ? `<button class="btn btn-xs text-secondary border-0 p-0" onclick="readAloud(this, \`${text.replace(/"/g, '&quot;').replace(/\n/g, ' ')}\`)" title="Read Aloud"><i class="fa-solid fa-volume-high"></i></button>` : ''}
                </div>
            </div>
        </div>
    `;
    
    chatWindow.appendChild(messageNode);
}

async function clearChatHistory() {
    try {
        await fetch('/api/chat/clear', { method: 'POST' });
        const chatWindow = document.getElementById('chatWindow');
        chatWindow.innerHTML = `
            <div class="chat-message bot-message d-flex mb-4">
                <div class="message-avatar me-3">🤖</div>
                <div class="message-content-wrapper">
                    <div class="message-bubble">
                        <p class="mb-0">Session cleared. hello i am Rama lakshmi your virtual admission assistant for Vignan's Foundation for Science, Technology & Research (VFSTR). I can guide you through our courses, fee structure, scholarships, hostel facilities, placement records, and the step-by-step admission process. How can I help you today?</p>
                    </div>
                </div>
            </div>
        `;
        showToast("Chat history wiped.");
    } catch (e) {
        showToast("Failed to clear session.");
    }
}

function exportChat() {
    window.location.href = '/api/chat/export';
}

// --- Text-to-Speech & Speech-to-Text Speech Services ---
function readAloud(btn, text) {
    if (!voiceSynthesizer) return;
    
    if (voiceSynthesizer.speaking) {
        voiceSynthesizer.cancel();
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        return;
    }
    
    // Speech synthesis config
    const cleanText = text.replace(/[^a-zA-Z0-9\s,.\(\)]/g, ''); // strip markdown chars
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    };
    
    btn.innerHTML = '<i class="fa-solid fa-volume-xmark text-danger"></i>';
    voiceSynthesizer.speak(utterance);
}

function toggleSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast("Speech Recognition API is not supported in this browser. Please use Chrome/Edge.");
        return;
    }
    
    const mic = document.getElementById('micBtn');
    
    if (isListening) {
        speechRecognizer.stop();
        return;
    }
    
    speechRecognizer = new SpeechRecognition();
    speechRecognizer.continuous = false;
    speechRecognizer.interimResults = false;
    speechRecognizer.lang = 'en-US';
    
    speechRecognizer.onstart = () => {
        isListening = true;
        mic.classList.add('text-danger');
        mic.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
        showToast("Listening... Speak now.");
    };
    
    speechRecognizer.onresult = (event) => {
        const text = event.results[0][0].transcript;
        document.getElementById('queryInput').value = text;
        showToast("Voice transcript completed!");
    };
    
    speechRecognizer.onerror = () => {
        showToast("Speech registration error or timed out.");
        stopListeningState();
    };
    
    speechRecognizer.onend = () => {
        stopListeningState();
    };
    
    speechRecognizer.start();
}

function stopListeningState() {
    isListening = false;
    const mic = document.getElementById('micBtn');
    mic.classList.remove('text-danger');
    mic.innerHTML = '<i class="fa-solid fa-microphone"></i>';
}

// --- Student Profile and Session Sync ---
async function checkActiveProfile() {
    try {
        const response = await fetch('/api/profile');
        const data = await response.json();
        
        if (data.profile) {
            currentProfile = data.profile;
            fillProfileUI(data.profile);
        } else {
            document.getElementById('logoutSection').classList.add('d-none');
        }
    } catch (e) {
        console.warn("Failed to check active profile status.");
    }
}

function fillProfileUI(profile) {
    document.getElementById('profName').value = profile.name;
    document.getElementById('profEmail').value = profile.email;
    document.getElementById('profPhone').value = profile.phone || '';
    document.getElementById('profEducation').value = profile.education || 'MPC';
    document.getElementById('profMarks').value = profile.marks || '';
    document.getElementById('profPrefCourse').value = profile.preferred_course || '';
    document.getElementById('profCareerGoal').value = profile.career_goal || '';
    
    document.getElementById('profileFormTitle').innerHTML = '<i class="fa-solid fa-user-check me-2 text-indigo"></i> Sync Student Profile';
    document.getElementById('logoutSection').classList.remove('d-none');
    
    // Load lists
    renderBookmarks(profile.bookmarks);
    renderSearchHistory(profile.recent_searches);
    
    // Evaluate eligibility checklist
    runAutoEligibility(profile);
}

async function saveProfile(event) {
    event.preventDefault();
    const payload = {
        name: document.getElementById('profName').value,
        email: document.getElementById('profEmail').value,
        phone: document.getElementById('profPhone').value,
        education: document.getElementById('profEducation').value,
        marks: parseFloat(document.getElementById('profMarks').value) || 0,
        preferred_course: document.getElementById('profPrefCourse').value,
        career_goal: document.getElementById('profCareerGoal').value
    };
    
    try {
        const response = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        
        if (data.profile) {
            currentProfile = data.profile;
            fillProfileUI(data.profile);
            showToast("Student profile sync complete!");
            
            // Reload page or views to show sync status on chatbot
            loadAdminAnalytics(); // If admin tab is open
        } else {
            showToast(data.error || "Profile validation error.");
        }
    } catch (err) {
        showToast("Error updating database profile.");
    }
}

async function logoutProfile() {
    try {
        await fetch('/api/profile/logout', { method: 'POST' });
        currentProfile = null;
        
        document.getElementById('profileForm').reset();
        document.getElementById('profileFormTitle').innerHTML = '<i class="fa-solid fa-user-pen me-2 text-indigo"></i> Create Student Profile';
        document.getElementById('logoutSection').classList.add('d-none');
        document.getElementById('eligibilityResultCard').classList.add('d-none');
        document.getElementById('bookmarksContainer').innerHTML = '<div class="text-sm text-secondary py-2 text-center">Sign in to save bookmarks.</div>';
        document.getElementById('searchHistoryContainer').innerHTML = '';
        
        showToast("Logged out successfully.");
    } catch (e) {
        showToast("Error logging out.");
    }
}

async function runAutoEligibility(profile) {
    const card = document.getElementById('eligibilityResultCard');
    const container = document.getElementById('eligibilityList');
    
    if (!container || !card) return;
    
    try {
        const response = await fetch('/api/eligibility', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                stream: profile.education,
                marks_12th: profile.marks,
                exam: "None",
                rank: 999999,
                interest: profile.preferred_course || ''
            })
        });
        const data = await response.json();
        
        card.classList.remove('d-none');
        
        if (data.eligible && data.programs.length > 0) {
            container.innerHTML = `
                <div class="alert alert-success bg-success-soft border-0 text-success text-xs mb-3">
                    ✔ Class 12 score qualifies for Admissions!
                </div>
                <h6 class="fw-bold mb-2">Recommended Programs matching profile:</h6>
                <div class="list-group list-group-flush mb-3">
                    ${data.programs.map(p => `
                        <div class="list-group-item bg-transparent border-glass py-2 px-0">
                            <div class="d-flex justify-content-between">
                                <strong class="text-primary-text text-xs">${p.name}</strong>
                                <span class="badge bg-indigo-soft text-indigo text-xs">${p.fee}</span>
                            </div>
                            <p class="text-xs text-secondary mb-0 mt-1">Scope: ${p.career.substring(0, 70)}...</p>
                        </div>
                    `).join('')}
                </div>
                <div class="text-xs text-secondary">
                    ${data.suggestions.map(s => `<p class="mb-1"><i class="fa-solid fa-circle-info text-indigo"></i> ${s}</p>`).join('')}
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="alert alert-danger bg-danger-soft border-0 text-danger text-xs mb-3">
                    ${data.suggestions[0] || 'Score does not qualify.'}
                </div>
            `;
        }
    } catch (e) {
        card.classList.add('d-none');
    }
}

// --- Bookmark Q&A Handling ---
async function toggleSaveBookmark(btn, answerText) {
    if (!currentProfile) {
        showToast("Please save your Student Profile first to bookmark responses.");
        return;
    }
    
    // Guess query text by scanning preceding message bubble in DOM
    const wrapper = btn.closest('.chat-message');
    let queryText = "VFSTR Info Query";
    // Look for preceding message
    const previous = wrapper.previousElementSibling;
    if (previous && previous.classList.contains('user-message')) {
        queryText = previous.querySelector('.message-bubble').innerText;
    }
    
    const icon = btn.querySelector('i');
    const isSaved = icon.classList.contains('fa-solid');
    
    try {
        if (!isSaved) {
            // Bookmark Q&A
            const res = await fetch('/api/bookmarks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: queryText, response: answerText })
            });
            if (res.ok) {
                icon.className = 'fa-solid fa-bookmark';
                btn.classList.add('bookmarked');
                showToast("Response bookmarked successfully.");
                checkActiveProfile(); // Refresh bookmarks card
            }
        } else {
            // Remove Bookmark
            const res = await fetch('/api/bookmarks', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: queryText })
            });
            if (res.ok) {
                icon.className = 'fa-regular fa-bookmark';
                btn.classList.remove('bookmarked');
                showToast("Bookmark removed.");
                checkActiveProfile(); // Refresh bookmarks card
            }
        }
    } catch (e) {
        showToast("Database synchronization error.");
    }
}

function renderBookmarks(bookmarks) {
    const container = document.getElementById('bookmarksContainer');
    if (!container) return;
    
    if (!bookmarks || bookmarks.length === 0) {
        container.innerHTML = '<div class="text-sm text-secondary py-3 text-center">No bookmarks saved yet.</div>';
        return;
    }
    
    container.innerHTML = bookmarks.map(bm => `
        <div class="list-group-item bg-transparent border-glass py-3 px-0">
            <h6 class="fw-bold text-xs text-primary-text mb-1"><i class="fa-solid fa-circle-question text-indigo me-1"></i> ${bm.query}</h6>
            <p class="text-xs text-secondary mb-2">${bm.response.substring(0, 150)}...</p>
            <div class="d-flex justify-content-between align-items-center">
                <span class="text-xs text-secondary-text text-xs">${bm.timestamp}</span>
                <button class="btn btn-sm btn-outline-danger py-0 px-2 text-xs rounded-pill" onclick="deleteBookmarkDirect(\`${bm.query.replace(/'/g, "\\'")}\`)">Delete</button>
            </div>
        </div>
    `).join('');
}

async function deleteBookmarkDirect(queryText) {
    try {
        const res = await fetch('/api/bookmarks', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: queryText })
        });
        if (res.ok) {
            showToast("Bookmark removed.");
            checkActiveProfile();
        }
    } catch (e) {
        showToast("Failed to remove bookmark.");
    }
}

function renderSearchHistory(history) {
    const container = document.getElementById('searchHistoryContainer');
    if (!container) return;
    
    if (!history || history.length === 0) {
        container.innerHTML = '<span class="text-xs text-secondary">No queries recorded.</span>';
        return;
    }
    
    container.innerHTML = history.map(h => `
        <span class="badge bg-indigo-soft text-indigo text-xs py-1 px-2 rounded-3 cursor-pointer" onclick="sendQuickQuery('${h}')">
            <i class="fa-solid fa-clock-rotate-left me-1"></i> ${h}
        </span>
    `).join('');
}

// --- Chart.js Renderers ---
function initPlacementChart() {
    const canvas = document.getElementById('placementChart');
    if (!canvas) return;
    
    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['2021', '2022', '2023', '2024', '2025'],
            datasets: [
                {
                    label: 'Highest Salary (LPA)',
                    data: [18.0, 21.0, 44.0, 36.0, 44.0],
                    backgroundColor: 'rgba(124, 58, 237, 0.75)',
                    borderColor: '#7c3aed',
                    borderWidth: 1
                },
                {
                    label: 'Average Salary (LPA)',
                    data: [4.8, 5.0, 5.2, 5.5, 5.5],
                    backgroundColor: 'rgba(6, 182, 212, 0.75)',
                    borderColor: '#06b6d4',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            },
            scales: {
                y: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
}

function initDeptDistributionChart() {
    const canvas = document.getElementById('deptDistributionChart');
    if (!canvas) return;
    
    new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['CSE & IT', 'ECE & VLSI', 'Biotechnology', 'Agricultural Eng', 'MBA & MCA', 'Pharmacy & PhD'],
            datasets: [{
                data: [40, 20, 12, 10, 10, 8],
                backgroundColor: [
                    '#4f46e5',
                    '#7c3aed',
                    '#06b6d4',
                    '#10b981',
                    '#f59e0b',
                    '#ec4899'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { size: 10 } }
                }
            }
        }
    });
}

// --- Admin Controls Dashboard Loading ---
async function loadAdminAnalytics() {
    try {
        const response = await fetch('/api/admin/analytics');
        const stats = await response.json();
        
        document.getElementById('adminTotalChats').innerText = stats.total_chats;
        document.getElementById('adminTotalStudents').innerText = stats.total_students;
        document.getElementById('adminTotalFaqs').innerText = stats.total_faqs;
        
        // Load Logs Table
        const body = document.getElementById('adminLogsTableBody');
        if (body) {
            body.innerHTML = stats.recent_chats.map(log => `
                <tr class="border-bottom border-glass text-secondary">
                    <td class="text-xs">${log.timestamp.substring(11, 16)}</td>
                    <td class="text-xs text-primary-text fw-semibold">${log.user_query}</td>
                    <td class="text-xs">${log.bot_response.substring(0, 110)}...</td>
                </tr>
            `).join('');
        }
        
        // Load FAQ list
        loadAdminFaqList();
        
    } catch (e) {
        console.warn("Failed to load admin stats.");
    }
}

async function loadAdminFaqList() {
    const list = document.getElementById('adminFaqList');
    if (!list) return;
    
    try {
        const response = await fetch('/api/admin/faq');
        const data = await response.json();
        
        list.innerHTML = data.faqs.map(f => `
            <div class="list-group-item bg-transparent border-glass py-2 px-0 d-flex justify-content-between align-items-start">
                <div>
                    <strong class="text-primary-text text-xs">${f.question}</strong>
                    <p class="mb-0 text-xs text-secondary">${f.answer}</p>
                </div>
                <button class="btn btn-sm btn-outline-danger py-0 px-2 text-xs rounded-pill" onclick="deleteFaq(${f.id})">Remove</button>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = '<div class="text-xs text-danger text-center">Error reading database FAQs.</div>';
    }
}

async function addFaq(event) {
    event.preventDefault();
    const q = document.getElementById('faqQuest').value;
    const a = document.getElementById('faqAnsw').value;
    const c = document.getElementById('faqCate').value;
    
    try {
        const response = await fetch('/api/admin/faq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q, answer: a, category: c })
        });
        const data = await response.json();
        
        if (response.ok) {
            showToast("Custom FAQ rule added to RAG Database!");
            document.getElementById('addFaqForm').reset();
            loadAdminAnalytics();
        } else {
            showToast(data.error || "Failed to add FAQ.");
        }
    } catch (e) {
        showToast("Error adding FAQ.");
    }
}

async function deleteFaq(faqId) {
    try {
        const response = await fetch(`/api/admin/faq/${faqId}`, { method: 'DELETE' });
        if (response.ok) {
            showToast("FAQ rule removed.");
            loadAdminAnalytics();
        }
    } catch (e) {
        showToast("Error deleting FAQ.");
    }
}

// --- Toast notification utility ---
function showToast(message) {
    const toastMessage = document.getElementById('toastMessage');
    const toastElement = document.getElementById('liveToast');
    if (toastMessage && toastElement) {
        toastMessage.innerText = message;
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
    }
}
