(() => {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const body = document.body;
    const TRACK = { title: 'zip-архив', artist: 'CodEK$, люци', file: 'track.mp3' };

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

    const player = $('#player');
    const playerProg = $('#playerProg');
    const bars = $$('.bars i');
    const lyricsLayer = $('#lyrics');
    const bgEl = $('.bg');
    const avatarWrap = $('.avatar-wrap');

    const audio = (() => {
        const el = new Audio(TRACK.file);
        el.loop = true;
        el.preload = 'auto';
        let ctx, gain, analyser, on = false;
        const data = new Uint8Array(128);
        const listeners = [];

        const init = () => {
            if (ctx) return;
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            const src = ctx.createMediaElementSource(el);
            gain = ctx.createGain();
            gain.gain.value = 0;
            analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = .6;
            src.connect(gain).connect(analyser).connect(ctx.destination);
        };

        const set = v => {
            on = v;
            player.classList.toggle('on', v);
            localStorage.setItem('snd', v ? '1' : '0');
            listeners.forEach(f => f(v));
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

        const read = () => {
            if (!analyser || !on) return null;
            analyser.getByteFrequencyData(data);
            return data;
        };

        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({ title: TRACK.title, artist: TRACK.artist });
            navigator.mediaSession.setActionHandler('play', () => set(true));
            navigator.mediaSession.setActionHandler('pause', () => set(false));
        }

        return {
            el,
            set,
            read,
            toggle: () => set(!on),
            isOn: () => on,
            onChange: f => listeners.push(f)
        };
    })();

    const pulse = (() => {
        let avg = .2, beat = 0, energy = 0, lastBeat = 0;
        const subs = [];
        const update = now => {
            const d = audio.read();
            if (d) {
                let bass = 0;
                for (let k = 0; k < 4; k++) bass += d[k];
                bass /= 4 * 255;
                let full = 0;
                for (let k = 0; k < 64; k++) full += d[k];
                full /= 64 * 255;
                avg += (bass - avg) * .04;
                if (bass > avg * 1.18 + .03 && bass > .35 && now - lastBeat > 200) {
                    lastBeat = now;
                    beat = 1;
                    subs.forEach(f => f(bass));
                }
                energy += (full - energy) * .12;
                bars.forEach((b, k) => { b.style.height = 3 + (d[k * 6 + 1] / 255) * 13 + 'px'; });
            } else {
                energy *= .94;
                bars.forEach(b => { b.style.height = '3px'; });
            }
            beat *= .9;
            const b = beat.toFixed(3), e = energy.toFixed(3);
            [lyricsLayer, bgEl, avatarWrap].forEach(n => {
                n.style.setProperty('--beat', b);
                n.style.setProperty('--energy', e);
            });
            const dur = audio.el.duration;
            playerProg.style.transform = `scaleX(${dur ? audio.el.currentTime / dur : 0})`;
        };
        return { update, onBeat: f => subs.push(f) };
    })();

    const lyrics = (() => {
        const COLORS = ['200,255,61', '88,240,255', '255,61,127', '255,255,255'];
        const ENTER = ['rise', 'flip', 'swing', 'zoom', 'type', 'scatter', 'slice', 'drop', 'wave'];
        const EXIT = ['deep', 'up', 'scatter', 'dissolve', 'blur'];
        const syncMode = new URLSearchParams(location.search).has('sync');
        let lines = [], idx = 0, lastT = 0, recentEnter = [], active = [];

        const parse = text => {
            const out = [];
            let timed = false, offset = 0;
            const off = text.match(/\[offset:\s*([+-]?\d+)\]/i);
            if (off) offset = +off[1] / 1000;
            text.split(/\r?\n/).forEach(raw => {
                const stamps = [...raw.matchAll(/\[(\d+):(\d+(?:[.:]\d+)?)\]/g)];
                const words = raw.replace(/\[[^\]]*\]/g, '').trim();
                if (stamps.length) {
                    timed = true;
                    stamps.forEach(m => out.push({ t: +m[1] * 60 + parseFloat(m[2].replace(':', '.')) - offset, text: words }));
                } else if (words && !/^\[.*\]$/.test(raw.trim())) {
                    out.push({ t: null, text: words });
                }
            });
            if (timed) return { timed: true, lines: out.filter(l => l.t !== null).sort((a, b) => a.t - b.t) };
            return { timed: false, lines: out };
        };

        const spread = (list, dur) => {
            const start = dur * .07, end = dur * .96;
            const w = list.map(l => l.text.length + 10);
            const total = w.reduce((a, b) => a + b, 0);
            let acc = start;
            list.forEach((l, k) => {
                l.t = acc;
                acc += (end - start) * w[k] / total;
            });
            return list;
        };

        const fetchText = async url => {
            const r = await fetch(url, { cache: 'no-cache' });
            if (!r.ok) throw 0;
            return r.text();
        };

        const fromLrclib = async () => {
            const q = encodeURIComponent(TRACK.artist.split(',')[0] + ' ' + TRACK.title);
            const r = await fetch('https://lrclib.net/api/search?q=' + q);
            if (!r.ok) throw 0;
            const list = await r.json();
            const hit = list.find(x => x.syncedLyrics && Math.abs(x.duration - 144) < 6) || list.find(x => x.plainLyrics);
            if (!hit) throw 0;
            return hit.syncedLyrics || hit.plainLyrics;
        };

        const whenDuration = () => new Promise(res => {
            if (audio.el.duration) return res(audio.el.duration);
            audio.el.addEventListener('loadedmetadata', () => res(audio.el.duration), { once: true });
        });

        const load = async () => {
            let text = null;
            for (const src of [() => fetchText('lyrics.lrc'), () => fetchText('lyrics.txt'), fromLrclib]) {
                try {
                    text = await src();
                    if (text && text.trim()) break;
                } catch {}
            }
            if (!text) return;
            const res = parse(text);
            lines = res.timed ? res.lines : spread(res.lines, await whenDuration());
            lines.forEach((l, k) => {
                const next = lines[k + 1];
                l.end = next ? next.t : l.t + 4;
            });
            if (syncMode) initSync(res.lines.map(l => l.text).filter(Boolean));
        };

        const place = () => {
            let best = null, bestScore = -1;
            const mob = innerWidth < 860;
            for (let k = 0; k < 12; k++) {
                const c = { x: rand(.14, .86), y: rand(mob ? .2 : .14, .88) };
                let d = 1;
                active.forEach(a => { d = Math.min(d, Math.hypot((a.x - c.x) * 1.4, a.y - c.y)); });
                const centre = Math.hypot(c.x - .5, (c.y - .5) * 1.2);
                const score = d + Math.min(centre, .25) * .5;
                if (score > bestScore) { bestScore = score; best = c; }
            }
            return best;
        };

        const build = text => {
            const box = document.createElement('div');
            box.className = 'ly';
            const a = document.createElement('div');
            a.className = 'ly-a';
            const b = document.createElement('div');
            b.className = 'ly-b';
            const words = [], chars = [];
            text.split(/\s+/).forEach(w => {
                const ws = document.createElement('span');
                ws.className = 'ly-w';
                [...w].forEach(ch => {
                    const cs = document.createElement('span');
                    cs.className = 'ly-c';
                    cs.textContent = ch;
                    ws.appendChild(cs);
                    chars.push(cs);
                });
                b.appendChild(ws);
                words.push(ws);
            });
            a.appendChild(b);
            box.appendChild(a);
            return { box, a, b, words, chars };
        };

        const stagger = (units, total, frames, opts) => {
            const step = units.length > 1 ? total / (units.length - 1) : 0;
            units.forEach((u, k) => {
                const f = typeof frames === 'function' ? frames(u, k) : frames;
                u.animate(f, Object.assign({ fill: 'backwards', easing: 'cubic-bezier(.22,1,.36,1)' }, opts, { delay: k * step + (opts.delay || 0) }));
            });
        };

        const enter = (type, n, win) => {
            const { a, words, chars } = n;
            const ease = 'cubic-bezier(.22,1,.36,1)';
            switch (type) {
                case 'rise':
                    stagger(words, win, [
                        { opacity: 0, transform: 'translate3d(0,70px,-260px) rotateX(-75deg)', filter: 'blur(8px)' },
                        { opacity: 1, transform: 'none', filter: 'blur(0)' }
                    ], { duration: 900 });
                    break;
                case 'flip':
                    stagger(chars, win, [
                        { opacity: 0, transform: 'translateY(.35em) rotateX(95deg)' },
                        { opacity: 1, transform: 'none' }
                    ], { duration: 650 });
                    break;
                case 'swing':
                    a.animate([
                        { opacity: 0, transform: `rotateY(${pick([-1, 1]) * 100}deg) translateZ(-200px)` },
                        { opacity: 1, transform: 'none' }
                    ], { duration: 1200, easing: 'cubic-bezier(.34,1.3,.64,1)', fill: 'backwards' });
                    break;
                case 'zoom':
                    a.animate([
                        { opacity: 0, transform: 'translateZ(-1600px)', filter: 'blur(16px)' },
                        { opacity: 1, transform: 'none', filter: 'blur(0)' }
                    ], { duration: 1300, easing: ease, fill: 'backwards' });
                    break;
                case 'type':
                    stagger(chars, win * 1.2, [
                        { opacity: 0, transform: 'scale(1.6)', textShadow: '0 0 24px #fff' },
                        { opacity: 1, transform: 'none', textShadow: '0 0 0 transparent' }
                    ], { duration: 260, easing: 'steps(3,end)' });
                    break;
                case 'scatter':
                    stagger(chars, win * .5, () => [
                        { opacity: 0, transform: `translate3d(${rand(-260, 260)}px,${rand(-200, 200)}px,${rand(-600, 300)}px) rotate(${rand(-180, 180)}deg)` },
                        { opacity: 1, transform: 'none' }
                    ], { duration: 1100 });
                    break;
                case 'slice':
                    a.animate([
                        { clipPath: 'inset(0 100% 0 0)', transform: 'skewX(-25deg) translateX(-40px)' },
                        { clipPath: 'inset(0 0% 0 0)', transform: 'none' }
                    ], { duration: 900, easing: ease, fill: 'backwards' });
                    break;
                case 'drop':
                    stagger(words, win, () => [
                        { opacity: 0, transform: `translateY(-140px) rotateZ(${rand(-30, 30)}deg)` },
                        { opacity: 1, transform: 'none' }
                    ], { duration: 800, easing: 'cubic-bezier(.34,1.56,.64,1)' });
                    break;
                default:
                    stagger(chars, win * .8, [
                        { opacity: 0, transform: 'translateY(1em) rotateZ(12deg)' },
                        { opacity: 1, transform: 'none' }
                    ], { duration: 700 });
            }
        };

        const leave = (item, fast) => {
            if (item.gone) return;
            item.gone = true;
            active = active.filter(x => x !== item);
            const { a, chars, box } = item.node;
            const type = fast ? 'blur' : pick(EXIT);
            const dur = fast ? 500 : 1100;
            let anim;
            if (type === 'scatter' || type === 'dissolve') {
                chars.forEach(c => {
                    c.animate(type === 'scatter'
                        ? [{ opacity: 1 }, { opacity: 0, transform: `translate3d(${rand(-200, 200)}px,${rand(-160, 160)}px,${rand(-500, 200)}px) rotate(${rand(-140, 140)}deg)` }]
                        : [{ opacity: 1 }, { opacity: 0, filter: 'blur(6px)' }],
                        { duration: dur, delay: rand(0, 400), easing: 'cubic-bezier(.55,0,.8,.3)', fill: 'forwards' });
                });
                anim = a.animate([{ opacity: 1 }, { opacity: 1 }], { duration: dur + 420, fill: 'forwards' });
            } else {
                const to = {
                    deep: { opacity: 0, transform: 'translateZ(-800px)', filter: 'blur(10px)' },
                    up: { opacity: 0, transform: 'translateY(-90px) rotateX(55deg)', filter: 'blur(4px)' },
                    blur: { opacity: 0, filter: 'blur(18px)', transform: 'scale(1.15)' }
                }[type];
                anim = a.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, to], { duration: dur, easing: 'cubic-bezier(.55,0,.8,.3)', fill: 'forwards' });
            }
            anim.onfinish = () => box.remove();
        };

        const spawn = (line, life) => {
            if (!line.text) return;
            while (active.length >= 5) leave(active[0], true);
            const mob = innerWidth < 860;
            const pos = place();
            const n = build(line.text);
            const len = line.text.length;
            const size = clamp(118 - len * 1.7, 26, 108) * rand(.85, 1.15) * (mob ? .5 : 1);
            const color = pick(COLORS);
            const style = Math.random();
            n.b.style.setProperty('--lc', color);
            n.b.style.fontSize = size + 'px';
            if (style > .62) n.b.classList.add('outline');
            else if (style > .5) n.b.classList.add('thin');
            if (Math.random() < .75 && n.words.length > 1) pick(n.words).classList.add('hot');
            n.box.style.left = pos.x * 100 + '%';
            n.box.style.top = pos.y * 100 + '%';
            const z = rand(-520, 60);
            const ry = (pos.x < .5 ? 1 : -1) * rand(6, 38);
            const rx = rand(-16, 16);
            const rz = rand(-7, 7);
            const T = (dx, dy, dz, dry) => `translate(-50%,-50%) translate3d(${dx}px,${dy}px,${z + dz}px) rotateX(${rx}deg) rotateY(${ry + dry}deg) rotateZ(${rz}deg)`;
            n.box.style.transform = T(0, 0, 0, 0);
            lyricsLayer.appendChild(n.box);
            if (!reduced) {
                n.box.animate([
                    { transform: T(0, 0, 0, 0) },
                    { transform: T(rand(-40, 40), rand(-30, 30), rand(90, 240), rand(-12, 12)) }
                ], { duration: life * 1000 + 1600, easing: 'linear', fill: 'forwards' });
                let type;
                do { type = pick(ENTER); } while (recentEnter.includes(type));
                recentEnter = [type].concat(recentEnter).slice(0, 3);
                enter(type, n, clamp(life * 380, 300, 1500));
            }
            const item = { node: n, x: pos.x, y: pos.y };
            active.push(item);
            item.timer = setTimeout(() => leave(item), life * 1000);
        };

        const clear = fast => active.slice().forEach(i => { clearTimeout(i.timer); leave(i, fast); });

        const resync = now => {
            idx = 0;
            while (idx < lines.length && lines[idx].t <= now - .25) idx++;
        };

        const tick = () => {
            if (syncMode || !lines.length || !audio.isOn()) return;
            const now = audio.el.currentTime;
            if (now < lastT - .5) {
                clear(true);
                resync(now);
            }
            lastT = now;
            while (idx < lines.length && lines[idx].t <= now) {
                const l = lines[idx];
                if (now - l.t < 1.2) spawn(l, clamp(l.end - l.t + 1.3, 2.6, 8));
                idx++;
            }
        };

        pulse.onBeat(() => {
            active.forEach(item => {
                if (Math.random() > .6) return;
                const c = pick(item.node.chars);
                if (c) c.animate([{ transform: 'none' }, { transform: `translateY(-.18em) rotate(${rand(-12, 12)}deg)` }, { transform: 'none' }], { duration: 220, easing: 'ease-out' });
            });
        });

        audio.onChange(on => {
            lyricsLayer.classList.toggle('off', !on);
            if (!on) setTimeout(() => { if (!audio.isOn()) clear(true); }, 900);
            else {
                lastT = audio.el.currentTime;
                resync(lastT);
            }
        });

        const initSync = texts => {
            const panel = $('#sync');
            const list = $('#syncList');
            const stamps = [];
            panel.hidden = false;
            const fmt = t => {
                const m = Math.floor(t / 60), s = (t % 60).toFixed(2).padStart(5, '0');
                return `${String(m).padStart(2, '0')}:${s}`;
            };
            const render = () => {
                list.innerHTML = '';
                texts.forEach((t, k) => {
                    const row = document.createElement('div');
                    row.className = 'sync-row' + (k < stamps.length ? ' done' : k === stamps.length ? ' next' : '');
                    const ts = document.createElement('span');
                    ts.textContent = k < stamps.length ? fmt(stamps[k]) : '--:--.--';
                    row.append(ts, document.createTextNode(t));
                    list.appendChild(row);
                });
                const nx = $('.next', list);
                if (nx) nx.scrollIntoView({ block: 'center' });
            };
            render();
            window.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!audio.isOn()) { notify('сначала включи музыку'); return; }
                    if (stamps.length >= texts.length) return;
                    const t = audio.el.currentTime;
                    stamps.push(t);
                    spawn({ text: texts[stamps.length - 1] }, 3.5);
                    render();
                } else if (e.key === 'Backspace') {
                    e.preventDefault();
                    stamps.pop();
                    render();
                } else if (e.key === 'r' || e.key === 'к') {
                    stamps.length = 0;
                    audio.el.currentTime = 0;
                    clear(true);
                    render();
                } else if (e.key === 's' || e.key === 'ы') {
                    const out = [`[ti:${TRACK.title}]`, `[ar:${TRACK.artist}]`].concat(stamps.map((t, k) => `[${fmt(t)}]${texts[k]}`)).join('\n');
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(new Blob([out], { type: 'text/plain' }));
                    a.download = 'lyrics.lrc';
                    a.click();
                    notify('lyrics.lrc скачан');
                }
            });
        };

        load();
        return { tick };
    })();

    const loop = now => {
        pulse.update(now);
        lyrics.tick();
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    let armed = false;
    const arm = e => {
        if (armed) return;
        armed = true;
        if (e.target.closest && e.target.closest('#player')) return;
        if (localStorage.getItem('snd') !== '0') audio.set(true);
    };
    window.addEventListener('pointerdown', arm, { once: true });
    player.addEventListener('click', () => audio.toggle());

    const typed = $('#typed');
    const phrases = ['программист', 'пишу код с нуля', 'чиню то, что сам сломал', 'python · java · c++ · c#', 'asm когда скучно'];
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
    const fmtClock = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const tickClock = () => { clock.textContent = fmtClock.format(new Date()); };
    tickClock();
    setInterval(tickClock, 1000);

    const runTerm = section => {
        const term = $('.term', section);
        if (!term || term.dataset.done) return;
        term.dataset.done = '1';
        $$('.term-line', term).forEach((l, k) => setTimeout(() => l.classList.add('show'), 700 + k * 380));
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
            if (mobileQ.matches) thumb.style.transform = `translate(${(track.clientWidth - thumb.clientWidth) * p}px,-50%)`;
            else thumb.style.transform = `translate(-50%,${(track.clientHeight - thumb.clientHeight) * p}px)`;
        };

        const play = s => {
            s.classList.remove('anim');
            void s.offsetWidth;
            s.classList.add('anim');
        };

        const go = i => {
            i = clamp(i, 0, slides.length - 1);
            if (i === cur) return;
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
            history.replaceState(null, '', location.pathname + location.search + (i ? '#' + s.id : ''));
            rail.classList.add('flash');
            clearTimeout(flashT);
            flashT = setTimeout(() => rail.classList.remove('flash'), 1100);
            runTerm(s);
        };

        const canScroll = dir => {
            const sc = $('.slide-scroll', slides[cur]);
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
            if (canScroll(dir)) { innerAt = now; return; }
            e.preventDefault();
            if (now < lockUntil) {
                if (now > lockUntil - 220) lockUntil = now + 220;
                return;
            }
            if (now - innerAt < 380) { innerAt = now; return; }
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

        let dragging = false;
        const seek = (x, y) => {
            const r = track.getBoundingClientRect();
            const p = mobileQ.matches ? (x - r.left) / r.width : (y - r.top) / r.height;
            go(Math.round(clamp(p, 0, 1) * (slides.length - 1)));
        };
        const pt = e => e.touches ? e.touches[0] : e;
        const startDrag = e => {
            if (e.cancelable) e.preventDefault();
            dragging = true;
            body.classList.add('dragging');
            seek(pt(e).clientX, pt(e).clientY);
        };
        const moveDrag = e => {
            if (!dragging) return;
            if (e.cancelable) e.preventDefault();
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
                el.textContent = orig.split('').map((c, i) => i < k / 2 ? c : chars[Math.floor(Math.random() * chars.length)]).join('');
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
    pulse.onBeat(v => { if (v > .8 && Math.random() < .15) glitchOnce(); });

    const konami = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
    let ki = 0;
    window.addEventListener('keydown', e => {
        const key = e.key.toLowerCase();
        const isM = key === 'm' || key === 'ь';
        if (!armed) {
            armed = true;
            if (!isM && key !== 'enter' && localStorage.getItem('snd') !== '0') audio.set(true);
        }
        if (isM && !e.repeat) audio.toggle();
        ki = key === konami[ki] ? ki + 1 : 0;
        if (ki === konami.length) {
            ki = 0;
            body.classList.add('rave');
            notify('rave mode');
            setTimeout(() => body.classList.remove('rave'), 8000);
        }
    });

    const baseTitle = document.title;
    document.addEventListener('visibilitychange', () => {
        document.title = document.hidden ? 'эй, вернись' : baseTitle;
    });
})();
