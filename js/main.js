/* ==========================================
   WELLINGTON BOZO - MAIN JAVASCRIPT
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {

    // ========== INIT AOS ANIMATIONS ==========
    AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 80,
    });

    // ========== HERO SLIDER ==========
    const heroSwiper = new Swiper('.hero-slider', {
        loop: true,
        speed: 1000,
        autoplay: {
            delay: 6000,
            disableOnInteraction: false,
        },
        effect: 'fade',
        fadeEffect: {
            crossFade: true,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });

    // ========== STICKY NAVBAR ==========
    const navbar = document.getElementById('navbar');

    function handleScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // ========== MOBILE MENU ==========
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('click', function () {
        this.classList.toggle('active');
        navMenu.classList.toggle('open');
    });

    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('open');
        });
    });

    // Close menu on outside click
    document.addEventListener('click', function (e) {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('open');
        }
    });

    // ========== ACTIVE NAV LINK ON SCROLL ==========
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function setActiveLink() {
        const scrollPos = window.scrollY + 150;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', setActiveLink);

    // ========== COUNTER ANIMATION ==========
    function animateCounters() {
        const counters = document.querySelectorAll('.achievement-number');

        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;

            function updateCounter() {
                current += step;
                if (current < target) {
                    counter.textContent = Math.floor(current).toLocaleString('pt-BR');
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target.toLocaleString('pt-BR') + '+';
                }
            }

            updateCounter();
        });
    }

    // Intersection Observer for counter
    const achievementsSection = document.querySelector('.achievements');
    let counterAnimated = false;

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !counterAnimated) {
                counterAnimated = true;
                animateCounters();
            }
        });
    }, { threshold: 0.3 });

    if (achievementsSection) {
        counterObserver.observe(achievementsSection);
    }

    // ========== BACK TO TOP ==========
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    // ========== CONTACT FORM ==========
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const btn = this.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;

            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            btn.disabled = true;

            const payload = {
                name: this.querySelector('[name="name"]').value,
                email: this.querySelector('[name="email"]').value,
                subject: this.querySelector('[name="subject"]').value,
                message: this.querySelector('[name="message"]').value
            };

            try {
                const response = await fetch('/api/contato', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (!result.success) throw new Error(result.error || 'Erro ao enviar');

                btn.innerHTML = '<i class="fas fa-check"></i> Mensagem Enviada!';
                btn.style.background = '#28a745';
                contactForm.reset();

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 3000);

            } catch (error) {
                console.error('Contact form error:', error);
                btn.innerHTML = '<i class="fas fa-times"></i> Erro ao enviar';
                btn.style.background = '#dc3545';

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 3000);
            }
        });
    }

    // ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

});
