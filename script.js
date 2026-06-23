/* ==========================================================================
   script.js — Kinza Kareem Portfolio
   Custom Cursor Physics · Card Spotlight · Scroll Animations · Mobile Nav
   ========================================================================== */

/* --------------------------------------------------------------------------
   IMAGE FALLBACK (called via onerror on <img>)
   -------------------------------------------------------------------------- */
function handleImageError(img) {
    img.classList.add('hidden');
    const fallback = document.getElementById('fallback-icon');
    if (fallback) fallback.classList.remove('hidden');
}

/* --------------------------------------------------------------------------
   BOOT on DOM ready
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

    /* ======================================================================
       1. CUSTOM CANVAS CURSOR  —  charcoal dot + terracotta telemetry ring
                                    + decaying particle trail
       ====================================================================== */
    const canvas = document.getElementById('cursor-canvas');
    const ctx    = canvas.getContext('2d', { alpha: true });

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;

    window.addEventListener('resize', () => {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width  = W;
        canvas.height = H;
    });

    /* Mouse state */
    const mouse = { x: W / 2, y: H / 2, active: false, vx: 0, vy: 0 };
    let lastX = mouse.x, lastY = mouse.y;

    window.addEventListener('mousemove', e => {
        mouse.vx   = e.clientX - lastX;
        mouse.vy   = e.clientY - lastY;
        lastX      = e.clientX;
        lastY      = e.clientY;
        mouse.x    = e.clientX;
        mouse.y    = e.clientY;
        mouse.active = true;

        /* Emit particle proportional to movement speed */
        const speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
        const count = Math.min(Math.floor(speed * 0.25) + 1, 4);
        for (let i = 0; i < count; i++) particles.push(new Particle(mouse.x, mouse.y));
    });

    document.addEventListener('mouseleave', () => { mouse.active = false; });

    /* ------------------------------------------------------------------
       Particle class
       ------------------------------------------------------------------ */
    const PARTICLE_COLOURS = [
        'rgba(226,149,120,',  /* terracotta base     */
        'rgba(208,132,104,',  /* terracotta darker   */
        'rgba(243,175,150,',  /* terracotta lighter  */
    ];

    class Particle {
        constructor(x, y) {
            this.x     = x + (Math.random() - 0.5) * 4;
            this.y     = y + (Math.random() - 0.5) * 4;
            this.r     = Math.random() * 2.5 + 0.5;
            this.vx    = (Math.random() - 0.5) * 1.4;
            this.vy    = (Math.random() - 0.5) * 1.4 - 0.3; /* slight upward drift */
            this.alpha = 0.85 + Math.random() * 0.15;
            this.decay = 0.018 + Math.random() * 0.018;
            this.colour = PARTICLE_COLOURS[Math.floor(Math.random() * PARTICLE_COLOURS.length)];
        }

        update() {
            this.x     += this.vx;
            this.y     += this.vy;
            this.vy    += 0.012;            /* gentle gravity */
            this.vx    *= 0.97;            /* air resistance */
            this.alpha -= this.decay;
            this.r     *= 0.98;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(this.r, 0.1), 0, Math.PI * 2);
            ctx.fillStyle = this.colour + Math.max(this.alpha, 0) + ')';
            ctx.fill();
        }

        isDead() { return this.alpha <= 0 || this.r < 0.15; }
    }

    let particles = [];

    /* Smooth cursor position with lerp for a fluid feel */
    const rendered = { x: mouse.x, y: mouse.y };
    const LERP = 0.18;

    /* Ring animation state — pulsing outer telemetry loop */
    let ringScale  = 1;
    let ringAlpha  = 0;
    let ringTarget = 0;

    /* ------------------------------------------------------------------
       Main render loop
       ------------------------------------------------------------------ */
    function loop() {
        ctx.clearRect(0, 0, W, H);

        /* Lerp rendered position toward real mouse */
        rendered.x += (mouse.x - rendered.x) * LERP;
        rendered.y += (mouse.y - rendered.y) * LERP;

        /* --- Particles --- */
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].isDead()) particles.splice(i, 1);
        }

        if (mouse.active) {
            /* ---- Outer telemetry ring (glowing terracotta) ---------- */
            ringTarget = 1;
            ringAlpha  += (ringTarget - ringAlpha) * 0.12;
            ringScale  += (1 - ringScale) * 0.14;

            /* Glow halo */
            const grad = ctx.createRadialGradient(
                rendered.x, rendered.y, 8,
                rendered.x, rendered.y, 22
            );
            grad.addColorStop(0, `rgba(226,149,120,${ringAlpha * 0.18})`);
            grad.addColorStop(1, 'rgba(226,149,120,0)');
            ctx.beginPath();
            ctx.arc(rendered.x, rendered.y, 22, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            /* Ring stroke */
            ctx.beginPath();
            ctx.arc(rendered.x, rendered.y, 13 * ringScale, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(226,149,120,${ringAlpha * 0.65})`;
            ctx.lineWidth   = 1.2;
            ctx.stroke();

            /* ---- Core charcoal dot ---------------------------------- */
            ctx.beginPath();
            ctx.arc(rendered.x, rendered.y, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = '#1E2028';
            ctx.fill();

        } else {
            /* Fade out ring when cursor leaves */
            ringAlpha -= 0.04;
            if (ringAlpha < 0) ringAlpha = 0;
        }

        requestAnimationFrame(loop);
    }

    loop();

    /* ======================================================================
       2. CARD SPOTLIGHT  —  CSS vars --mouse-x / --mouse-y updated on move
       ====================================================================== */
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        });
    });

    /* ======================================================================
       3. INTERSECTION OBSERVER  —  scroll-triggered fade-in animations
       ====================================================================== */
    const io = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.fade-in, .fade-in-delay').forEach(el => io.observe(el));

    /* ======================================================================
       4. MOBILE NAV TOGGLE
       ====================================================================== */
    const toggle  = document.getElementById('menu-toggle');
    const mobileNav = document.getElementById('mobile-nav');

    if (toggle && mobileNav) {
        toggle.addEventListener('click', () => {
            const isOpen = mobileNav.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(isOpen));
            mobileNav.setAttribute('aria-hidden', String(!isOpen));
        });

        /* Close nav when a link is clicked */
        mobileNav.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
                mobileNav.setAttribute('aria-hidden', 'true');
            });
        });
    }

    /* ======================================================================
       5. HEADER SCROLL BLEND — subtle border appears on scroll
       ====================================================================== */
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) {
            header.style.backdropFilter = 'blur(0px)';
        } else {
            header.style.backdropFilter = '';
        }
    }, { passive: true });

    /* ======================================================================
       6. SMOOTH ACTIVE NAV HIGHLIGHT on scroll
       ====================================================================== */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav a');

    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(a => {
                    a.style.opacity = a.getAttribute('href') === `#${id}` ? '1' : '0.5';
                });
            }
        });
    }, { threshold: 0.4 });

    sections.forEach(s => sectionObserver.observe(s));

});
