/* =========================================================
   KINZA KAREEM — PORTFOLIO v3
   Premium cursor (magnetic, contextual) · Tilt · Reveal · Nav
   ========================================================= */

(() => {
    'use strict';

    const $  = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const lerp = (a, b, n) => (1 - n) * a + n * b;
    const clamp = (v, mn, mx) => Math.min(Math.max(v, mn), mx);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;

    /* Footer year */
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* Mobile nav */
    const navToggle = $('#navToggle');
    const navLinks  = $('.nav-links');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
        $$('.nav-link').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
    }

    /* =========================================================
       PREMIUM CURSOR
       - Smoothly lerped position
       - Contextual states (link / view / text / down)
       - Magnetic snap on interactive elements
       ========================================================= */
    const cursor      = $('#cursor');
    const cursorLabel = $('#cursorLabel');

    if (cursor && !isTouch) {

        let mouseX = innerWidth / 2;
        let mouseY = innerHeight / 2;
        let curX = mouseX, curY = mouseY;

        // Magnetic target (when hovering a small interactive element)
        let magnetTarget = null;

        addEventListener('mousemove', e => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }, { passive: true });

        addEventListener('mousedown', () => cursor.classList.add('is-down'));
        addEventListener('mouseup',   () => cursor.classList.remove('is-down'));

        // Hide cursor when leaving window, show on return
        document.addEventListener('mouseleave', () => cursor.style.opacity = '0');
        document.addEventListener('mouseenter', () => cursor.style.opacity = '1');

        const tick = () => {
            // If magnet target exists, gently pull toward its center
            if (magnetTarget) {
                const r = magnetTarget.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top  + r.height / 2;
                const dx = mouseX - cx;
                const dy = mouseY - cy;
                // Pull 22% of the way toward center
                const tx = mouseX - dx * 0.22;
                const ty = mouseY - dy * 0.22;
                curX = lerp(curX, tx, 0.22);
                curY = lerp(curY, ty, 0.22);
            } else {
                curX = lerp(curX, mouseX, 0.22);
                curY = lerp(curY, mouseY, 0.22);
            }
            cursor.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
            requestAnimationFrame(tick);
        };
        tick();

        // Contextual hover states via data-cursor attributes
        const setState = (state, label) => {
            cursor.classList.remove('is-link', 'is-view', 'is-text');
            if (state) cursor.classList.add(`is-${state}`);
            if (cursorLabel) cursorLabel.textContent = label || '';
        };

        document.addEventListener('mouseover', e => {
            const t = e.target.closest('[data-cursor]');
            const textT = e.target.closest('p, h1, h2, h3, h4, li, .feature-desc, .about-body, .about-lead, .hero-intro, .hero-intro-sub');
            if (t) {
                const state = t.getAttribute('data-cursor');     // link | view
                const label = t.getAttribute('data-cursor-label') || '';
                setState(state, label);

                // Magnetic for compact links/buttons (not large project cards)
                if (state === 'link' && t.getBoundingClientRect().width < 260) {
                    magnetTarget = t;
                }
            } else if (textT && !e.target.closest('[data-cursor]')) {
                setState('text');
                magnetTarget = null;
            }
        });

        document.addEventListener('mouseout', e => {
            const t = e.target.closest('[data-cursor]');
            const textT = e.target.closest('p, h1, h2, h3, h4, li, .feature-desc, .about-body, .about-lead, .hero-intro, .hero-intro-sub');
            if (t || textT) {
                setState(null, '');
                magnetTarget = null;
            }
        });
    }

    /* ---------- Scroll Reveal ---------- */
    const reveals = $$('.reveal');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(entries => {
            entries.forEach((entry, i) => {
                if (entry.isIntersecting) {
                    setTimeout(() => entry.target.classList.add('in-view'), i * 50);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });
        reveals.forEach(el => io.observe(el));
    } else {
        reveals.forEach(el => el.classList.add('in-view'));
    }

    /* ---------- Subtle 3D tilt + shine on Feature Cards ---------- */
    const cards = $$('[data-tilt]');

    cards.forEach(card => {
        const state = {
            targetRX: 0, targetRY: 0, currentRX: 0, currentRY: 0,
            targetMX: 30, targetMY: 40, currentMX: 30, currentMY: 40,
            raf: null, active: false
        };
        const MAX = 4;

        const animate = () => {
            state.currentRX = lerp(state.currentRX, state.targetRX, 0.1);
            state.currentRY = lerp(state.currentRY, state.targetRY, 0.1);
            state.currentMX = lerp(state.currentMX, state.targetMX, 0.16);
            state.currentMY = lerp(state.currentMY, state.targetMY, 0.16);

            card.style.transform =
                `perspective(1400px) rotateX(${state.currentRX}deg) rotateY(${state.currentRY}deg) translateZ(0)`;
            card.style.setProperty('--mx', `${state.currentMX}%`);
            card.style.setProperty('--my', `${state.currentMY}%`);

            const delta =
                Math.abs(state.targetRX - state.currentRX) +
                Math.abs(state.targetRY - state.currentRY) +
                Math.abs(state.targetMX - state.currentMX) +
                Math.abs(state.targetMY - state.currentMY);

            state.raf = (state.active || delta > 0.05) ? requestAnimationFrame(animate) : null;
        };

        const onMove = e => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top)  / r.height;
            state.targetRY = clamp((px - 0.5) * 2 * MAX, -MAX, MAX);
            state.targetRX = clamp((0.5 - py) * 2 * MAX, -MAX, MAX);
            state.targetMX = px * 100;
            state.targetMY = py * 100;
            if (!state.raf) state.raf = requestAnimationFrame(animate);
        };

        if (!reduced) {
            card.addEventListener('mouseenter', () => {
                state.active = true;
                if (!state.raf) state.raf = requestAnimationFrame(animate);
            });
            card.addEventListener('mousemove', onMove);
            card.addEventListener('mouseleave', () => {
                state.active = false;
                state.targetRX = state.targetRY = 0;
                state.targetMX = 30; state.targetMY = 40;
                if (!state.raf) state.raf = requestAnimationFrame(animate);
            });
        }
    });

    /* ---------- Parallax orbs ---------- */
    const orbs = $$('.bg-orb');
    if (orbs.length && !reduced) {
        let mx = 0, my = 0;
        addEventListener('mousemove', e => {
            mx = (e.clientX / innerWidth  - 0.5) * 2;
            my = (e.clientY / innerHeight - 0.5) * 2;
        }, { passive: true });
        const tick = () => {
            orbs.forEach((orb, i) => {
                const depth = (i + 1) * 22;
                orb.style.translate = `${mx * depth}px ${my * depth}px`;
            });
            requestAnimationFrame(tick);
        };
        tick();
    }

    /* ---------- Floating chip parallax in hero ---------- */
    const chips = $$('.floating-chip');
    if (chips.length && !reduced) {
        let mx = 0, my = 0;
        addEventListener('mousemove', e => {
            mx = (e.clientX / innerWidth  - 0.5) * 2;
            my = (e.clientY / innerHeight - 0.5) * 2;
        }, { passive: true });
        const tick = () => {
            chips.forEach((chip, i) => {
                const depth = 8 + i * 4;
                chip.style.translate = `${mx * depth}px ${my * depth}px`;
            });
            requestAnimationFrame(tick);
        };
        tick();
    }

    /* ---------- Smooth scroll ---------- */
    $$('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const id = a.getAttribute('href');
            if (id.length <= 1) return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    /* ---------- Active nav link ---------- */
    const sections = $$('section[id]');
    const navLinkEls = $$('.nav-link');
    if (sections.length && navLinkEls.length && 'IntersectionObserver' in window) {
        const navIO = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    navLinkEls.forEach(link => {
                        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                    });
                }
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        sections.forEach(s => navIO.observe(s));
    }

})();
