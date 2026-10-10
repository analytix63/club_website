/**
 * ANALYTIX - Data Science & Analytics Club Website Engine
 * Institution: MVJ College of Engineering
 */

function startApp() {
    initParallaxEngine();
    initNavbarScrollSpy();
    initStatsCounter();
    initScrollReveals();
    initLeaderboard();
    initEventFilters();
    initFormValidations();
    initBackToTop();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

/* ==========================================================================
   1. Parallax Scroll Engine (High-Impact Multi-Layered Depth)
   ========================================================================== */

function initParallaxEngine() {
    const parallaxElements = document.querySelectorAll('[data-parallax-speed]');
    const glowOrbs = document.querySelectorAll('.glow-orb');
    const gridOverlays = document.querySelectorAll('.parallax-grid-overlay');
    const parallaxShapes = document.querySelectorAll('.parallax-shape');
    const heroBgLayer = document.querySelector('.hero-bg-layer');

    function updateParallax() {
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - windowHeight;
        const scrollRatio = docHeight > 0 ? scrollY / docHeight : 0;

        // 1. Hero Background Layer Parallax
        if (heroBgLayer && scrollY < windowHeight + 200) {
            const heroOffset = scrollY * 0.45;
            heroBgLayer.style.transform = `translate3d(0, ${heroOffset.toFixed(2)}px, 0)`;
        }

        // 2. Section Foreground Cards & Floating Content
        parallaxElements.forEach(el => {
            const speed = parseFloat(el.getAttribute('data-parallax-speed')) || 0.15;
            const direction = el.getAttribute('data-parallax-direction') === 'down' ? 1 : -1;
            
            const parentSection = el.closest('section') || el.parentElement;
            if (parentSection) {
                const rect = parentSection.getBoundingClientRect();
                if (rect.top < windowHeight + 300 && rect.bottom > -300) {
                    const sectionCenter = rect.top + rect.height / 2;
                    const viewportCenter = windowHeight / 2;
                    const offset = (sectionCenter - viewportCenter) * speed * direction;
                    el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
                }
            } else {
                const offset = scrollY * speed * direction;
                el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
            }
        });

        // 3. Section Background Radial Grid Overlays
        gridOverlays.forEach((grid, idx) => {
            const parentSection = grid.closest('section');
            if (parentSection) {
                const rect = parentSection.getBoundingClientRect();
                if (rect.top < windowHeight + 300 && rect.bottom > -300) {
                    const speed = 0.35 * (idx % 2 === 0 ? 1 : -1);
                    const yPos = (rect.top - windowHeight / 2) * speed;
                    grid.style.transform = `translate3d(0, ${yPos.toFixed(2)}px, 0)`;
                }
            }
        });

        // 4. Section Decorative Background Shapes
        parallaxShapes.forEach((shape, idx) => {
            const parentSection = shape.closest('section');
            if (parentSection) {
                const rect = parentSection.getBoundingClientRect();
                if (rect.top < windowHeight + 300 && rect.bottom > -300) {
                    const baseSpeed = parseFloat(shape.getAttribute('data-parallax-speed')) || 0.4;
                    const speed = baseSpeed * (idx % 2 === 0 ? -1 : 1);
                    const yPos = (rect.top - windowHeight / 2) * speed;
                    shape.style.transform = `translate3d(0, ${yPos.toFixed(2)}px, 0)`;
                }
            }
        });

        // 5. Viewport Ambient Glowing Orbs (Floating 3D Motion)
        glowOrbs.forEach((orb, index) => {
            const speedY = (index + 1) * 250;
            const yPos = (scrollRatio - 0.3) * speedY;
            const xPos = Math.sin(scrollY * 0.0025 + index) * 60;
            orb.style.transform = `translate3d(${xPos.toFixed(2)}px, ${yPos.toFixed(2)}px, 0)`;
        });
    }

    let ticking = false;
    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateParallax();
                ticking = false;
            });
            ticking = true;
        }
    }

    // Trigger initial render immediately
    updateParallax();

    // Attach passive event listeners
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
}

/* ==========================================================================
   2. Navbar Scroll State & ScrollSpy
   ========================================================================== */

function initNavbarScrollSpy() {
    const navbar = document.getElementById('mainNavbar');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        // Toggle sticky background blur
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link highlighting
        let currentSection = '';
        const scrollPos = window.scrollY + 120;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }, { passive: true });
}

/* ==========================================================================
   3. Animated Statistics Counter
   ========================================================================== */

function initStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number');
    let animated = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animated = true;
                statNumbers.forEach(stat => {
                    const target = parseInt(stat.getAttribute('data-target'), 10) || 0;
                    const suffix = stat.getAttribute('data-suffix') || '';
                    let count = 0;
                    const duration = 2000; // ms
                    const stepTime = Math.max(Math.floor(duration / target), 20);

                    const timer = setInterval(() => {
                        count += Math.ceil(target / (duration / stepTime));
                        if (count >= target) {
                            count = target;
                            clearInterval(timer);
                        }
                        stat.textContent = count + suffix;
                    }, stepTime);
                });
            }
        });
    }, { threshold: 0.4 });

    const statsStrip = document.querySelector('.stats-strip');
    if (statsStrip) observer.observe(statsStrip);
}

/* ==========================================================================
   4. Scroll Reveals (IntersectionObserver)
   ========================================================================== */

function initScrollReveals() {
    const reveals = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(el => observer.observe(el));
}

/* ==========================================================================
   5. Interactive Demonstration Leaderboard
   ========================================================================== */

const leaderboardData = [
    { rank: 1, name: "Aarav Sharma", dept: "Technical", points: 420, contributions: "1st Place Hackathon, 4 Workshops" },
    { rank: 2, name: "Ananya Rao", dept: "Design", points: 385, contributions: "Branding Overhaul, 3 Project Submissions" },
    { rank: 3, name: "Rohan Kulkarni", dept: "Technical", points: 350, contributions: "Dataset Challenge Winner, Mentorship" },
    { rank: 4, name: "Sneha Patel", dept: "MOC", points: 310, contributions: "Event Coverage, 2 Workshops Conducted" },
    { rank: 5, name: "Vikram Reddy", dept: "Technical", points: 295, contributions: "SQL Challenge Winner, 2 Projects" },
    { rank: 6, name: "Priya Nair", dept: "Design", points: 270, contributions: "Poster Design Winner, Hackathon Mentoring" },
    { rank: 7, name: "Karthik Verma", dept: "MOC", points: 240, contributions: "Social Media Campaign, Event Lead" }
];

function initLeaderboard() {
    const tableBody = document.getElementById('leaderboardTableBody');
    const deptFilterSelect = document.getElementById('leaderboardFilterDept');
    const sortSelect = document.getElementById('leaderboardSort');

    if (!tableBody) return;

    function renderLeaderboard(data) {
        tableBody.innerHTML = '';
        data.forEach((item) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold text-center">
                    <span class="badge ${item.rank === 1 ? 'bg-warning text-dark' : item.rank === 2 ? 'bg-secondary' : item.rank === 3 ? 'bg-danger' : 'bg-dark'} rounded-circle px-2 py-1">
                        #${item.rank}
                    </span>
                </td>
                <td class="fw-semibold">${item.name}</td>
                <td>
                    <span class="badge-tag ${item.dept === 'Technical' ? '' : item.dept === 'Design' ? 'badge-violet' : 'badge-cyan'}">
                        ${item.dept}
                    </span>
                </td>
                <td class="fw-bold text-primary">${item.points} pts</td>
                <td class="text-muted small">${item.contributions}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function updateView() {
        let filtered = [...leaderboardData];

        // Filter by Dept
        const dept = deptFilterSelect ? deptFilterSelect.value : 'All';
        if (dept !== 'All') {
            filtered = filtered.filter(item => item.dept === dept);
        }

        // Sort by Points
        const sortBy = sortSelect ? sortSelect.value : 'desc';
        if (sortBy === 'desc') {
            filtered.sort((a, b) => b.points - a.points);
        } else if (sortBy === 'asc') {
            filtered.sort((a, b) => a.points - b.points);
        }

        renderLeaderboard(filtered);
    }

    if (deptFilterSelect) deptFilterSelect.addEventListener('change', updateView);
    if (sortSelect) sortSelect.addEventListener('change', updateView);

    renderLeaderboard(leaderboardData);
}

/* ==========================================================================
   6. Events Filterable Module
   ========================================================================== */

function initEventFilters() {
    const filterBtns = document.querySelectorAll('[data-event-filter]');
    const eventCards = document.querySelectorAll('.event-card-col');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-event-filter');

            eventCards.forEach(card => {
                const category = card.getAttribute('data-event-category');
                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/* ==========================================================================
   7. Form Validations & Interactive Toasts/Modals
   ========================================================================== */

function initFormValidations() {
    // Membership Application Form
    const membershipForm = document.getElementById('membershipForm');
    if (membershipForm) {
        membershipForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('memName').value.trim();
            const email = document.getElementById('memEmail').value.trim();
            const year = document.getElementById('memYear').value;
            const dept = document.getElementById('memDept').value;
            const reason = document.getElementById('memReason').value.trim();

            if (!name || !email || !year || !dept || !reason) {
                showToast("Please fill in all required fields.", "warning");
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showToast("Please enter a valid email address.", "danger");
                return;
            }

            // Show success confirmation state
            showSuccessModal(
                "Membership Application Received!",
                `Thank you, <strong>${name}</strong>! Your application for the <strong>${dept} Department</strong> has been logged for review by the ANALYTIX core team.`
            );

            membershipForm.reset();
        });
    }

    // Event Registration Form inside Modal
    const eventRegForm = document.getElementById('eventRegistrationForm');
    if (eventRegForm) {
        eventRegForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const eventName = document.getElementById('modalEventTitle').textContent;
            const name = document.getElementById('eventRegName').value.trim();
            
            if (!name) {
                showToast("Please enter your name.", "warning");
                return;
            }

            // Close modal using bootstrap API
            const modalEl = document.getElementById('eventRegistrationModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();

            showSuccessModal(
                "Registration Confirmed!",
                `You have successfully registered <strong>${name}</strong> for <em>${eventName}</em>. Confirmation details have been sent to your email.`
            );

            eventRegForm.reset();
        });
    }

    // Practical Challenge Submission Form inside Modal
    const challengeForm = document.getElementById('challengeSubmissionForm');
    if (challengeForm) {
        challengeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const repoUrl = document.getElementById('challengeRepoUrl').value.trim();
            
            if (!repoUrl) {
                showToast("Please enter your project repository URL.", "warning");
                return;
            }

            const modalEl = document.getElementById('challengeSubmissionModal');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();

            showSuccessModal(
                "Solution Submitted!",
                `Your challenge submission has been logged successfully! Points will be updated on the leaderboard after peer evaluation.`
            );

            challengeForm.reset();
        });
    }
}

/* Event Modal Trigger Data Injector */
window.openEventRegistrationModal = function(eventTitle) {
    const titleEl = document.getElementById('modalEventTitle');
    if (titleEl) titleEl.textContent = eventTitle;
    const modalEl = new bootstrap.Modal(document.getElementById('eventRegistrationModal'));
    modalEl.show();
};

/* Challenge Modal Trigger Data Injector */
window.openChallengeModal = function(challengeTitle) {
    const titleEl = document.getElementById('modalChallengeTitle');
    if (titleEl) titleEl.textContent = challengeTitle;
    const modalEl = new bootstrap.Modal(document.getElementById('challengeSubmissionModal'));
    modalEl.show();
};

/* Helper Toast Notification */
function showToast(message, type = "info") {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    setTimeout(() => {
        const el = document.getElementById(toastId);
        if (el) el.remove();
    }, 4000);
}

/* Helper Success Modal Display */
function showSuccessModal(title, messageHTML) {
    const modalTitle = document.getElementById('successModalTitle');
    const modalBody = document.getElementById('successModalBody');

    if (modalTitle) modalTitle.textContent = title;
    if (modalBody) modalBody.innerHTML = messageHTML;

    const modalEl = new bootstrap.Modal(document.getElementById('successConfirmationModal'));
    modalEl.show();
}

/* ==========================================================================
   8. Back to Top Button
   ========================================================================== */

function initBackToTop() {
    const backBtn = document.getElementById('backToTopBtn');
    if (!backBtn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            backBtn.classList.add('visible');
        } else {
            backBtn.classList.remove('visible');
        }
    }, { passive: true });

    backBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
