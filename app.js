/* ==========================================================================
   FASHION DOG - app.js
   --------------------------------------------------------------------------
   Estructura
   1. Utilidades y configuración (número de WhatsApp en un solo lugar)
   2. Módulos sin dependencias: WhatsApp, menú, FAQ, formulario, guía de tallas,
      vista ampliada (FLIP con Web Animations API) y partículas doradas (canvas)
   3. Capa de movimiento (GSAP + ScrollTrigger + Lenis): carga, hero, cinta,
      manifiesto, escena Nocturna, colecciones apiladas, lookbook horizontal,
      atelier, proceso, cierre y pie
   4. Arranque con degradación: sin librerías o con "reducir movimiento" la
      página queda completa y usable, sin animaciones avanzadas.
   ========================================================================== */
(() => {
    'use strict';

    /* ---------- 1. Utilidades y configuración ---------- */
    const WA_NUMBER = '527712316129'; // +52 771 231 6129
    const waUrl = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const root = document.documentElement;
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const EASE = 'cubic-bezier(.16, 1, .3, 1)';

    let lenis = null; // se crea solo en modo movimiento

    const lockScroll = () => { if (lenis) lenis.stop(); else root.style.overflow = 'hidden'; };
    const unlockScroll = () => { if (lenis) lenis.start(); else root.style.overflow = ''; };

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    /* ---------- 2. Módulos sin dependencias ---------- */

    /* WhatsApp: cada CTA con data-wa abre el chat con un mensaje pensado para ese contexto */
    function initWhatsApp() {
        $$('[data-wa]').forEach((a) => { a.href = waUrl(a.dataset.wa); });
    }

    function initYear() {
        const y = $('#year');
        if (y) y.textContent = new Date().getFullYear();
    }

    /* Menú móvil */
    let setMenu = () => {};
    function initMenu() {
        const burger = $('#burger');
        const menu = $('#menu');
        if (!burger || !menu) return;
        $$('.menu__link', menu).forEach((a, i) => a.style.setProperty('--i', i));

        setMenu = (open) => {
            burger.setAttribute('aria-expanded', String(open));
            burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
            menu.classList.toggle('is-open', open);
            menu.setAttribute('aria-hidden', String(!open));
            open ? lockScroll() : unlockScroll();
        };
        burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
        menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
        });
        window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => {
            if (e.matches && menu.classList.contains('is-open')) setMenu(false);
        });
    }

    /* Enlaces internos con scroll suave (Lenis) o nativo */
    function initAnchors() {
        const CARD_IDS = ['coll-nocturna', 'coll-invierno', 'coll-fiesta'];
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a[href^="#"]');
            if (!a) return;
            const id = a.getAttribute('href');
            if (id.length < 2) return;
            const target = document.getElementById(id.slice(1));
            if (!target) return;
            e.preventDefault();

            let y = null;
            const cardIdx = CARD_IDS.indexOf(id.slice(1));
            const stack = $('#stack');
            if (cardIdx > -1 && stack && window.matchMedia('(min-width: 960px)').matches) {
                // las tarjetas apiladas son "sticky": se calcula su posición natural
                const cards = $$('.coll', stack);
                const base = stack.getBoundingClientRect().top + (lenis ? lenis.scroll : window.scrollY);
                y = base + cardIdx * cards[0].offsetHeight;
            }
            if (lenis) {
                lenis.scrollTo(y !== null ? y : target, { duration: 1.7, easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)) });
            } else if (y !== null) {
                window.scrollTo({ top: y, behavior: mqReduce.matches ? 'auto' : 'smooth' });
            } else {
                target.scrollIntoView({ behavior: mqReduce.matches ? 'auto' : 'smooth' });
            }
            history.pushState(null, '', id);
        });
    }

    /* Preguntas frecuentes (acordeón accesible) */
    function initFaq() {
        const items = $$('.faq-item');
        const setOpen = (item, open) => {
            item.classList.toggle('is-open', open);
            $('.faq-q', item).setAttribute('aria-expanded', String(open));
        };
        items.forEach((item) => {
            $('.faq-q', item).addEventListener('click', () => {
                const open = !item.classList.contains('is-open');
                items.forEach((o) => { if (o !== item) setOpen(o, false); });
                setOpen(item, open);
                if (window.ScrollTrigger) setTimeout(() => window.ScrollTrigger.refresh(), 750);
            });
        });
        if (items[0]) setOpen(items[0], true);
    }

    /* Formulario: valida y abre WhatsApp con el mensaje armado */
    function initForm() {
        const form = $('#form');
        if (!form) return;
        const status = $('#form-status');
        const submit = $('.form__submit', form);
        const label = $('span', submit);
        const labelText = label.textContent;
        const f = { name: $('#f-name'), pet: $('#f-pet'), size: $('#f-size'), coll: $('#f-coll'), msg: $('#f-msg') };

        const setError = (field, errId, message) => {
            $('#' + errId).textContent = message;
            field.setAttribute('aria-invalid', message ? 'true' : 'false');
        };
        f.name.addEventListener('input', () => setError(f.name, 'e-name', ''));
        f.size.addEventListener('change', () => setError(f.size, 'e-size', ''));

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = f.name.value.trim();
            let firstInvalid = null;

            if (name.length < 2) { setError(f.name, 'e-name', 'Cuéntanos tu nombre para saludarte bien.'); firstInvalid = firstInvalid || f.name; }
            if (!f.size.value) { setError(f.size, 'e-size', 'Elige la raza o talla de tu peludo.'); firstInvalid = firstInvalid || f.size; }
            if (firstInvalid) {
                status.className = 'form__status';
                status.textContent = '';
                firstInvalid.focus();
                return;
            }

            const pet = f.pet.value.trim();
            const extra = f.msg.value.trim();
            const parts = [
                `Hola Fashion Dog, soy ${name}.`,
                pet ? `Busco ropa para mi peludo ${pet}.` : 'Busco ropa para mi peludo.',
                `Raza o talla: ${f.size.value}.`,
                `Me interesa: ${f.coll.value}.`,
            ];
            if (extra) parts.push(extra);
            const url = waUrl(parts.join(' '));

            submit.classList.add('is-sending');
            label.textContent = 'Abriendo WhatsApp...';
            status.className = 'form__status is-ok';
            status.innerHTML = `Listo, abrimos WhatsApp con tu mensaje. Si no se abrió, <a href="${url}" target="_blank" rel="noopener">haz clic aquí</a>.`;
            window.open(url, '_blank', 'noopener');
            setTimeout(() => { submit.classList.remove('is-sending'); label.textContent = labelText; }, 2600);
        });
    }

    /* Guía de tallas interactiva (referencias de la guía oficial de la marca) */
    function initSizer() {
        const app = $('#sizer');
        if (!app) return;
        const buttons = $$('.breed', app);
        const dog = $('#sizer-dog');
        const ruler = $('#sizer-ruler');
        const nEl = $('#sizer-n');
        const textEl = $('#sizer-text');
        const cta = $('#sizer-cta');
        const ctaLabel = $('#sizer-cta-label');

        const DATA = {
            '1': { text: 'Ideal para razas muy pequeñas como el Chihuahua.', k: 0.46 },
            '2': { text: 'Pensada para razas pequeñas como el Yorkshire.', k: 0.58 },
            '3': { text: 'Para perros chicos de pelo largo como el Shih Tzu.', k: 0.7 },
            '4': { text: 'Para poodles y razas pequeñas de complexión media.', k: 0.84 },
            '5': { text: 'Para schnauzers miniatura y razas pequeñas más robustas.', k: 1 },
            L: { text: 'Nuestra colección de invierno llega a 13 tallas, de la 0 a la 12. Mide el largo del lomo y el contorno del pecho de tu perro y te decimos cuál le queda.', k: 1.28 },
        };

        let mode = null;
        const buildRuler = (m) => {
            if (mode === m) return;
            mode = m;
            ruler.innerHTML = '';
            const labels = m === 'L' ? Array.from({ length: 13 }, (_, i) => i) : [1, 2, 3, 4, 5];
            ruler.style.setProperty('--n', labels.length);
            labels.forEach((l) => {
                const s = document.createElement('span');
                s.className = 'ruler__tick';
                s.textContent = l;
                ruler.appendChild(s);
            });
            const marker = document.createElement('span');
            marker.className = 'ruler__marker';
            ruler.appendChild(marker);
        };

        const select = (btn, animate = true) => {
            const size = btn.dataset.size;
            const isL = size === 'L';
            const data = DATA[size];

            buttons.forEach((b) => {
                const on = b === btn;
                b.setAttribute('aria-checked', String(on));
                b.tabIndex = on ? 0 : -1;
            });

            buildRuler(isL ? 'L' : 'S');
            ruler.style.setProperty('--span', isL ? 13 : 1);
            ruler.style.setProperty('--idx', isL ? 0 : Number(size) - 1);
            $$('.ruler__tick', ruler).forEach((t, i) => t.classList.toggle('is-on', isL || i === Number(size) - 1));
            dog.style.setProperty('--k', data.k);

            nEl.textContent = isL ? '0 a 12' : size;
            nEl.classList.toggle('is-range', isL);
            textEl.textContent = data.text;
            ctaLabel.textContent = isL ? 'Quiero mi talla ideal' : `Quiero la talla ${size}`;
            cta.href = waUrl(isL
                ? 'Hola Fashion Dog, mi perro es de raza grande y necesito ayuda con la talla (0 a 12). ¿Qué diseños tienen disponibles?'
                : `Hola Fashion Dog, mi peludo es ${btn.dataset.breed} y quiero la talla ${size}. ¿Qué diseños tienen disponibles?`);

            if (animate && !mqReduce.matches && nEl.animate) {
                [nEl, textEl].forEach((el) => el.animate(
                    [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
                    { duration: 650, easing: EASE }
                ));
            }
        };

        buttons.forEach((b, i) => {
            b.addEventListener('click', () => select(b));
            b.addEventListener('keydown', (e) => {
                const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
                if (!(e.key in keys)) return;
                e.preventDefault();
                const next = buttons[(i + keys[e.key] + buttons.length) % buttons.length];
                next.focus();
                select(next);
            });
        });
        select(buttons.find((b) => b.getAttribute('aria-checked') === 'true') || buttons[0], false);
    }

    /* Vista ampliada del lookbook: la imagen "viaja" desde su miniatura (FLIP) */
    function initLightbox() {
        const lb = $('#lightbox');
        const cards = $$('.look-card');
        if (!lb || !cards.length) return;

        const img = $('#lb-img');
        const titleEl = $('#lb-title');
        const collEl = $('#lb-coll');
        const cta = $('#lb-cta');
        const btnClose = $('.lb-close', lb);
        const btnPrev = $('.lb-prev', lb);
        const btnNext = $('.lb-next', lb);

        let idx = 0;
        let isOpen = false;
        let busy = false;
        let lastFocus = null;

        const fill = (i) => {
            const c = cards[i];
            idx = i;
            img.alt = c.dataset.alt;
            img.width = Number(c.dataset.w);
            img.height = Number(c.dataset.h);
            titleEl.textContent = c.dataset.title;
            collEl.textContent = c.dataset.collection;
            cta.href = waUrl(`Hola Fashion Dog, quiero este diseño: ${c.dataset.title} (${c.dataset.collection}). ¿Qué tallas tienen disponibles?`);
            return c.dataset.full;
        };
        const decode = async () => { try { await img.decode(); } catch (e) { /* imagen en caché o sin soporte */ } };
        const box = (i) => cards[i].querySelector('.look-card__img').getBoundingClientRect();

        async function open(i) {
            if (isOpen) return;
            isOpen = true;
            lastFocus = document.activeElement;
            const from = box(i);
            img.src = fill(i);
            await decode();
            lb.classList.add('is-open');
            lb.setAttribute('aria-hidden', 'false');
            lockScroll();

            const to = img.getBoundingClientRect();
            if (!mqReduce.matches && img.animate && to.width && from.width) {
                img.animate([
                    { transformOrigin: '0 0', transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})` },
                    { transformOrigin: '0 0', transform: 'translate(0, 0) scale(1, 1)' },
                ], { duration: 850, easing: EASE });
            } else if (img.animate) {
                img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 });
            }
            btnClose.focus({ preventScroll: true });
        }

        function close() {
            if (!isOpen) return;
            isOpen = false;
            const a = img.getBoundingClientRect();
            const b = box(idx);
            const visible = b.bottom > 0 && b.top < window.innerHeight && b.right > 0 && b.left < window.innerWidth;
            lb.classList.remove('is-open');
            lb.setAttribute('aria-hidden', 'true');
            if (!mqReduce.matches && img.animate && visible && a.width) {
                const anim = img.animate([
                    { transformOrigin: '0 0', transform: 'translate(0, 0) scale(1, 1)' },
                    { transformOrigin: '0 0', transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width}, ${b.height / a.height})` },
                ], { duration: 650, easing: EASE, fill: 'forwards' });
                anim.onfinish = () => anim.cancel();
            }
            unlockScroll();
            if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
        }

        async function go(dir) {
            if (busy || !isOpen) return;
            busy = true;
            const next = (idx + dir + cards.length) % cards.length;
            if (img.animate && !mqReduce.matches) {
                const out = img.animate([
                    { opacity: 1, transform: 'none' },
                    { opacity: 0, transform: `translateX(${-dir * 48}px)` },
                ], { duration: 240, easing: 'ease-in', fill: 'forwards' });
                await out.finished.catch(() => {});
                img.src = fill(next);
                await decode();
                out.cancel();
                const inn = img.animate([
                    { opacity: 0, transform: `translateX(${dir * 48}px)` },
                    { opacity: 1, transform: 'none' },
                ], { duration: 560, easing: EASE });
                await inn.finished.catch(() => {});
            } else {
                img.src = fill(next);
                await decode();
            }
            busy = false;
        }

        cards.forEach((c, i) => c.addEventListener('click', () => open(i)));
        lb.addEventListener('click', (e) => { if (e.target.closest('[data-lb-close]')) close(); });
        btnPrev.addEventListener('click', () => go(-1));
        btnNext.addEventListener('click', () => go(1));

        document.addEventListener('keydown', (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowRight') go(1);
            else if (e.key === 'ArrowLeft') go(-1);
            else if (e.key === 'Tab') { // trampa de foco
                const f = [btnClose, btnPrev, btnNext, cta];
                const i = f.indexOf(document.activeElement);
                e.preventDefault();
                f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
            }
        });

        // gesto de deslizar en móvil
        let startX = null;
        const fig = $('.lightbox__figure', lb);
        fig.addEventListener('pointerdown', (e) => { startX = e.clientX; });
        fig.addEventListener('pointerup', (e) => {
            if (startX === null) return;
            const dx = e.clientX - startX;
            startX = null;
            if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
        });
    }

    /* Partículas doradas (polvo, destellos y huellitas) en canvas */
    const DUST_COLORS = ['#f3d98f', '#e4be66', '#cf9d3d', '#fbeec4'];
    class Dust {
        constructor(canvas, opts = {}) {
            this.c = canvas;
            this.ctx = canvas.getContext('2d');
            this.opts = Object.assign({ density: 15000, max: 90, paws: true, speed: 1, still: false }, opts);
            this.p = [];
            this.ptr = { x: -9999, y: -9999 };
            this.running = false;
            this.inView = false;
            this.last = 0;
            this.frame = this.frame.bind(this);

            this.resize();
            window.addEventListener('resize', () => this.resize(), { passive: true });
            window.addEventListener('pointermove', (e) => {
                const r = this.c.getBoundingClientRect();
                this.ptr.x = e.clientX - r.left;
                this.ptr.y = e.clientY - r.top;
            }, { passive: true });

            if (this.opts.still) { this.draw(0); return; }
            new IntersectionObserver(([en]) => {
                this.inView = en.isIntersecting;
                this.inView ? this.start() : this.stop();
            }, { threshold: 0 }).observe(canvas);
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) this.stop(); else if (this.inView) this.start();
            });
        }
        resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.w = this.c.clientWidth;
            this.h = this.c.clientHeight;
            this.c.width = Math.round(this.w * dpr);
            this.c.height = Math.round(this.h * dpr);
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const count = clamp(Math.round((this.w * this.h) / this.opts.density), 16, this.opts.max);
            while (this.p.length < count) this.p.push(this.spawn(true));
            this.p.length = count;
            if (this.opts.still) this.draw(0);
        }
        spawn(initial) {
            const t = Math.random();
            const type = t < 0.07 && this.opts.paws ? 'paw' : t < 0.3 ? 'spark' : 'dot';
            const bx = Math.random() * this.w;
            return {
                type, bx, x: bx,
                y: initial ? Math.random() * this.h : this.h + 20,
                r: type === 'dot' ? 0.6 + Math.random() * 1.7 : 3 + Math.random() * 4.5,
                vy: (8 + Math.random() * 22) * this.opts.speed,
                sway: 6 + Math.random() * 18,
                ph: Math.random() * 6.28,
                ps: 0.4 + Math.random() * 0.8,
                a: type === 'paw' ? 0.16 + Math.random() * 0.2 : 0.25 + Math.random() * 0.6,
                tw: 1 + Math.random() * 2.4,
                rot: Math.random() * 6.28,
                col: DUST_COLORS[(Math.random() * DUST_COLORS.length) | 0],
            };
        }
        start() { if (this.running) return; this.running = true; this.last = performance.now(); requestAnimationFrame(this.frame); }
        stop() { this.running = false; }
        frame(now) {
            if (!this.running) return;
            const dt = Math.min((now - this.last) / 1000, 0.05);
            this.last = now;
            this.draw(dt, now / 1000);
            requestAnimationFrame(this.frame);
        }
        draw(dt, t = 0) {
            const { ctx, w, h } = this;
            ctx.clearRect(0, 0, w, h);
            for (const p of this.p) {
                if (dt) {
                    p.y -= p.vy * dt;
                    p.ph += p.ps * dt;
                    p.rot += dt * 0.4;
                    // el cursor aparta suavemente las partículas cercanas
                    const dx = p.x - this.ptr.x;
                    const dy = p.y - this.ptr.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < 19600) {
                        const d = Math.sqrt(d2) || 1;
                        const push = (1 - d / 140) * 90 * dt;
                        p.bx += (dx / d) * push;
                        p.y += (dy / d) * push;
                    }
                    p.x = p.bx + Math.sin(p.ph) * p.sway;
                    if (p.y < -24) Object.assign(p, this.spawn(false));
                }
                const tw = 0.62 + 0.38 * Math.sin(t * p.tw + p.ph);
                ctx.globalAlpha = p.a * tw;
                ctx.fillStyle = p.col;
                if (p.type === 'dot') {
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
                    if (p.r > 1.5) { ctx.globalAlpha *= 0.18; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, 6.283); ctx.fill(); }
                } else if (p.type === 'spark') {
                    this.star(p.x, p.y, p.r, p.rot);
                } else {
                    this.paw(p.x, p.y, p.r * 1.6, p.rot * 0.3);
                }
            }
            ctx.globalAlpha = 1;
        }
        star(x, y, r, rot) {
            const ctx = this.ctx;
            ctx.save(); ctx.translate(x, y); ctx.rotate(rot * 0.25);
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const a = (i * Math.PI) / 4;
                const rr = i % 2 === 0 ? r : r * 0.22;
                ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
            ctx.closePath(); ctx.fill(); ctx.restore();
        }
        paw(x, y, r, rot) {
            const ctx = this.ctx;
            ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
            ctx.beginPath(); ctx.ellipse(0, r * 0.35, r * 0.62, r * 0.5, 0, 0, 6.283); ctx.fill();
            [[-0.62, -0.18], [-0.22, -0.62], [0.22, -0.62], [0.62, -0.18]].forEach(([dx, dy]) => {
                ctx.beginPath(); ctx.ellipse(dx * r, dy * r, r * 0.2, r * 0.27, 0, 0, 6.283); ctx.fill();
            });
            ctx.restore();
        }
    }

    /* ---------- 3. Capa de movimiento (GSAP + ScrollTrigger + Lenis) ---------- */
    const reveal = (targets, vars = {}, trigger) => {
        const els = typeof targets === 'string' ? $$(targets) : targets;
        if (!els.length) return;
        gsap.from(els, Object.assign({
            y: 46, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09,
            scrollTrigger: { trigger: trigger || els[0], start: 'top 86%', once: true },
        }, vars));
    };

    /* Carga: anillo de progreso + contador. Termina cuando la página y las fuentes están listas */
    function runLoader(onExit) {
        const loader = $('#loader');
        const counter = $('#loader-count');
        const ring = $('#loader-progress');
        const state = { p: 0 };
        const render = () => {
            counter.textContent = Math.round(state.p);
            ring.style.strokeDashoffset = String(100 - state.p);
        };

        const pageReady = document.readyState === 'complete'
            ? Promise.resolve()
            : new Promise((res) => window.addEventListener('load', res, { once: true }));
        const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        const ready = Promise.race([Promise.all([pageReady, fontsReady]), new Promise((res) => setTimeout(res, 6000))]);

        const exit = () => {
            $('.loader__medal').style.animation = 'none';
            const tl = gsap.timeline({
                onComplete: () => { loader.style.display = 'none'; loader.setAttribute('aria-hidden', 'true'); },
            });
            tl.to('.loader__count, .loader__label', { opacity: 0, y: -12, duration: 0.45, ease: 'power2.in' })
                .to('.loader__orbit', { scale: 1.3, opacity: 0, duration: 0.8, ease: 'power3.in', transformOrigin: '50% 50%' }, '<')
                .to('.loader__medal', { scale: 1.1, duration: 0.5, ease: 'power2.out' }, '<')
                .to('.loader__medal', { scale: 0.2, opacity: 0, duration: 0.55, ease: 'power3.in' }, '>-0.05')
                .to('.loader__panel--l', { xPercent: -101, duration: 1.15, ease: 'expo.inOut' }, '>-0.1')
                .to('.loader__panel--r', { xPercent: 101, duration: 1.15, ease: 'expo.inOut' }, '<')
                .add(onExit, '>-0.7');
        };

        gsap.to(state, {
            p: 90, duration: 2.2, ease: 'power2.out', onUpdate: render,
            onComplete: () => ready.then(() => gsap.to(state, { p: 100, duration: 0.6, ease: 'power1.inOut', onUpdate: render, onComplete: exit })),
        });
    }

    /* Hero: entrada orquestada (se arma antes de que termine la carga) */
    function buildHero() {
        gsap.set('.hero__title .line__in', { yPercent: 118 });
        gsap.set('.hero [data-hero]', { y: 28, opacity: 0 });
        gsap.set('.hcard', { y: 170, opacity: 0, scale: 0.86 });
        gsap.set('.stage__ring', { scale: 0.7, opacity: 0 });
        gsap.set('.seal', { scale: 0, rotate: -120 });
        gsap.set('.brand, .nav a, .header-cta, .burger', { y: -20, opacity: 0 });

        const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
        tl.to('.hero__title .line__in', { yPercent: 0, duration: 1.6, stagger: 0.14 }, 0)
            .to('.hero [data-hero]', { y: 0, opacity: 1, duration: 1.2, stagger: 0.13 }, 0.25)
            .to('.stage__ring', { scale: 1, opacity: 1, duration: 2, stagger: 0.2 }, 0.1)
            .to('.hcard', { y: 0, opacity: 1, scale: 1, duration: 1.7, stagger: { each: 0.15, from: 'end' } }, 0.15)
            .to('.seal', { scale: 1, rotate: 0, duration: 1.4, ease: 'back.out(1.5)' }, 1)
            .to('.brand, .nav a, .header-cta, .burger', { y: 0, opacity: 1, duration: 1, stagger: 0.06, ease: 'power3.out' }, 0.4);
        return tl;
    }

    /* Hero: parallax con el cursor + salida al hacer scroll */
    function initHeroMotion() {
        const hero = $('.hero');
        const stage = $('#stage');

        if (mqFine.matches) {
            const cards = [['.hcard--l', 18], ['.hcard--c', 32], ['.hcard--r', 24]].map(([sel, depth]) => {
                const el = $(sel, stage);
                return {
                    depth,
                    x: gsap.quickTo(el, 'x', { duration: 1.3, ease: 'power3.out' }),
                    y: gsap.quickTo(el, 'y', { duration: 1.3, ease: 'power3.out' }),
                };
            });
            const move = (mx, my) => {
                stage.style.setProperty('--mx', mx.toFixed(3));
                stage.style.setProperty('--my', my.toFixed(3));
                cards.forEach((c) => { c.x(-mx * c.depth); c.y(-my * c.depth); });
            };
            hero.addEventListener('pointermove', (e) => {
                const r = hero.getBoundingClientRect();
                move(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
            });
            hero.addEventListener('pointerleave', () => move(0, 0));
        }

        const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
        gsap.to('.hero__copy', { yPercent: -12, opacity: 0.15, ease: 'none', scrollTrigger: st });
        gsap.to('.hero__stage', { yPercent: -9, ease: 'none', scrollTrigger: st });
    }

    /* Cinta: velocidad y sesgo reaccionan a la velocidad del scroll */
    function initTicker() {
        const track = $('#ticker');
        if (!track) return;
        track.classList.add('is-js');
        const setX = gsap.quickSetter(track, 'x', 'px');
        const setSkew = gsap.quickSetter(track, 'skewX', 'deg');
        let x = 0, skew = 0, dir = 1, active = true;
        new IntersectionObserver(([en]) => { active = en.isIntersecting; }).observe(track.parentElement);

        gsap.ticker.add((time, dt) => {
            if (!active) return;
            const v = lenis ? lenis.velocity : 0;
            dir += ((v < -0.4 ? -1 : 1) - dir) * 0.08;
            x -= dir * (56 + Math.abs(v) * 22) * (dt / 1000);
            const half = track.scrollWidth / 2;
            if (x <= -half) x += half;
            if (x > 0) x -= half;
            setX(x);
            skew += (clamp(v * -0.55, -9, 9) - skew) * 0.12;
            setSkew(skew);
        });
    }

    /* Manifiesto: cada palabra se ilumina con el scroll */
    function initManifesto() {
        const el = $('#manifesto-text');
        if (!el) return;
        const words = [];
        Array.from(el.childNodes).forEach((n) => {
            if (n.nodeType === 3) {
                n.textContent.split(/(\s+)/).forEach((tok) => {
                    if (!tok) return;
                    if (/^\s+$/.test(tok)) { el.insertBefore(document.createTextNode(' '), n); return; }
                    const s = document.createElement('span');
                    s.className = 'w';
                    s.textContent = tok;
                    el.insertBefore(s, n);
                    words.push(s);
                });
                n.remove();
            } else {
                n.classList.add('w');
                words.push(n);
            }
        });
        const chips = words.filter((w) => w.classList.contains('chip'));
        gsap.set(words, { opacity: 0.13 });
        gsap.set(chips, { scale: 0.55 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: 0.7 } });
        tl.to(words, { opacity: 1, stagger: 0.16, duration: 0.5, ease: 'none' })
            .to(chips, { scale: 1, stagger: 0.5, duration: 1, ease: 'power2.out' }, 0.2);
    }

    /* Escena Nocturna: la imagen se abre a pantalla completa mientras el título se arma */
    function initExpand(mm) {
        mm.add({ desk: '(min-width: 900px)', mob: '(max-width: 899px)' }, (ctx) => {
            const desk = ctx.conditions.desk;
            const sec = $('.expand');
            const pin = $('.expand__pin');
            const media = $('#expand-media');
            const img = $('img', media);
            const wl = $('.expand__w--l');
            const wr = $('.expand__w--r');
            const kids = $$('#expand-copy > *');
            if (!sec) return;

            // El recorte se anima con valores numéricos (el navegador simplifica inset() y rompe la interpolación)
            const clip = desk ? { t: 24, r: 33, b: 24, l: 33, rad: 22 } : { t: 21, r: 13, b: 27, l: 13, rad: 22 };
            const applyClip = () => { media.style.clipPath = `inset(${clip.t}% ${clip.r}% ${clip.b}% ${clip.l}% round ${clip.rad}px)`; };
            applyClip();
            gsap.set(img, { scale: 1.5 });
            gsap.set(wl, desk ? { x: '-12vw' } : { y: '-27vh' });
            gsap.set(wr, desk ? { x: '12vw' } : { y: '38vh' });
            gsap.set(kids, { y: 44, opacity: 0 });

            const tl = gsap.timeline({
                defaults: { ease: 'none' },
                scrollTrigger: { trigger: sec, start: 'top top', end: '+=240%', scrub: 0.8, pin, anticipatePin: 1 },
            });
            tl.to(clip, { t: 0, r: 0, b: 0, l: 0, rad: 0, duration: 1, onUpdate: applyClip }, 0)
                .to(img, { scale: 1, duration: 1 }, 0)
                .to([wl, wr], { x: 0, y: 0, duration: 1, ease: 'power2.inOut' }, 0)
                .to([wl, wr], { opacity: 0, y: -46, duration: 0.3, ease: 'power2.in' }, 1.15) // el título se disuelve y deja ver al perrito
                .to(kids, { y: 0, opacity: 1, stagger: 0.14, duration: 0.45, ease: 'power2.out' }, 1.2)
                .to({}, { duration: 0.4 });

            return () => { media.style.clipPath = ''; gsap.set([img, wl, wr, ...kids], { clearProps: 'all' }); };
        });
    }

    /* Colecciones: tarjetas apiladas (escritorio) o aparición simple (móvil) */
    function initCollections(mm) {
        mm.add('(min-width: 960px)', () => {
            const cards = $$('.coll');
            cards.forEach((card, i) => {
                const panel = $('.coll__panel', card);
                if (i < cards.length - 1) {
                    gsap.to(panel, {
                        scale: 0.9, opacity: 0.32, ease: 'none',
                        scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top top', scrub: true },
                    });
                }
                gsap.from($$('.coll__copy > *', card), {
                    y: 46, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1,
                    scrollTrigger: { trigger: panel, start: 'top 72%', toggleActions: 'play none none reverse' },
                });
                $$('.shot', card).forEach((shot, k) => {
                    gsap.fromTo(shot, { y: 70 + k * 26 }, {
                        y: -36 - k * 14, ease: 'none',
                        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
                    });
                });
            });
        });
        mm.add('(max-width: 959px)', () => {
            $$('.coll__panel').forEach((panel) => {
                gsap.from(panel, { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: panel, start: 'top 88%', once: true } });
            });
        });
    }

    /* Lookbook: el scroll vertical desplaza la galería en horizontal (escritorio) */
    function initLookbook(mm) {
        mm.add('(min-width: 900px)', () => {
            const pin = $('.look__pin');
            const track = $('#look-track');
            if (!pin || !track) return;
            pin.classList.add('is-pinned');
            const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);

            const tween = gsap.to(track, {
                x: () => -dist(), ease: 'none',
                scrollTrigger: {
                    trigger: pin, start: 'top top', end: () => '+=' + Math.round(dist() * 0.62),
                    pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
                },
            });
            $$('.look-card__img img', track).forEach((im) => {
                gsap.fromTo(im, { xPercent: -2.5 }, {
                    xPercent: 2.5, ease: 'none',
                    scrollTrigger: { trigger: im.closest('.look__item'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
                });
            });
            return () => { pin.classList.remove('is-pinned'); gsap.set(track, { clearProps: 'all' }); };
        });
    }

    /* Atelier, guía de tallas, FAQ, contacto y pie: apariciones con el scroll */
    function initSections() {
        reveal('.collections__head > *');
        reveal('.atelier .h2, .atelier__lead', { stagger: 0.12 });
        reveal('.bcell', { y: 70, stagger: 0.12 }, '.bento');
        $$('.bcell__img').forEach((im) => {
            gsap.from(im, { yPercent: -6, ease: 'none', scrollTrigger: { trigger: im.closest('.bcell'), start: 'top bottom', end: 'bottom top', scrub: true } });
        });
        $$('[data-spot]').forEach((cell) => {
            cell.addEventListener('pointermove', (e) => {
                const r = cell.getBoundingClientRect();
                cell.style.setProperty('--sx', `${e.clientX - r.left}px`);
                cell.style.setProperty('--sy', `${e.clientY - r.top}px`);
            });
        });

        reveal('.sizer__head > *');
        reveal('.sizer__choices .breed', { y: 24, stagger: 0.06 }, '.sizer__choices');
        reveal('.sizer__panel', { y: 60 });

        reveal('.faq__wrap .h2');
        reveal('.faq-item', { y: 30, stagger: 0.08 }, '.faq__list');

        reveal('.finale__title, .finale__lead', { stagger: 0.14 });
        gsap.from('.finale__btn', { scale: 0.7, opacity: 0, duration: 1.4, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.finale__btn', start: 'top 90%', once: true } });

        reveal('.contact__info > *', { stagger: 0.1 });
        reveal('.ccard', { x: -30, y: 0, stagger: 0.1 }, '.contact__cards');
        reveal('.form', { y: 60 });

        reveal('.footer__top > *', { y: 30 });
        gsap.from('.footer__word', { yPercent: 38, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer__word', start: 'top 108%', end: 'top 72%', scrub: true } });
    }

    /* Proceso: la línea dorada se dibuja y cada paso se enciende al llegar */
    function initProcess() {
        const steps = $('#steps');
        if (!steps) return;
        const fill = document.createElement('span');
        fill.className = 'steps__fill';
        fill.setAttribute('aria-hidden', 'true');
        steps.prepend(fill);
        gsap.set(fill, { scaleY: 0 });
        gsap.to(fill, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: steps, start: 'top 62%', end: 'bottom 72%', scrub: true } });

        $$('.step', steps).forEach((s) => {
            gsap.from($$('h3, p', s), { y: 44, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: s, start: 'top 82%', once: true } });
            ScrollTrigger.create({
                trigger: s, start: 'top 64%',
                onEnter: () => s.classList.add('is-on'),
                onLeaveBack: () => s.classList.remove('is-on'),
            });
        });
    }

    /* Botones magnéticos (solo con puntero fino) */
    function initMagnetic() {
        if (!mqFine.matches) return;
        $$('.magnetic').forEach((el) => {
            const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
            const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                qx((e.clientX - (r.left + r.width / 2)) * 0.28);
                qy((e.clientY - (r.top + r.height / 2)) * 0.36);
            });
            el.addEventListener('pointerleave', () => { qx(0); qy(0); });
        });
    }

    /* Cabecera: se oculta al bajar, reaparece al subir; barra de progreso; enlace activo */
    function initHeader() {
        const header = $('#header');
        const menu = $('#menu');
        const setProg = gsap.quickSetter($('#progress'), 'scaleX');
        ScrollTrigger.create({
            start: 0, end: 'max',
            onUpdate: (self) => {
                setProg(self.progress);
                const hide = self.direction === 1 && self.scroll() > 260 && !(menu && menu.classList.contains('is-open'));
                header.classList.toggle('is-hidden', hide);
            },
        });
        $$('[data-nav]').forEach((link) => {
            const target = document.getElementById(link.dataset.nav);
            if (!target) return;
            ScrollTrigger.create({
                trigger: target, start: 'top 50%', end: 'bottom 50%',
                onToggle: (self) => link.classList.toggle('is-active', self.isActive),
            });
        });
    }

    function showFloat() {
        const wa = $('#wa-float');
        if (!wa) return;
        setTimeout(() => wa.classList.add('is-visible'), 600);
        setTimeout(() => wa.classList.add('show-tip'), 3600);
        setTimeout(() => wa.classList.remove('show-tip'), 9500);
    }

    function initMotion() {
        gsap.registerPlugin(ScrollTrigger);
        ScrollTrigger.config({ ignoreMobileResize: true });
        root.classList.add('has-motion');

        if (window.Lenis) {
            lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((t) => lenis.raf(t * 1000));
            gsap.ticker.lagSmoothing(0);
            lenis.stop(); // se libera cuando termina la carga
        } else {
            root.style.overflow = 'hidden';
        }
        window.scrollTo(0, 0);

        const mm = gsap.matchMedia();
        const heroIntro = buildHero();
        initHeroMotion();
        initTicker();
        initManifesto();
        initExpand(mm);
        initCollections(mm);
        initLookbook(mm);
        initSections();
        initProcess();
        initHeader();
        initMagnetic();

        const heroDust = $('#dust-hero');
        const finaleDust = $('#dust-finale');
        if (heroDust) new Dust(heroDust, { density: 14000, max: 95 });
        if (finaleDust) new Dust(finaleDust, { density: 16000, max: 70, speed: 0.8 });

        runLoader(() => {
            unlockScroll();
            heroIntro.play();
            showFloat();
        });

        // las alturas cambian al cargar imágenes y fuentes
        window.addEventListener('load', () => ScrollTrigger.refresh());
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    }

    /* ---------- 4. Arranque ---------- */
    function initStatic() {
        // Sin librerías o con "reducir movimiento": contenido completo, sin coreografía
        root.classList.add('is-static');
        const loader = $('#loader');
        if (loader) {
            loader.style.transition = 'opacity .4s';
            loader.style.opacity = '0';
            setTimeout(() => { loader.style.display = 'none'; }, 420);
        }
        const heroDust = $('#dust-hero');
        const finaleDust = $('#dust-finale');
        if (heroDust) new Dust(heroDust, { density: 14000, max: 70, still: true });
        if (finaleDust) new Dust(finaleDust, { density: 16000, max: 50, still: true });
        $$('.spark').forEach((s) => { s.style.opacity = '.8'; });
        showFloat();
    }

    function init() {
        root.classList.remove('no-js');
        root.classList.add('js');
        initWhatsApp();
        initYear();
        initMenu();
        initAnchors();
        initFaq();
        initSizer();
        initForm();
        initLightbox();

        const motionOk = Boolean(window.gsap && window.ScrollTrigger) && !mqReduce.matches;
        if (motionOk) initMotion(); else initStatic();
    }

    init();
})();
