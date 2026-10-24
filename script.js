(() => {
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rand = (a, b) => a + Math.random() * (b - a);
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const body = document.body;
    const TRACK = { title: 'LOLI', artist: 'Migas, 5mewmet', file: 'track.mp3' };

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
        const ENTER = ['up', 'side', 'flip', 'blur', 'letters'];
        const syncMode = new URLSearchParams(location.search).has('sync');
        let lines = [], idx = 0, lastT = 0, active = [], row = 0, lastEnter = '';
        const rowsCount = () => innerWidth < 860 ? 5 : 6;

        const FX_COLORS = { lime: '200,255,61', cyan: '88,240,255', pink: '255,61,127', red: '255,42,64', gold: '255,198,58', white: '255,255,255', violet: '164,112,255', orange: '255,128,40', blood: '170,0,24', ice: '170,225,255' };
        const FX_CSS = new Set(['outline', 'thin', 'bold', 'italic', 'caps', 'spaced', 'tight', 'strike', 'under', 'mirror', 'upside', 'tilt', 'blurred', 'ghost', 'dim', 'quiet', 'longshadow', 'mono', 'neon', 'glow', 'rainbow', 'grad', 'shake', 'jitter', 'wave', 'bounce', 'float', 'pulse', 'beat', 'bass', 'spin', 'swing', 'wobble', 'rubber', 'heartbeat', 'drunk', 'breathe', 'flicker', 'chroma', 'glitch', 'stack']);
        const FX_SIZE = { huge: 1.6, big: 1.3, small: .75, tiny: .55 };
        const FX_IN = new Set(['type', 'scramble', 'drop', 'rise', 'pop', 'fade', 'blurin', 'stretch', 'fall', 'slam', 'zoomin', 'late']);
        const FX_OUT = new Set(['explode', 'melt', 'burn', 'evaporate', 'collapse']);
        const FX_LINE = new Set(['center', 'straight', 'solo', 'hold', 'quick', 'flash', 'shakescreen', 'invert', 'blackout', 'echo', 'karaoke']);
        const FX_ALIAS = {
            scream: ['caps', 'huge', 'shake', 'red', 'flash', 'shakescreen', 'slam'],
            whisper: ['quiet', 'small', 'fade', 'evaporate'],
            hype: ['caps', 'beat', 'neon', 'bass', 'pop'],
            dream: ['blurin', 'float', 'dim', 'ice', 'evaporate'],
            horror: ['blood', 'flicker', 'glitch', 'melt'],
            chaos: ['scramble', 'jitter', 'chroma', 'explode'],
            hook: ['center', 'straight', 'caps', 'big', 'karaoke', 'beat', 'echo'],
            outro: ['center', 'straight', 'fade', 'dim', 'evaporate', 'hold']
        };
        const GLYPHS = 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЭЮЯ#$%&@!?/<>01';

        const autoParam = new URLSearchParams(location.search);
        let autoLevel = autoParam.has('noauto') ? 'off' : (autoParam.get('auto') || 'mid').toLowerCase();
        let autoN = 0, autoHeavyAt = -99, autoLast = '';
        const AUTO_CFG = {
            low: { word: .25, line: .3, inP: .35, outP: .2, heavy: 0, gap: 99 },
            mid: { word: .5, line: .55, inP: .6, outP: .4, heavy: .12, gap: 6 },
            high: { word: .8, line: .8, inP: .85, outP: .65, heavy: .25, gap: 3 }
        };
        const AUTO_STYLE = ['outline', 'thin', 'bold', 'italic', 'caps', 'spaced', 'neon', 'glow', 'grad', 'chroma', 'longshadow', 'mono', 'tilt', 'under'];
        const AUTO_MOTION = ['wave', 'bounce', 'float', 'pulse', 'beat', 'swing', 'wobble', 'breathe', 'jitter', 'flicker', 'glitch', 'rubber', 'heartbeat', 'shake'];
        const AUTO_WORD = ['hot', 'neon', 'glow', 'glitch', 'shake', 'caps', 'big', 'rainbow', 'chroma', 'heartbeat', 'bass', 'spin', 'outline', 'strike', 'mirror'];
        const AUTO_COL = Object.keys(FX_COLORS).filter(c => c !== 'blood');
        const AUTO_IN = [...FX_IN].filter(f => f !== 'late');
        const AUTO_OUT = [...FX_OUT];
        const AUTO_SOFT = ['center', 'straight', 'echo', 'karaoke', 'hold'];
        const AUTO_HEAVY = ['flash', 'shakescreen', 'invert', 'blackout', 'solo'];
        const AUTO_PRESET = ['scream', 'whisper', 'hype', 'dream', 'horror', 'chaos', 'hook', 'outro'];

        // Lines with no markup get random effects; {plain} keeps a line clean.
        const autoFx = m => {
            if (autoLevel === 'off' || !AUTO_CFG[autoLevel]) return m;
            if (m.line.length || m.words.some(x => x.fx.length) || !m.words.length) return m;
            const C = AUTO_CFG[autoLevel], k = autoN++, chance = p => Math.random() < p;
            const add = f => { if (f && !m.line.includes(f)) m.line.push(f); };
            if (chance(C.line * .12)) {
                let p;
                do { p = pick(AUTO_PRESET); } while (p === autoLast && AUTO_PRESET.length > 1);
                autoLast = p;
                FX_ALIAS[p].forEach(f => {
                    if (AUTO_HEAVY.includes(f) && (k - autoHeavyAt < C.gap || !chance(C.heavy * 3))) return;
                    if (AUTO_HEAVY.includes(f)) autoHeavyAt = k;
                    if (FX_LINE.has(f)) add(f);
                    else m.line.push(f);
                });
                return m;
            }
            if (chance(C.line)) add(pick(AUTO_COL));
            if (chance(C.line * .6)) add(pick(AUTO_STYLE));
            if (chance(C.line * .35)) add(pick(AUTO_MOTION));
            if (chance(C.line * .2)) add(pick(['big', 'small']));
            if (chance(C.inP)) add(pick(AUTO_IN));
            if (chance(C.outP)) add(pick(AUTO_OUT));
            if (chance(C.line * .3)) add(pick(AUTO_SOFT));
            if (C.heavy && k - autoHeavyAt >= C.gap && chance(C.heavy)) {
                add(pick(AUTO_HEAVY));
                autoHeavyAt = k;
            }
            if (m.words.length > 1 && chance(C.word)) {
                const n = m.words.length > 5 && chance(.35) ? 2 : 1;
                for (let i = 0; i < n; i++) {
                    const w = pick(m.words);
                    if (!w.fx.length) w.fx.push(pick(AUTO_WORD), ...(chance(.4) ? [pick(AUTO_COL)] : []));
                }
            }
            if (!m.line.length && !m.words.some(x => x.fx.length)) add(pick(AUTO_COL));
            return m;
        };

        const splitFx = s => s.split(/[\s,]+/).map(x => x.trim().toLowerCase()).filter(Boolean).flatMap(x => FX_ALIAS[x] || [x]);

        const markup = raw => {
            let s = raw.trim(), line = [];
            const lm = s.match(/^\{([^}]*)\}\s*/);
            if (lm) {
                line = splitFx(lm[1]);
                s = s.slice(lm[0].length);
            }
            const words = [];
            const re = /<([^>]+)>\{([^}]*)\}|(\S+?)\{([^}]*)\}|(\S+)/g;
            let m;
            while ((m = re.exec(s))) {
                if (m[1] !== undefined) {
                    const fx = splitFx(m[2]);
                    m[1].trim().split(/\s+/).forEach(w => words.push({ w, fx: fx.slice() }));
                } else if (m[3] !== undefined) words.push({ w: m[3], fx: splitFx(m[4]) });
                else words.push({ w: m[5], fx: [] });
            }
            words.forEach(x => {
                x.fx = x.fx.filter(f => {
                    if (!FX_LINE.has(f)) return true;
                    if (!line.includes(f)) line.push(f);
                    return false;
                });
            });
            return { line, words, plain: words.map(x => x.w).join(' ') };
        };

        const parse = text => {
            const out = [];
            let timed = false, offset = 0;
            const off = text.match(/\[offset:\s*([+-]?\d+)\]/i);
            if (off) offset = +off[1] / 1000;
            text.split(/\r?\n/).forEach(raw => {
                if (/^\s*(#|\/\/)/.test(raw)) return;
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
            const w = list.map(l => markup(l.text).plain.length + 10);
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
            const r = await fetch('https://lrclib.net/api/search?track_name=' + encodeURIComponent(TRACK.title));
            if (!r.ok) throw 0;
            const names = TRACK.artist.toLowerCase().split(/\s*,\s*/);
            const list = (await r.json()).filter(x => names.some(n => (x.artistName || '').toLowerCase().includes(n)));
            const dur = await whenDuration();
            const hit = list.find(x => x.syncedLyrics && Math.abs(x.duration - dur) < 6) || list.find(x => x.plainLyrics);
            if (!hit) throw 0;
            return hit.syncedLyrics || hit.plainLyrics;
        };

        const whenDuration = () => new Promise(res => {
            if (audio.el.duration) return res(audio.el.duration);
            audio.el.addEventListener('loadedmetadata', () => res(audio.el.duration), { once: true });
        });

        const load = async () => {
            let res = null;
            for (const src of [() => fetchText('lyrics.lrc'), () => fetchText('lyrics.txt'), fromLrclib]) {
                try {
                    const text = await src();
                    if (!text || !text.trim()) continue;
                    const dir = text.match(/^\s*(?:#|\/\/)\s*auto\s*[:=]\s*(off|low|mid|high)\b/im);
                    if (dir && !autoParam.has('auto') && !autoParam.has('noauto')) autoLevel = dir[1].toLowerCase();
                    const r = parse(text);
                    if (r.lines.length) {
                        res = r;
                        break;
                    }
                } catch {}
            }
            if (!res) return;
            lines = res.timed ? res.lines : spread(res.lines, await whenDuration());
            lines.forEach((l, k) => {
                const next = lines[k + 1];
                l.end = next ? next.t : l.t + 4;
            });
            if (syncMode) initSync(res.lines.map(l => l.text).filter(Boolean));
        };

        const build = m => {
            const box = document.createElement('div');
            box.className = 'ly';
            const b = document.createElement('div');
            b.className = 'ly-b';
            const words = [], chars = [], meta = [];
            m.words.forEach(({ w, fx }) => {
                const ws = document.createElement('span');
                ws.className = 'ly-w';
                ws.dataset.t = w;
                const wc = [];
                [...w].forEach((ch, i) => {
                    const cs = document.createElement('span');
                    cs.className = 'ly-c';
                    cs.textContent = ch;
                    cs.style.setProperty('--i', i);
                    ws.appendChild(cs);
                    wc.push(cs);
                    chars.push(cs);
                });
                b.appendChild(ws);
                words.push(ws);
                meta.push({ el: ws, chars: wc, fx });
            });
            box.appendChild(b);
            return { box, b, words, chars, meta };
        };

        const applyFx = (el, list) => {
            list.forEach(f => {
                const hex = f.match(/^#([0-9a-f]{6})$/);
                if (hex) {
                    const v = parseInt(hex[1], 16);
                    el.style.setProperty('--lc', `${v >> 16},${(v >> 8) & 255},${v & 255}`);
                    el.classList.add('fx-col');
                } else if (FX_COLORS[f]) {
                    el.style.setProperty('--lc', FX_COLORS[f]);
                    el.classList.add('fx-col');
                } else if (FX_CSS.has(f)) el.classList.add('fx-' + f);
                else if (f === 'hot') el.classList.add('hot');
                else if (FX_SIZE[f] && el.classList.contains('ly-w')) el.style.fontSize = FX_SIZE[f] + 'em';
            });
        };

        const ease = 'cubic-bezier(.22,1,.36,1)';
        const spring = 'cubic-bezier(.34,1.56,.64,1)';

        const enter = (type, n, dir) => {
            const { b, chars, words } = n;
            const each = (units, total, frames, dur) => {
                const step = units.length > 1 ? total / (units.length - 1) : 0;
                units.forEach((u, k) => u.animate(frames, { duration: dur, delay: k * step, easing: ease, fill: 'backwards' }));
            };
            if (type === 'up') each(words, 360, [{ opacity: 0, transform: 'translateY(.6em)' }, { opacity: 1, transform: 'none' }], 700);
            else if (type === 'side') b.animate([{ opacity: 0, transform: `translateX(${dir * -8}vw)`, filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 900, easing: ease, fill: 'backwards' });
            else if (type === 'flip') each(chars, 420, [{ opacity: 0, transform: 'rotateX(80deg)' }, { opacity: 1, transform: 'none' }], 520);
            else if (type === 'blur') b.animate([{ opacity: 0, filter: 'blur(14px)', transform: 'scale(.94)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], { duration: 900, easing: ease, fill: 'backwards' });
            else each(chars, 500, [{ opacity: 0 }, { opacity: 1 }], 160);
        };

        const scramble = (cs, delay) => {
            const orig = cs.map(c => c.textContent);
            const t0 = performance.now() + delay, dur = 380 + cs.length * 45;
            const step = now => {
                const p = (now - t0) / dur;
                cs.forEach((c, i) => { c.textContent = p * cs.length > i + .5 ? orig[i] : pick(GLYPHS); });
                if (p < 1 && cs[0].isConnected) requestAnimationFrame(step);
                else cs.forEach((c, i) => { c.textContent = orig[i]; });
            };
            requestAnimationFrame(step);
        };

        const shakeScreen = p => {
            const k = [];
            for (let i = 0; i < 8; i++) k.push({ translate: `${(rand(-8, 8) * p).toFixed(1)}px ${(rand(-6, 6) * p).toFixed(1)}px` });
            k.push({ translate: '0 0' });
            [$('#deck'), lyricsLayer, bgEl].forEach(el => el && el.animate(k, { duration: 380, easing: 'linear' }));
        };

        const flash = lc => {
            const f = document.createElement('div');
            f.className = 'fx-flash';
            f.style.background = `rgba(${lc || '255,255,255'},.5)`;
            document.body.appendChild(f);
            f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-out' }).onfinish = () => f.remove();
        };

        const reveal = (kind, x, k, ci, life) => {
            const el = x.el, cs = x.chars, d = k * 90;
            const o = (frames, dur, delay = d, easing = ease) => el.animate(frames, { duration: dur, delay, easing, fill: 'backwards' });
            if (kind === 'type') cs.forEach((c, i) => c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: (ci + i) * 55, fill: 'backwards' }));
            else if (kind === 'scramble') scramble(cs, d);
            else if (kind === 'drop') o([{ opacity: 0, transform: 'translateY(-1.4em)' }, { opacity: 1, transform: 'translateY(.08em)', offset: .7 }, { opacity: 1, transform: 'none' }], 650, d, spring);
            else if (kind === 'rise') o([{ opacity: 0, transform: 'translateY(1em)' }, { opacity: 1, transform: 'none' }], 700);
            else if (kind === 'pop') o([{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1.25)', offset: .6 }, { opacity: 1, transform: 'scale(1)' }], 520);
            else if (kind === 'fade') o([{ opacity: 0 }, { opacity: 1 }], 1400);
            else if (kind === 'blurin') o([{ opacity: 0, filter: 'blur(16px)' }, { opacity: 1, filter: 'blur(0)' }], 1000);
            else if (kind === 'stretch') o([{ opacity: 0, transform: 'scaleX(3)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], 700);
            else if (kind === 'fall') cs.forEach((c, i) => c.animate([{ opacity: 0, transform: 'translateY(-2em) rotate(-25deg)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: d + i * 40, easing: spring, fill: 'backwards' }));
            else if (kind === 'slam') {
                o([{ opacity: 0, transform: 'scale(3.2)', filter: 'blur(6px)' }, { opacity: 1, transform: 'scale(.92)', filter: 'blur(0)', offset: .55 }, { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' }], 420);
                setTimeout(() => shakeScreen(.6), d + 230);
            } else if (kind === 'zoomin') o([{ opacity: 0, transform: 'scale(.15)' }, { opacity: 1, transform: 'none' }], 800);
            else if (kind === 'late') o([{ opacity: 0 }, { opacity: 0, offset: .85 }, { opacity: 1 }], life * 450, 0, 'linear');
        };

        const OUT = {
            explode: () => [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translate(${rand(-3, 3).toFixed(2)}em, ${rand(-2.5, 2.5).toFixed(2)}em) rotate(${rand(-200, 200).toFixed(0)}deg) scale(${rand(.3, 1.6).toFixed(2)})` }],
            melt: () => [{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: `translateY(${rand(.6, 1.4).toFixed(2)}em) scaleY(${rand(2, 3.5).toFixed(2)})`, filter: 'blur(3px)' }],
            burn: () => [{ opacity: 1, filter: 'blur(0) brightness(1)', transform: 'none' }, { opacity: .9, color: '#ff7a1a', filter: 'blur(1px) brightness(1.6)', transform: 'translateY(-.1em)', offset: .35 }, { opacity: 0, color: '#3a0a00', filter: 'blur(6px) brightness(.4)', transform: 'translateY(-.5em) scale(.9)' }],
            evaporate: () => [{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: `translate(${rand(-.3, .3).toFixed(2)}em, ${rand(-1.8, -1).toFixed(2)}em) scale(1.3)`, filter: 'blur(8px)' }],
            collapse: () => [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(${rand(2, 4).toFixed(2)}em) rotate(${rand(-90, 90).toFixed(0)}deg)` }]
        };

        const leave = (item, fast) => {
            if (item.gone) return;
            item.gone = true;
            clearTimeout(item.timer);
            active = active.filter(x => x !== item);
            const n = item.node;
            const ghosts = $$('.fx-echo-g', n.box);
            ghosts.forEach(g => g.animate([{ opacity: .3 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }));
            const lineOut = item.m.line.find(f => FX_OUT.has(f));
            const hasOut = !fast && !reduced && (lineOut || n.meta.some(x => x.fx.some(f => FX_OUT.has(f))));
            if (hasOut) {
                let longest = 0;
                n.meta.forEach(x => {
                    const kind = x.fx.find(f => FX_OUT.has(f)) || lineOut;
                    if (!kind) {
                        x.el.animate([{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(8px)' }], { duration: 700, easing: 'ease-in', fill: 'forwards' });
                        longest = Math.max(longest, 700);
                        return;
                    }
                    x.chars.forEach((c, i) => {
                        const delay = kind === 'melt' || kind === 'evaporate' ? i * 30 : rand(0, 120);
                        c.animate(OUT[kind](), { duration: 900, delay, easing: kind === 'collapse' ? 'cubic-bezier(.55,0,1,.45)' : 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
                        longest = Math.max(longest, 900 + delay);
                    });
                });
                setTimeout(() => n.box.remove(), longest + 80);
                return;
            }
            const anim = n.b.animate([
                { opacity: 1, filter: 'blur(0)', transform: 'none' },
                { opacity: 0, filter: 'blur(8px)', transform: 'translateY(-.3em)' }
            ], { duration: fast ? 400 : 900, easing: 'ease-in', fill: 'forwards' });
            anim.onfinish = () => n.box.remove();
        };

        const fit = (n, maxW, maxH) => {
            let size = parseFloat(n.b.style.fontSize);
            for (let k = 0; k < 8; k++) {
                const r = n.b.getBoundingClientRect();
                if (r.width <= maxW && r.height <= maxH) break;
                size *= Math.min(maxW / r.width, maxH / r.height, .92);
                n.b.style.fontSize = size + 'px';
            }
        };

        const lineFx = (L, n, line, life) => {
            const lc = getComputedStyle(n.b).getPropertyValue('--lc').trim();
            if (L.has('flash')) flash(lc);
            if (L.has('shakescreen')) shakeScreen(1);
            if (L.has('invert')) document.documentElement.animate([{ filter: 'invert(1)' }, { filter: 'invert(0)' }], { duration: 320, easing: 'ease-out' });
            if (L.has('blackout')) {
                const k = [{ opacity: 1 }, { opacity: .08, offset: .12 }, { opacity: .08, offset: .85 }, { opacity: 1 }];
                [$('#deck'), bgEl].forEach(el => el && el.animate(k, { duration: life * 1000, easing: 'ease' }));
            }
            if (L.has('echo')) {
                for (let i = 1; i <= 2; i++) {
                    const g = n.b.cloneNode(true);
                    g.classList.add('fx-echo-g');
                    g.setAttribute('aria-hidden', 'true');
                    g.style.setProperty('--d', i);
                    n.box.insertBefore(g, n.b);
                }
            }
            if (L.has('karaoke')) {
                const span = Number.isFinite(line.t) && Number.isFinite(line.end) ? (line.end - line.t) * 1000 : 2600;
                const dur = clamp(span * .9, 800, life * 900);
                const step = dur / Math.max(1, n.chars.length);
                const to = `rgb(${lc || '255,255,255'})`;
                n.chars.forEach((c, i) => c.animate([{ color: 'rgba(255,255,255,.22)' }, { color: to }], { duration: Math.max(60, step), delay: i * step, fill: 'both' }));
            }
        };

        const spawn = (line, life) => {
            if (!line.text) return;
            const m = line.m || (line.m = autoFx(markup(line.text)));
            if (!m.words.length) return;
            const L = new Set(m.line);
            if (L.has('hold')) life *= 1.7;
            if (L.has('quick')) life *= .55;
            if (L.has('solo')) clear(true);
            const N = rowsCount();
            const slot = row % N;
            row++;
            active.filter(x => x.slot === slot).forEach(x => leave(x, true));
            const mob = innerWidth < 860;
            const top = mob ? 90 : 80, bottom = mob ? 90 : 70;
            const bandH = (innerHeight - top - bottom) / N;
            const n = build(m);
            const center = L.has('center') || L.has('stack');
            const align = center ? 'center' : slot % 2 ? 'right' : 'left';
            const dir = align === 'right' ? -1 : 1;
            n.box.style.top = top + bandH * (slot + .5) + 'px';
            if (center) n.box.style.left = '50%';
            else n.box.style[align] = (mob ? 4 : rand(5, 12)) + 'vw';
            n.box.style.textAlign = align;
            n.box.style.transformOrigin = center ? 'center center' : align + ' center';
            n.b.style.setProperty('--lc', pick(COLORS));
            let mul = 1;
            m.line.forEach(f => { if (FX_SIZE[f]) mul *= FX_SIZE[f]; });
            n.b.style.fontSize = clamp(bandH * .32, 13, mob ? 18 : 38) * mul + 'px';
            applyFx(n.b, m.line.filter(f => f !== 'glitch'));
            if (L.has('glitch')) n.meta.forEach(x => x.el.classList.add('fx-glitch'));
            n.meta.forEach(x => applyFx(x.el, x.fx));
            const custom = m.line.length || m.words.some(x => x.fx.length);
            if (!custom) {
                const st = Math.random();
                if (st > .7) n.b.classList.add('outline');
                else if (st > .58) n.b.classList.add('thin');
                if (n.words.length > 1 && Math.random() < .7) pick(n.words).classList.add('hot');
            }
            const flat = L.has('straight');
            const ry = flat ? 0 : dir * rand(center ? 3 : 8, center ? 8 : 18);
            const rx = flat ? 0 : rand(-6, 6);
            const cx = center ? 'translateX(-50%) ' : '';
            n.box.style.transform = `${cx}translateY(-50%) rotateY(${ry}deg) rotateX(${rx}deg)`;
            lyricsLayer.appendChild(n.box);
            fit(n, innerWidth * (mob ? .88 : center ? .8 : .6), bandH * (L.has('stack') ? 2.6 : mul > 1 ? 1.4 : .9));
            if (!reduced) {
                const dx = center ? 0 : dir * 3;
                n.box.animate([
                    { transform: `${cx}translateY(-50%) translateX(0) rotateY(${ry}deg) rotateX(${rx}deg)` },
                    { transform: `${cx}translateY(-50%) translateX(${dx}vw) rotateY(${ry * .6}deg) rotateX(${rx}deg)` }
                ], { duration: life * 1000 + 900, easing: 'linear', fill: 'forwards' });
                const lineIn = m.line.filter(f => FX_IN.has(f));
                if (lineIn.length || n.meta.some(x => x.fx.some(f => FX_IN.has(f)))) {
                    let ci = 0;
                    n.meta.forEach((x, k) => {
                        const kind = x.fx.find(f => FX_IN.has(f)) || lineIn[0];
                        if (kind) reveal(kind, x, k, ci, life);
                        ci += x.chars.length;
                    });
                } else {
                    let type;
                    do { type = pick(ENTER); } while (type === lastEnter);
                    lastEnter = type;
                    enter(type, n, dir);
                }
                lineFx(L, n, line, life);
            }
            const item = { node: n, slot, m };
            active.push(item);
            item.timer = setTimeout(() => leave(item), life * 1000);
        };

        const clear = fast => { active.slice().forEach(i => leave(i, fast)); row = 0; };

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
                if (now - l.t < 1.2) spawn(l, clamp(l.end - l.t + 4, 4, 9));
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
            const tap = () => {
                if (!audio.isOn()) { notify('сначала включи музыку'); return; }
                if (stamps.length >= texts.length) return;
                stamps.push(audio.el.currentTime);
                spawn({ text: texts[stamps.length - 1] }, 3.5);
                render();
                if (navigator.vibrate) navigator.vibrate(15);
            };
            const undo = () => { stamps.pop(); render(); };
            const reset = () => {
                stamps.length = 0;
                audio.el.currentTime = 0;
                clear(true);
                render();
            };
            const save = () => {
                const out = [`[ti:${TRACK.title}]`, `[ar:${TRACK.artist}]`].concat(stamps.map((t, k) => `[${fmt(t)}]${texts[k]}`)).join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([out], { type: 'text/plain' }));
                a.download = 'lyrics.lrc';
                document.body.appendChild(a);
                a.click();
                a.remove();
                notify('lyrics.lrc скачан');
            };
            const acts = { tap, undo, reset, save };
            panel.querySelectorAll('[data-sync]').forEach(b => {
                b.addEventListener('pointerdown', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    acts[b.dataset.sync]();
                });
                b.addEventListener('click', e => e.stopPropagation());
            });
            ['touchstart', 'touchmove', 'wheel'].forEach(ev => panel.addEventListener(ev, e => e.stopPropagation(), { passive: true }));
            window.addEventListener('keydown', e => {
                if (e.key === 'Enter') { e.preventDefault(); tap(); }
                else if (e.key === 'Backspace') { e.preventDefault(); undo(); }
                else if (e.key === 'r' || e.key === 'к') reset();
                else if (e.key === 's' || e.key === 'ы') save();
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
        if (e.target.closest && (e.target.closest('#player') || e.target.closest('#sync'))) return;
        if (localStorage.getItem('snd') !== '0') audio.set(true);
    };
    window.addEventListener('pointerdown', arm, { once: true, capture: true });
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
