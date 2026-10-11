(() => {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const fine = matchMedia('(pointer:fine)').matches;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lerp = (a, b, t) => a + (b - a) * t;
    const root = document.documentElement;
    const body = document.body;

    if (fine) body.classList.add('fine');

    console.log('%cgravemaulr', 'font:700 28px JetBrains Mono,monospace;color:#c8ff3d;background:#050507;padding:8px 16px;border-radius:6px');
    console.log('%cлезешь в исходники? ну давай. t.me/gravemaulr', 'color:#8b8b9a;font-family:monospace');

    const toast = $('#toast');
    let toastTimer;
    const notify = msg => {
        toast.textContent = msg;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
    };

    const soundBtn = $('#sound');
    const bars = $$('.bars i');

    const audio = (() => {
        const el = new Audio('track.mp3');
        el.loop = true;
        el.preload = 'auto';
        let ctx, gain, analyser, on = false;
        const data = new Uint8Array(32);

        const init = () => {
            if (ctx) return;
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            const src = ctx.createMediaElementSource(el);
            gain = ctx.createGain();
            gain.gain.value = 0;
            analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            src.connect(gain).connect(analyser).connect(ctx.destination);
        };

        const set = v => {
            on = v;
            soundBtn.classList.toggle('on', v);
            localStorage.setItem('snd', v ? '1' : '0');
            if (!v && !ctx) return;
            init();
            if (ctx.state === 'suspended') ctx.resume();
            const t = ctx.currentTime;
            gain.gain.cancelScheduledValues(t);
            gain.gain.setValueAtTime(gain.gain.value, t);
            gain.gain.linearRampToValueAtTime(v ? .9 : 0, t + 1.2);
            if (v) el.play().catch(() => {});
            else setTimeout(() => { if (!on) el.pause(); }, 1300);
        };

        const draw = () => {
            if (analyser && on) {
                analyser.getByteFrequencyData(data);
                bars.forEach((b, k) => { b.style.height = 3 + (data[k * 2 + 1] / 255) * 11 + 'px'; });
            } else {
                bars.forEach(b => { b.style.height = '3px'; });
            }
            requestAnimationFrame(draw);
        };
        draw();

        return { set, toggle: () => set(!on) };
    })();

    let armed = false;
    const arm = e => {
        if (armed) return;
        armed = true;
        if (e.target.closest('#sound')) return;
        if (localStorage.getItem('snd') !== '0') audio.set(true);
    };
    window.addEventListener('pointerdown', arm, { once: true });

    if (fine) {
        const dot = $('#cursor');
        const ring = $('#cursorRing');
        let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
        window.addEventListener('mousemove', e => {
            mx = e.clientX;
            my = e.clientY;
            root.style.setProperty('--mx', mx + 'px');
            root.style.setProperty('--my', my + 'px');
        });
        window.addEventListener('mousedown', () => ring.classList.add('down'));
        window.addEventListener('mouseup', () => ring.classList.remove('down'));
        document.addEventListener('mouseover', e => {
            const link = e.target.closest('a,button,.chip,.project');
            ring.classList.toggle('hover', !!link);
            ring.classList.toggle('text', !link && !!e.target.closest('p,.term-body,.h2,.title'));
        });
        const tick = () => {
            rx = lerp(rx, mx, .18);
            ry = lerp(ry, my, .18);
            dot.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;
            ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
            requestAnimationFrame(tick);
        };
        tick();
    }

    const cv = $('#fx');
    const cx = cv.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    let W, H, pts = [];
    const mouse = { x: -1e4, y: -1e4 };
    const resize = () => {
        W = cv.width = innerWidth * dpr;
        H = cv.height = innerHeight * dpr;
        cv.style.width = innerWidth + 'px';
        cv.style.height = innerHeight + 'px';
        const n = Math.min(110, Math.floor(innerWidth * innerHeight / 14000));
        pts = Array.from({ length: n }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: (Math.random() - .5) * .35 * dpr,
            vy: (Math.random() - .5) * .35 * dpr,
            r: (Math.random() * 1.4 + .4) * dpr
        }));
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX * dpr;
        mouse.y = e.clientY * dpr;
    });
    const drawFx = () => {
        cx.clearRect(0, 0, W, H);
        const link = 130 * dpr, pull = 180 * dpr, vmax = 1.2 * dpr;
        for (const p of pts) {
            const dx = mouse.x - p.x, dy = mouse.y - p.y, dist = Math.hypot(dx, dy) || 1;
            if (dist < pull) {
                p.vx -= dx / dist * .02 * dpr;
                p.vy -= dy / dist * .02 * dpr;
            }
            const sp = Math.hypot(p.vx, p.vy);
            if (sp > vmax) { p.vx = p.vx / sp * vmax; p.vy = p.vy / sp * vmax; }
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= .995;
            p.vy *= .995;
            if (p.x < 0 || p.x > W) p.vx *= -1;
            if (p.y < 0 || p.y > H) p.vy *= -1;
            cx.beginPath();
            cx.arc(p.x, p.y, p.r, 0, 7);
            cx.fillStyle = 'rgba(200,255,61,.55)';
            cx.fill();
        }
        cx.lineWidth = dpr * .6;
        for (let a = 0; a < pts.length; a++) {
            for (let b = a + 1; b < pts.length; b++) {
                const p = pts[a], q = pts[b], d = Math.hypot(p.x - q.x, p.y - q.y);
                if (d < link) {
                    cx.strokeStyle = `rgba(200,255,61,${(1 - d / link) * .18})`;
                    cx.beginPath();
                    cx.moveTo(p.x, p.y);
                    cx.lineTo(q.x, q.y);
                    cx.stroke();
                }
            }
        }
        requestAnimationFrame(drawFx);
    };
    if (!reduced) drawFx();

    const typed = $('#typed');
    const phrases = ['программист', 'пишу код с нуля', 'чиню то, что сам сломал', 'python · java · c++ · c#', 'asm когда скучно', 'gravemaulr'];
    let pi = 0, ci = 0, del = false;
    const type = () => {
        const p = phrases[pi];
        typed.textContent = p.slice(0, ci);
        let wait = del ? 35 : 70 + Math.random() * 60;
        if (!del && ci === p.length) {
            wait = 1800;
            del = true;
        } else if (del && ci === 0) {
            del = false;
            pi = (pi + 1) % phrases.length;
            wait = 400;
        } else {
            ci += del ? -1 : 1;
        }
        setTimeout(type, wait);
    };
    setTimeout(type, 1400);

    const clock = $('#clock');
    const fmt = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const tickClock = () => { clock.textContent = fmt.format(new Date()); };
    tickClock();
    setInterval(tickClock, 1000);

    const mq = $('#marquee');
    mq.appendChild(mq.firstElementChild.cloneNode(true));

    $$('.card').forEach(card => {
        const tilt = card.classList.contains('tilt');
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = e.clientX - r.left, y = e.clientY - r.top;
            card.style.setProperty('--x', x + 'px');
            card.style.setProperty('--y', y + 'px');
            if (tilt && fine && !card.closest('.slide:not(.active)')) {
                card.style.transform = `perspective(900px) rotateX(${(y / r.height - .5) * -5}deg) rotateY(${(x / r.width - .5) * 5}deg)`;
            }
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });

    if (fine) {
        $$('.magnet').forEach(el => {
            el.addEventListener('mousemove', e => {
                const r = el.getBoundingClientRect();
                el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
            });
            el.addEventListener('mouseleave', () => { el.style.transform = ''; });
        });
    }

    const counted = new WeakSet();
    const runCounters = section => {
        $$('[data-count]', section).forEach(el => {
            if (counted.has(el)) return;
            counted.add(el);
            const end = +el.dataset.count;
            const suf = el.dataset.suffix || '';
            const t0 = performance.now() + 500;
            const run = now => {
                const k = Math.max(0, Math.min(1, (now - t0) / 1400));
                el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suf;
                if (k < 1) requestAnimationFrame(run);
            };
            requestAnimationFrame(run);
        });
    };

    const runTerm = section => {
        const term = $('.term', section);
        if (!term || term.dataset.done) return;
        term.dataset.done = '1';
        $$('.term-line', term).forEach((l, k) => setTimeout(() => l.classList.add('show'), 700 + k * 420));
    };

    const shapeTypes = ['square', 'circle', 'triangle'];
    const spawnShapes = section => {
        if (reduced || !fine) return;
        $$('.shapes', section).forEach(box => {
            if (box.dataset.done) return;
            box.dataset.done = '1';
            const type = shapeTypes.includes(box.dataset.shape) ? box.dataset.shape : 'square';
            const frag = document.createDocumentFragment();
            for (let k = 0; k < 8; k++) {
                const el = document.createElement('i');
                el.className = 'fs ' + type;
                const size = Math.random() * 12 + 4;
                el.style.width = size + 'px';
                el.style.height = size + 'px';
                el.style.left = Math.random() * 100 + '%';
                el.style.top = Math.random() * 100 + '%';
                el.style.setProperty('--d', (Math.random() * 3 + 2.5) + 's');
                el.style.setProperty('--tx', (Math.random() * 40 - 20) + 'px');
                el.style.setProperty('--ty', (Math.random() * 40 - 20) + 'px');
                el.style.setProperty('--rot', (Math.random() * 240 - 120) + 'deg');
                el.style.animationDelay = '-' + (Math.random() * 6) + 's';
                frag.appendChild(el);
            }
            box.appendChild(frag);
        });
    };

    const navLinks = $('#navLinks');
    const navInd = $('#navInd');
    const navItems = $$('a', navLinks);
    const moveInd = el => {
        if (!el || !navLinks.offsetParent) return;
        navInd.style.left = el.offsetLeft + 'px';
        navInd.style.width = el.offsetWidth + 'px';
    };
    const activeNav = () => navItems.find(a => a.classList.contains('active'));
    navItems.forEach(a => a.addEventListener('mouseenter', () => moveInd(a)));
    navLinks.addEventListener('mouseleave', () => moveInd(activeNav()));

    const deck = (() => {
        const slides = $$('.slide');
        const ids = slides.map(s => s.id);
        const rail = $('#rail');
        const track = $('#railTrack');
        const thumb = $('#railThumb');
        const tip = $('#railTip');
        const count = $('#railCount');
        const mobileQ = matchMedia('(max-width: 860px)');
        const pad = n => String(n).padStart(2, '0');
        let cur = -1, lockUntil = 0, innerAt = 0, flashT;

        body.classList.add('deck-on');

        const setThumb = () => {
            const p = slides.length > 1 ? cur / (slides.length - 1) : 0;
            if (mobileQ.matches) {
                thumb.style.transform = `translate(${(track.clientWidth - thumb.clientWidth) * p}px,-50%)`;
            } else {
                thumb.style.transform = `translate(-50%,${(track.clientHeight - thumb.clientHeight) * p}px)`;
            }
        };

        const play = s => {
            s.classList.remove('anim');
            void s.offsetWidth;
            s.classList.add('anim');
        };

        const go = (i, opts = {}) => {
            i = Math.max(0, Math.min(slides.length - 1, i));
            if (i === cur && !opts.force) return;
            const dir = i >= cur ? 1 : -1;
            cur = i;
            slides.forEach((s, k) => {
                const on = k === i;
                s.classList.toggle('active', on);
                s.setAttribute('aria-hidden', on ? 'false' : 'true');
                if (!on) s.classList.remove('anim');
            });
            const s = slides[i];
            s.style.setProperty('--dir', dir);
            const sc = $('.slide-scroll', s);
            if (sc) sc.scrollTop = dir > 0 ? 0 : sc.scrollHeight;
            play(s);
            tip.textContent = s.dataset.label || s.id;
            count.textContent = pad(i + 1) + '/' + pad(slides.length);
            setThumb();
            navItems.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + s.id));
            moveInd(activeNav());
            history.replaceState(null, '', i ? '#' + s.id : location.pathname + location.search);
            rail.classList.add('flash');
            clearTimeout(flashT);
            flashT = setTimeout(() => rail.classList.remove('flash'), 1100);
            spawnShapes(s);
            runCounters(s);
            runTerm(s);
        };

        const scroller = () => $('.slide-scroll', slides[cur]);
        const canScroll = dir => {
            const sc = scroller();
            if (!sc || sc.scrollHeight <= sc.clientHeight + 2) return false;
            return dir > 0 ? sc.scrollTop + sc.clientHeight < sc.scrollHeight - 2 : sc.scrollTop > 2;
        };

        const step = dir => {
            const now = performance.now();
            if (now < lockUntil) return;
            const next = cur + dir;
            if (next < 0 || next >= slides.length) return;
            go(next);
            lockUntil = now + 750;
        };

        window.addEventListener('wheel', e => {
            if (e.ctrlKey) return;
            const dir = e.deltaY > 0 ? 1 : -1;
            const now = performance.now();
            if (canScroll(dir)) {
                innerAt = now;
                return;
            }
            e.preventDefault();
            if (now < lockUntil) {
                if (now > lockUntil - 220) lockUntil = now + 220;
                return;
            }
            if (now - innerAt < 380) {
                innerAt = now;
                return;
            }
            if (Math.abs(e.deltaY) < 8) return;
            step(dir);
        }, { passive: false });

        window.addEventListener('keydown', e => {
            if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]')) return;
            let dir = 0;
            if (['ArrowDown', 'PageDown'].includes(e.key) || e.code === 'Space') dir = 1;
            else if (['ArrowUp', 'PageUp'].includes(e.key)) dir = -1;
            else if (e.key === 'Home') { e.preventDefault(); go(0); return; }
            else if (e.key === 'End') { e.preventDefault(); go(slides.length - 1); return; }
            if (!dir) return;
            if (canScroll(dir) && e.key !== 'PageDown' && e.key !== 'PageUp') return;
            e.preventDefault();
            if (!e.repeat) step(dir);
        });

        let ty = null, tx = 0, edgeDown = false, edgeUp = false, swiped = 0;
        window.addEventListener('touchstart', e => {
            if (e.target.closest('#rail')) { ty = null; return; }
            ty = e.touches[0].clientY;
            tx = e.touches[0].clientX;
            edgeDown = !canScroll(1);
            edgeUp = !canScroll(-1);
        }, { passive: true });
        window.addEventListener('touchend', e => {
            if (ty === null) return;
            const dy = ty - e.changedTouches[0].clientY;
            const dx = tx - e.changedTouches[0].clientX;
            ty = null;
            if (Math.abs(dy) < 50 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
            if (dy > 0 && edgeDown) { step(1); swiped = Date.now(); }
            else if (dy < 0 && edgeUp) { step(-1); swiped = Date.now(); }
        }, { passive: true });
        document.addEventListener('click', e => {
            if (Date.now() - swiped < 400) { e.preventDefault(); e.stopPropagation(); }
        }, true);

        let dragging = false, moved = false;
        const seek = (x, y) => {
            const r = track.getBoundingClientRect();
            const p = mobileQ.matches ? (x - r.left) / r.width : (y - r.top) / r.height;
            go(Math.round(Math.max(0, Math.min(1, p)) * (slides.length - 1)));
        };
        const pt = e => e.touches ? e.touches[0] : e;
        const startDrag = e => {
            if (e.cancelable) e.preventDefault();
            dragging = true;
            moved = false;
            body.classList.add('dragging');
            seek(pt(e).clientX, pt(e).clientY);
        };
        const moveDrag = e => {
            if (!dragging) return;
            if (e.cancelable) e.preventDefault();
            moved = true;
            seek(pt(e).clientX, pt(e).clientY);
        };
        const endDrag = () => {
            dragging = false;
            body.classList.remove('dragging');
        };
        track.addEventListener('mousedown', startDrag);
        track.addEventListener('touchstart', startDrag, { passive: false });
        window.addEventListener('mousemove', moveDrag);
        window.addEventListener('touchmove', moveDrag, { passive: false });
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchend', endDrag);

        $$('a[href^="#"]').forEach(a => {
            a.addEventListener('click', e => {
                const k = ids.indexOf(a.getAttribute('href').slice(1));
                if (k === -1) return;
                e.preventDefault();
                go(k);
            });
        });

        window.addEventListener('resize', () => {
            setThumb();
            moveInd(activeNav());
        });

        const start = ids.indexOf(location.hash.slice(1));
        go(start > -1 ? start : 0);

        return { replay: () => { play(slides[cur]); moveInd(activeNav()); } };
    })();

    const loader = $('#loader');
    let loaderGone = false;
    const hideLoader = () => {
        if (loaderGone) return;
        loaderGone = true;
        loader.classList.add('hidden');
        deck.replay();
        setTimeout(() => loader.remove(), 650);
    };
    if (document.readyState === 'complete') setTimeout(hideLoader, 250);
    else window.addEventListener('load', () => setTimeout(hideLoader, 250));
    setTimeout(hideLoader, 4000);

    const chars = '!<>-_\\/[]{}—=+*^?#░▒▓';
    $$('.contact').forEach(row => {
        const el = $('.contact-v', row);
        const orig = el.textContent;
        let frame, k = 0;
        row.addEventListener('mouseenter', () => {
            cancelAnimationFrame(frame);
            k = 0;
            const run = () => {
                el.textContent = orig.split('').map((c, idx) => idx < k / 2 ? c : chars[Math.floor(Math.random() * chars.length)]).join('');
                if (k++ < orig.length * 2) frame = requestAnimationFrame(run);
                else el.textContent = orig;
            };
            run();
        });
    });

    $$('.copy').forEach(b => {
        b.addEventListener('click', async e => {
            e.preventDefault();
            try {
                await navigator.clipboard.writeText(b.dataset.copy);
                notify('скопировано · ' + b.dataset.copy);
            } catch {
                notify(b.dataset.copy);
            }
        });
    });

    const title = $('.title');
    const glitchOnce = () => {
        title.classList.add('go');
        setTimeout(() => title.classList.remove('go'), 520);
    };
    const glitchLoop = () => {
        glitchOnce();
        setTimeout(glitchLoop, 3000 + Math.random() * 5000);
    };
    setTimeout(glitchLoop, 2500);
    title.addEventListener('mouseenter', glitchOnce);

    const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let ki = 0;
    window.addEventListener('keydown', e => {
        const key = e.key.toLowerCase();
        const isM = key === 'm' || key === 'ь';
        if (!armed) {
            armed = true;
            if (!isM && localStorage.getItem('snd') !== '0') audio.set(true);
        }
        if (isM && !e.repeat) audio.toggle();
        ki = key === konami[ki].toLowerCase() ? ki + 1 : 0;
        if (ki === konami.length) {
            ki = 0;
            body.classList.add('rave');
            notify('rave mode');
            setTimeout(() => body.classList.remove('rave'), 8000);
        }
    });
    soundBtn.addEventListener('click', () => audio.toggle());

    const baseTitle = document.title;
    document.addEventListener('visibilitychange', () => {
        document.title = document.hidden ? 'эй, вернись' : baseTitle;
    });
})();