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
        let ctx, master, analyser, started = false, on = false, i = 0;
        const data = new Uint8Array(32);
        const chords = [[45,52,57,60,64],[41,48,53,57,60],[43,50,55,59,62],[40,47,52,55,59]];
        const step = 7;
        const freq = m => 440 * Math.pow(2, (m - 69) / 12);

        const impulse = () => {
            const len = ctx.sampleRate * 3;
            const buf = ctx.createBuffer(2, len, ctx.sampleRate);
            for (let ch = 0; ch < 2; ch++) {
                const d = buf.getChannelData(ch);
                for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / len, 2.8);
            }
            return buf;
        };

        const voice = (midi, t, dur, type, gain, dest) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = type;
            o.frequency.value = freq(midi);
            o.detune.value = (Math.random() - .5) * 10;
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(gain, t + dur * .35);
            g.gain.setValueAtTime(gain, t + dur * .6);
            g.gain.linearRampToValueAtTime(0, t + dur);
            o.connect(g).connect(dest);
            o.start(t);
            o.stop(t + dur + .1);
        };

        const start = () => {
            if (started) return;
            started = true;
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            master = ctx.createGain();
            master.gain.value = 0;
            analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            const comp = ctx.createDynamicsCompressor();
            const filt = ctx.createBiquadFilter();
            filt.type = 'lowpass';
            filt.frequency.value = 900;
            filt.Q.value = .7;
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.value = .07;
            lfoGain.gain.value = 350;
            lfo.connect(lfoGain).connect(filt.frequency);
            lfo.start();
            const conv = ctx.createConvolver();
            conv.buffer = impulse();
            const wet = ctx.createGain();
            wet.gain.value = .55;
            const dry = ctx.createGain();
            dry.gain.value = .6;
            filt.connect(dry).connect(comp);
            filt.connect(conv).connect(wet).connect(comp);
            comp.connect(master).connect(analyser).connect(ctx.destination);

            const play = () => {
                const t = ctx.currentTime + .05;
                const ch = chords[i % chords.length];
                ch.forEach((m, k) => {
                    voice(m + 12, t + k * .12, step + 1.5, 'triangle', .09, filt);
                    voice(m + 12, t + k * .12, step + 1.5, 'sawtooth', .025, filt);
                });
                voice(ch[0], t, step + 1, 'sine', .22, filt);
                voice(ch[2] + 24, t + 3.5, 3, 'sine', .05, filt);
                i++;
            };
            play();
            setInterval(play, step * 1000);
        };

        const set = v => {
            on = v;
            soundBtn.classList.toggle('on', v);
            localStorage.setItem('snd', v ? '1' : '0');
            if (!started) {
                if (!v) return;
                start();
            }
            if (ctx.state === 'suspended') ctx.resume();
            master.gain.cancelScheduledValues(ctx.currentTime);
            master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
            master.gain.linearRampToValueAtTime(v ? .9 : 0, ctx.currentTime + 1.2);
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

    const gate = $('#gate');
    let entered = false, enteredAt = 0;
    const enter = () => {
        if (entered) return;
        entered = true;
        enteredAt = performance.now();
        gate.classList.add('out');
        body.classList.add('in');
        if (localStorage.getItem('snd') !== '0') audio.set(true);
        setTimeout(() => gate.remove(), 900);
    };
    gate.addEventListener('click', enter);
    window.addEventListener('keydown', enter, { once: true });
    window.addEventListener('touchend', enter, { once: true });

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
            const link = e.target.closest('a,button,.chip,.project,.gate');
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

    $$('.stack-grid,.projects-grid').forEach(g => {
        [...g.children].forEach((el, k) => el.style.setProperty('--i', k));
    });

    const io = new IntersectionObserver(es => {
        es.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target);
            }
        });
    }, { threshold: .15 });
    $$('.reveal').forEach(el => io.observe(el));

    $$('.card').forEach(card => {
        const tilt = card.classList.contains('tilt');
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = e.clientX - r.left, y = e.clientY - r.top;
            card.style.setProperty('--x', x + 'px');
            card.style.setProperty('--y', y + 'px');
            if (tilt && fine) {
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

    const cio = new IntersectionObserver(es => {
        es.forEach(e => {
            if (!e.isIntersecting) return;
            cio.unobserve(e.target);
            const el = e.target;
            const end = +el.dataset.count;
            const suf = el.dataset.suffix || '';
            const t0 = performance.now();
            const run = now => {
                const k = Math.min(1, (now - t0) / 1400);
                el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + suf;
                if (k < 1) requestAnimationFrame(run);
            };
            requestAnimationFrame(run);
        });
    }, { threshold: .5 });
    $$('[data-count]').forEach(el => cio.observe(el));

    const term = $('.term');
    if (term) {
        const lines = $$('.term-line', term);
        const tio = new IntersectionObserver(es => {
            if (!es[0].isIntersecting) return;
            tio.disconnect();
            lines.forEach((l, k) => setTimeout(() => l.classList.add('show'), 350 + k * 420));
        }, { threshold: .4 });
        tio.observe(term);
    }

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

    const prog = $('#progress');
    const nav = $('.nav');
    const links = $$('.nav-links a');
    const secs = $$('section[id]');
    let lastY = 0;
    const onScroll = () => {
        const y = scrollY;
        const max = root.scrollHeight - innerHeight;
        prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        nav.classList.toggle('scrolled', y > 40);
        nav.classList.toggle('hide', y > lastY && y > 300);
        lastY = y;
        let cur = '';
        secs.forEach(s => { if (y >= s.offsetTop - innerHeight * .4) cur = s.id; });
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

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
        if ((key === 'm' || key === 'ь') && !e.repeat && entered && performance.now() - enteredAt > 500) audio.toggle();
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