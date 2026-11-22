/*
    Neon Bricks: a brick breaker with one wall of the day, the same for everyone.

    The play field is 400 x 640 logical pixels (portrait, for phones); the canvas is scaled to fit the screen.
    Physics runs at a fixed 120 steps per second, so a run plays the same on a slow phone and a fast laptop.

    Screens: title -> serve (ball on the paddle) -> play -> clear (next wall) ... -> over.
    Pause: Esc or P, the corner button, the page going to the background, or the portal's own pause button.

    Everything daily (the walls, the power-ups, sharing, the score to beat, measurement) comes from js/daily.js.
*/
(function () {
    'use strict';

    var W = 400, H = 640;
    var STEP = 1 / 120;
    var TOP = 52;                       // the play field starts under the score line
    var COLS = 10, BRICK_W = 34, BRICK_H = 16, GAP_X = 4, GAP_Y = 5, FIELD_X = 11, FIELD_Y = 84;
    var PADDLE_Y = 584, PADDLE_H = 12, PADDLE_W = 74, PADDLE_WIDE = 112;
    var BALL_R = 6;
    var LIVES = 3;
    var COLORS = ['#ff00c8', '#ff4fa3', '#b14dff', '#7a6bff', '#00f0ff', '#00ff9c', '#ffdc3c', '#ff8a3c', '#ff00c8', '#00f0ff'];
    var POWERS = {
        wide:  { letter: 'W', color: '#00f0ff', seconds: 12 },
        multi: { letter: 'M', color: '#ff00c8', seconds: 0 },
        slow:  { letter: 'S', color: '#00ff9c', seconds: 8 }
    };

    var I = window.NeonI18n, D = window.NeonDaily;
    function t(key, vars) { return I ? I.t(key, vars) : key; }
    function num(n) { return I ? I.number(n) : String(n); }
    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
    function calm() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

    // ------------------------------------------------------------------------------------------- the wall of the day

    //  Each shape says which cells of a rows x 10 grid hold a brick. Shapes are symmetric, so a wall always looks drawn.
    var SHAPES = [
        { name: 'block',    keep: function () { return true; } },
        { name: 'pyramid',  keep: function (r, c, R) { return Math.abs(c - 4.5) <= 5 - (r * 4.5) / R; } },
        { name: 'valley',   keep: function (r, c, R) { return Math.abs(c - 4.5) >= (R - 1 - r) * 4.5 / R - 0.5; } },
        { name: 'diamond',  keep: function (r, c, R) { return Math.abs(c - 4.5) / 5 + Math.abs(r - (R - 1) / 2) / ((R + 1) / 2) <= 1.05; } },
        { name: 'stripes',  keep: function (r, c) { return r % 2 === 0 || c % 3 === 0 || c % 3 === 1 && r % 4 === 1; } },
        { name: 'checker',  keep: function (r, c) { return (r + c) % 2 === 0 || r === 0; } },
        { name: 'frame',    keep: function (r, c, R) { return r === 0 || r === R - 1 || c <= 1 || c >= 8 || (r === Math.floor(R / 2) && c > 2 && c < 7); } },
        { name: 'columns',  keep: function (r, c) { return c !== 2 && c !== 7 && !(r % 3 === 2 && (c === 4 || c === 5)); } },
        { name: 'arches',   keep: function (r, c, R) { var m = c < 5 ? c : 9 - c; return r < 2 || (m === 0 || m === 4) || (r === R - 1 && m !== 2); } },
        { name: 'random',   keep: null }
    ];
    var MIN_BRICKS = 30;

    function wallRng(n) { return D ? D.rng('wall' + n) : mulberry(n * 7919); }
    function mulberry(seed) {
        var a = seed >>> 0;
        return function () { a = (a + 0x6D2B79F5) >>> 0; var x = Math.imul(a ^ (a >>> 15), a | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    }

    //  Build wall number n of today's challenge: the same bricks, the same hard bricks and the same power-ups for everyone.
    function buildWall(n) {
        var rng = wallRng(n);
        var rows = Math.min(7 + Math.floor((n - 1) / 2), 10);
        var shape = SHAPES[Math.floor(rng() * SHAPES.length)];
        var mask = [], r, c, count = 0;
        var density = 0.62 + rng() * 0.25;
        for (r = 0; r < rows; r++) {
            mask.push([]);
            for (c = 0; c < 5; c++) {
                var on = shape.keep ? shape.keep(r, c, rows) : rng() < density;
                mask[r][c] = on; mask[r][9 - c] = on;
                if (on) { count += 2; }
            }
        }
        if (count < MIN_BRICKS) {                  // too thin to be fun: fall back to a full block
            shape = SHAPES[0]; count = rows * COLS;
            for (r = 0; r < rows; r++) { for (c = 0; c < COLS; c++) { mask[r][c] = true; } }
        }
        //  Hard bricks (two hits): more of them on later walls, mirrored like the shape.
        var hardChance = Math.min(0.08 + 0.07 * (n - 1), 0.45);
        var bricks = [];
        for (r = 0; r < rows; r++) {
            var hardRow = [];
            for (c = 0; c < 5; c++) { hardRow[c] = rng() < hardChance; hardRow[9 - c] = hardRow[c]; }
            for (c = 0; c < COLS; c++) {
                if (!mask[r][c]) { continue; }
                bricks.push({
                    r: r, c: c,
                    x: FIELD_X + c * (BRICK_W + GAP_X), y: FIELD_Y + r * (BRICK_H + GAP_Y), w: BRICK_W, h: BRICK_H,
                    hp: hardRow[c] ? 2 : 1, hard: hardRow[c], power: null,
                    color: COLORS[r % COLORS.length]
                });
            }
        }
        //  Three power-ups hide in ordinary bricks.
        var normal = bricks.filter(function (b) { return !b.hard; });
        var kinds = ['wide', 'multi', 'slow'];
        for (var k = 0; k < 3 && normal.length; k++) {
            var i = Math.floor(rng() * normal.length);
            normal[i].power = kinds[Math.floor(rng() * kinds.length)];
            normal.splice(i, 1);
        }
        return { n: n, shape: shape.name, bricks: bricks };
    }

    // ------------------------------------------------------------------------------------------- sound

    function Sound() {
        this.mute = false;
        try { this.mute = window.localStorage.getItem('nb.mute') === '1'; } catch (err) { /* no storage */ }
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (err) { this.ctx = null; }
    }
    Sound.prototype.tone = function (freq, seconds, type, volume, slideTo, delay) {
        if (this.mute || !this.ctx) { return; }
        try {
            var c = this.ctx, at = c.currentTime + (delay || 0);
            var o = c.createOscillator(), g = c.createGain();
            o.type = type || 'square';
            o.frequency.setValueAtTime(freq, at);
            if (slideTo) { o.frequency.exponentialRampToValueAtTime(slideTo, at + seconds); }
            g.gain.setValueAtTime(volume || 0.08, at);
            g.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
            o.connect(g); g.connect(c.destination);
            o.start(at); o.stop(at + seconds + 0.02);
        } catch (err) { /* sound must never break the game */ }
    };
    Sound.prototype.toggle = function () {
        this.mute = !this.mute;
        try { window.localStorage.setItem('nb.mute', this.mute ? '1' : '0'); } catch (err) { /* no storage */ }
        return this.mute;
    };
    Sound.prototype.unlock = function () { if (this.ctx && this.ctx.state === 'suspended') { this.ctx.resume(); } };

    // ------------------------------------------------------------------------------------------- the game

    function Game(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.sound = new Sound();
        this.events = [];                  // a log of what happened, for tests and for video editing
        this.state = 'title';
        this.paused = false;
        this.keys = {};
        this.pointerX = null;
        this.time = 0;
        this.fx = { shake: 0, mag: 0, flash: 0 };
        this.particles = [];
        this.texts = [];
        this.best = D ? D.todayProgress().best : 0;
        this.streak = D ? D.currentStreak() : 0;
        this.resetRun();
        this.wallData = buildWall(1);
        this.layer = document.createElement('canvas');
        this.layerDirty = true;
        this.resize();
    }

    Game.prototype.log = function (name, extra) {
        var e = { ev: name, at: Date.now(), t: Math.round(this.time * 1000) / 1000, score: this.score };
        if (extra) { for (var k in extra) { e[k] = extra[k]; } }
        this.events.push(e);
        if (this.events.length > 4000) { this.events.shift(); }
    };

    Game.prototype.resetRun = function () {
        this.score = 0;
        this.lives = LIVES;
        this.wall = 1;
        this.combo = 0;
        this.stats = { bricks: 0, maxCombo: 1, powers: 0 };
        this.paddle = { x: W / 2, w: PADDLE_W, wideFor: 0 };
        this.balls = [];
        this.capsules = [];
        this.slowFor = 0;
        this.paddleHits = 0;
        this.goalPassed = false;
        this.clearFor = 0;
        this.reported = -1;
    };

    // ---------------------------------------------------------------- run flow

    Game.prototype.startRun = function () {
        this.resetRun();
        this.wallData = buildWall(1);
        this.layerDirty = true;
        this.particles = []; this.texts = [];
        if (D) { D.onRunStart(); }
        this.log('run');
        this.serve();
    };

    //  Called by the game-over screen's "play again" button.
    Game.prototype.restart = function () {
        if (this.state !== 'over') { return; }
        this.startRun();
    };

    Game.prototype.serve = function () {
        this.state = 'serve';
        this.combo = 0;
        this.balls = [{ x: this.paddle.x, y: PADDLE_Y - BALL_R - 1, vx: 0, vy: 0, stuck: true, trail: [] }];
        this.announce();
    };

    Game.prototype.baseSpeed = function () {
        var s = 330 + 24 * (this.wall - 1) + Math.min(this.paddleHits * 3, 90);
        return Math.min(s, 660) * (this.slowFor > 0 ? 0.65 : 1);
    };

    Game.prototype.launch = function () {
        if (this.state !== 'serve') { return; }
        var b = this.balls[0], s = this.baseSpeed();
        //  A slight angle toward the side the paddle is on, so the first shot is never straight up.
        var a = (this.paddle.x < W / 2 ? 1 : -1) * 0.32;
        b.stuck = false; b.vx = Math.sin(a) * s; b.vy = -Math.cos(a) * s;
        this.state = 'play';
        this.log('launch');
        this.sound.tone(520, 0.08, 'square', 0.06, 780);
        this.announce();
    };

    Game.prototype.loseLife = function () {
        this.lives -= 1;
        this.log('lose', { lives: this.lives });
        this.paddle.wideFor = 0; this.paddle.w = PADDLE_W; this.slowFor = 0;
        this.capsules = [];
        this.impact(6, 0.35, '#ff00c8', [60, 40, 60]);
        this.sound.tone(300, 0.45, 'sawtooth', 0.08, 60);
        if (this.lives <= 0) { this.gameOver(); } else { this.serve(); }
    };

    Game.prototype.gameOver = function () {
        this.state = 'over';
        this.balls = [];
        this.log('over', { wall: this.wall });
        this.announce();
        var share = null, last = null;
        if (D) {
            D.onGameOver(this);
            share = D.shareMessage();
            last = D.lastResult();
            this.best = D.todayProgress().best;
            this.streak = D.currentStreak();
        }
        //  A portal with its own game-over screen gets the result and the text to share.
        if (window.PortalSDK && window.PortalSDK.gameOver) {
            window.PortalSDK.gameOver(this.score, { level: this.wall, share: share, outcome: last && last.outcome,
                headline: last && last.headline, joke: last && last.joke });
        }
    };

    Game.prototype.clearWall = function () {
        var bonus = 250 * this.wall;
        this.addScore(bonus);
        this.log('clear', { wall: this.wall, bonus: bonus });
        this.texts.push({ x: W / 2, y: 330, text: t('wall.clear', { n: this.wall }), sub: t('wall.bonus', { p: num(bonus) }), life: 1.8, max: 1.8, big: true, color: '#00ff9c' });
        this.sound.tone(523, 0.12, 'square', 0.07); this.sound.tone(659, 0.12, 'square', 0.07, null, 0.12);
        this.sound.tone(784, 0.12, 'square', 0.07, null, 0.24); this.sound.tone(1047, 0.3, 'square', 0.07, null, 0.36);
        this.state = 'clear';
        this.clearFor = 1.8;
        this.balls = []; this.capsules = [];
        this.announce();
    };

    Game.prototype.nextWall = function () {
        this.wall += 1;
        this.wallData = buildWall(this.wall);
        this.layerDirty = true;
        this.paddle.wideFor = 0; this.paddle.w = PADDLE_W; this.slowFor = 0;
        this.paddleHits = 0;
        this.log('wall', { wall: this.wall, shape: this.wallData.shape });
        this.serve();
    };

    Game.prototype.addScore = function (points) {
        this.score += points;
        var goal = D && D.target;
        if (goal && !this.goalPassed && this.score > goal.score) {
            this.goalPassed = true;
            this.log('goal');
            this.texts.push({ x: W / 2, y: 400, text: t('target.passed', { t: num(goal.score) }), life: 1.6, max: 1.6, big: true, color: '#ffdc3c' });
            this.sound.tone(880, 0.25, 'triangle', 0.08, 1320);
        }
    };

    // ---------------------------------------------------------------- pause

    Game.prototype.announce = function () {
        try { document.body.setAttribute('data-state', this.paused ? 'paused' : this.state); } catch (err) { /* no page */ }
    };
    Game.prototype.pause = function () {
        if (this.paused || (this.state !== 'play' && this.state !== 'serve')) { return false; }
        this.paused = true; this.keys = {};
        this.log('pause');
        this.announce();
        return true;
    };
    Game.prototype.resume = function () {
        if (!this.paused) { return false; }
        this.paused = false; this.last = null;          // no time passes while paused
        this.log('resume');
        this.announce();
        return true;
    };
    //  A portal that embeds the game has its own pause button and screen: ask it, and it answers with PAUSE or RESUME.
    Game.prototype.requestPause = function (paused) {
        var sdk = window.PortalSDK;
        if (sdk && sdk.pause && sdk.resume) { if (paused) { sdk.pause(); } else { sdk.resume(); } }
        return paused ? this.pause() : this.resume();
    };

    // ---------------------------------------------------------------- input

    //  The main action: start a run, launch the ball, resume, or play again.
    Game.prototype.action = function () {
        this.sound.unlock();
        if (this.paused) { this.requestPause(false); return; }
        if (this.state === 'title') { this.startRun(); return; }
        if (this.state === 'serve') { this.launch(); return; }
        //  After a run: a tap on the game plays again only when no game-over card covers it (inside a portal the portal
        //  shows its own); the card's buttons do it otherwise. Space plays again in both cases.
        if (this.state === 'over' && !(D && D.locked()) && !overlayShown()) { this.startRun(); }
    };

    function overlayShown() { var o = document.getElementById('gameover'); return !!(o && !o.hidden); }

    Game.prototype.keyDown = function (code) {
        if (code === 27 || code === 80) { this.requestPause(!this.paused); return; }
        if (code === 32 || code === 13) {
            if (this.state === 'over') { if (!(D && D.locked())) { this.startRun(); } return; }
            this.action(); return;
        }
        this.keys[code] = true;
        this.pointerX = null;              // the keyboard takes over from the mouse
    };
    Game.prototype.keyUp = function (code) { delete this.keys[code]; };

    //  Pointer position in play-field units.
    Game.prototype.fieldX = function (clientX) {
        var r = this.canvas.getBoundingClientRect();
        return (clientX - r.left) * W / r.width;
    };
    Game.prototype.pointTo = function (clientX) { this.pointerX = this.fieldX(clientX); };

    // ---------------------------------------------------------------- the simulation

    Game.prototype.update = function (dt) {
        this.time += dt;
        var p = this.paddle;
        //  Paddle: follows the finger or the mouse; the arrow keys move it at a steady speed.
        var half = p.w / 2;
        if (this.keys[37] || this.keys[65]) { p.x -= 560 * dt; }
        if (this.keys[39] || this.keys[68]) { p.x += 560 * dt; }
        if (this.pointerX !== null) { p.x += (this.pointerX - p.x) * Math.min(1, dt * 40); }
        p.x = clamp(p.x, half, W - half);
        if (p.wideFor > 0) { p.wideFor -= dt; p.w = p.wideFor > 0 ? PADDLE_WIDE : PADDLE_W; }
        if (this.slowFor > 0) { this.slowFor -= dt; if (this.slowFor <= 0) { this.setSpeeds(); } }

        if (this.state === 'clear') {
            this.clearFor -= dt;
            if (this.clearFor <= 0) { this.nextWall(); }
        }
        if (this.state === 'serve') {
            var b0 = this.balls[0];
            b0.x = clamp(p.x + p.w * 0.18, BALL_R, W - BALL_R); b0.y = PADDLE_Y - BALL_R - 1;
        }
        if (this.state === 'play') {
            this.moveBalls(dt);
            this.moveCapsules(dt);
            if (this.state === 'play' && this.balls.length === 0) { this.loseLife(); }
        }
        this.updateEffects(dt);
        if (window.PortalSDK && window.PortalSDK.reportScore && this.score !== this.reported && this.state !== 'title') {
            this.reported = this.score;
            window.PortalSDK.reportScore(this.score);
        }
    };

    //  After a speed change (slow motion on or off), every ball keeps its direction at the new speed.
    Game.prototype.setSpeeds = function () {
        var s = this.baseSpeed();
        this.balls.forEach(function (b) {
            var v = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
            b.vx = b.vx / v * s; b.vy = b.vy / v * s;
        });
    };

    //  Never let a ball crawl almost sideways: at least 30 % of its speed goes up or down.
    function steepen(b) {
        var s = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (Math.abs(b.vy) < s * 0.3) {
            b.vy = (b.vy < 0 ? -1 : 1) * s * 0.3;
            b.vx = (b.vx < 0 ? -1 : 1) * Math.sqrt(s * s - b.vy * b.vy);
        }
    }

    Game.prototype.moveBalls = function (dt) {
        var p = this.paddle, bricks = this.wallData.bricks;
        for (var i = this.balls.length - 1; i >= 0; i--) {
            var b = this.balls[i];
            var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            var n = Math.max(1, Math.ceil(speed * dt / (BALL_R * 0.5)));
            var h = dt / n;
            for (var s = 0; s < n; s++) {
                b.x += b.vx * h; b.y += b.vy * h;
                //  Side walls and ceiling.
                if (b.x < BALL_R) { b.x = BALL_R; b.vx = Math.abs(b.vx); this.bounce(); }
                if (b.x > W - BALL_R) { b.x = W - BALL_R; b.vx = -Math.abs(b.vx); this.bounce(); }
                if (b.y < TOP + BALL_R) { b.y = TOP + BALL_R; b.vy = Math.abs(b.vy); this.bounce(); }
                //  Paddle: where the ball lands on it sets the angle (the middle sends it up, the edges send it wide).
                if (b.vy > 0 && b.y + BALL_R >= PADDLE_Y && b.y - b.vy * h + BALL_R <= PADDLE_Y + 2 &&
                    b.x >= p.x - p.w / 2 - BALL_R && b.x <= p.x + p.w / 2 + BALL_R) {
                    var u = clamp((b.x - p.x) / (p.w / 2 + BALL_R), -1, 1);
                    var a = u * 1.05;                      // up to 60 degrees from vertical
                    this.paddleHits += 1;
                    var sp = this.baseSpeed();
                    b.vx = Math.sin(a) * sp; b.vy = -Math.cos(a) * sp;
                    b.y = PADDLE_Y - BALL_R;
                    this.combo = 0;
                    this.log('paddle', { u: Math.round(u * 100) / 100 });
                    this.sound.tone(240, 0.06, 'square', 0.07, 320);
                    try { if (navigator.vibrate) { navigator.vibrate(8); } } catch (err) { /* not allowed */ }
                }
                //  Bricks: the first one the ball overlaps; the shallower overlap says which side it hit.
                for (var k = 0; k < bricks.length; k++) {
                    var br = bricks[k];
                    if (b.x + BALL_R < br.x || b.x - BALL_R > br.x + br.w || b.y + BALL_R < br.y || b.y - BALL_R > br.y + br.h) { continue; }
                    var ox = Math.min(b.x + BALL_R - br.x, br.x + br.w - (b.x - BALL_R));
                    var oy = Math.min(b.y + BALL_R - br.y, br.y + br.h - (b.y - BALL_R));
                    if (ox < oy) {
                        b.vx = b.x < br.x + br.w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx);
                        b.x += b.vx < 0 ? -ox : ox;
                    } else {
                        b.vy = b.y < br.y + br.h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy);
                        b.y += b.vy < 0 ? -oy : oy;
                    }
                    steepen(b);
                    this.hitBrick(br, k);
                    break;
                }
                if (this.state !== 'play') { return; }
            }
            b.trail.push({ x: b.x, y: b.y });
            if (b.trail.length > 7) { b.trail.shift(); }
            if (b.y - BALL_R > H) { this.balls.splice(i, 1); this.log('ball_out', { left: this.balls.length }); }
        }
    };

    Game.prototype.bounce = function () { this.sound.tone(180, 0.03, 'square', 0.03); };

    Game.prototype.hitBrick = function (br, index) {
        br.hp -= 1;
        this.layerDirty = true;
        if (br.hp > 0) {                   // a hard brick cracks first
            this.addScore(5);
            this.burst(br.x + br.w / 2, br.y + br.h / 2, '#ffffff', 5);
            this.sound.tone(150, 0.06, 'square', 0.07);
            this.log('crack');
            return;
        }
        this.combo += 1;
        var mult = Math.min(1 + Math.floor((this.combo - 1) / 3), 5);
        if (mult > this.stats.maxCombo) { this.stats.maxCombo = mult; }
        var base = br.hard ? 25 : 10;
        var points = base * mult;
        this.addScore(points);
        this.stats.bricks += 1;
        this.wallData.bricks.splice(index, 1);
        this.burst(br.x + br.w / 2, br.y + br.h / 2, br.color, 12);
        this.texts.push({ x: br.x + br.w / 2, y: br.y, text: '+' + points + (mult > 1 ? ' ×' + mult : ''), life: 0.7, max: 0.7, color: mult > 1 ? '#ffdc3c' : '#ffffff' });
        this.impact(mult > 1 ? 2.5 : 1.5, 0.08);
        this.sound.tone(440 * Math.pow(2, Math.min(this.combo - 1, 15) / 12), 0.07, 'square', 0.06);
        this.log('brick', { combo: this.combo, mult: mult, points: points, hard: br.hard });
        if (br.power) {
            this.capsules.push({ x: br.x + br.w / 2, y: br.y + br.h / 2, kind: br.power });
            this.log('capsule', { kind: br.power });
        }
        if (this.wallData.bricks.length === 0) { this.clearWall(); }
    };

    Game.prototype.moveCapsules = function (dt) {
        var p = this.paddle;
        for (var i = this.capsules.length - 1; i >= 0; i--) {
            var c = this.capsules[i];
            c.y += 150 * dt;
            if (c.y + 7 >= PADDLE_Y && c.y - 7 <= PADDLE_Y + PADDLE_H && Math.abs(c.x - p.x) <= p.w / 2 + 14) {
                this.capsules.splice(i, 1);
                this.power(c.kind);
            } else if (c.y > H + 10) {
                this.capsules.splice(i, 1);
            }
        }
    };

    Game.prototype.power = function (kind) {
        this.stats.powers += 1;
        this.log('power', { kind: kind });
        this.texts.push({ x: this.paddle.x, y: PADDLE_Y - 30, text: t('power.' + kind), life: 1.1, max: 1.1, color: POWERS[kind].color });
        this.sound.tone(400, 0.2, 'triangle', 0.08, 1200);
        if (kind === 'wide') { this.paddle.wideFor = POWERS.wide.seconds; this.paddle.w = PADDLE_WIDE; }
        if (kind === 'slow') { this.slowFor = POWERS.slow.seconds; this.setSpeeds(); }
        if (kind === 'multi' && this.balls.length) {
            var b = this.balls[0], s = Math.sqrt(b.vx * b.vx + b.vy * b.vy), a = Math.atan2(b.vx, -b.vy);
            for (var k = -1; k <= 1; k += 2) {
                var na = a + k * 0.45;
                var nb = { x: b.x, y: b.y, vx: Math.sin(na) * s, vy: -Math.cos(na) * s, stuck: false, trail: [] };
                steepen(nb);
                this.balls.push(nb);
            }
        }
    };

    // ---------------------------------------------------------------- effects

    Game.prototype.impact = function (magnitude, seconds, flashColor, vibrate) {
        if (!calm()) { this.fx.shake = seconds; this.fx.mag = magnitude; if (flashColor) { this.fx.flash = 0.2; this.fx.flashColor = flashColor; } }
        try { if (vibrate && navigator.vibrate) { navigator.vibrate(vibrate); } } catch (err) { /* not allowed */ }
    };

    Game.prototype.burst = function (x, y, color, count) {
        for (var i = 0; i < count && this.particles.length < 320; i++) {
            var a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 160;
            this.particles.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: 0.5 + Math.random() * 0.3, color: color });
        }
    };

    Game.prototype.updateEffects = function (dt) {
        if (this.fx.shake > 0) { this.fx.shake -= dt; }
        if (this.fx.flash > 0) { this.fx.flash -= dt; }
        for (var i = this.particles.length - 1; i >= 0; i--) {
            var q = this.particles[i];
            q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 420 * dt; q.life -= dt;
            if (q.life <= 0) { this.particles.splice(i, 1); }
        }
        for (var j = this.texts.length - 1; j >= 0; j--) {
            var tx = this.texts[j];
            tx.life -= dt; if (!tx.big) { tx.y -= 30 * dt; }
            if (tx.life <= 0) { this.texts.splice(j, 1); }
        }
    };

    // ---------------------------------------------------------------- drawing

    Game.prototype.resize = function () {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var r = this.canvas.getBoundingClientRect();
        var cssW = r.width || W;
        this.scale = cssW / W;
        this.canvas.width = Math.round(cssW * dpr);
        this.canvas.height = Math.round(cssW * H / W * dpr);
        this.ratio = this.canvas.width / W;
        this.layerDirty = true;
    };

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    //  The bricks are drawn once into a layer and only redrawn when one changes: glow is expensive on phones.
    Game.prototype.drawLayer = function () {
        var L = this.layer;
        L.width = this.canvas.width; L.height = this.canvas.height;
        var c = L.getContext('2d');
        c.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
        c.clearRect(0, 0, W, H);
        this.wallData.bricks.forEach(function (b) {
            c.save();
            c.shadowColor = b.color; c.shadowBlur = b.hard ? 12 : 8;
            c.fillStyle = b.color;
            c.globalAlpha = b.hard && b.hp === 1 ? 0.55 : 0.92;
            roundRect(c, b.x, b.y, b.w, b.h, 3); c.fill();
            c.shadowBlur = 0; c.globalAlpha = 1;
            if (b.hard) {
                c.strokeStyle = '#ffffff'; c.lineWidth = 2;
                roundRect(c, b.x + 2, b.y + 2, b.w - 4, b.h - 4, 2); c.stroke();
                if (b.hp === 1) {          // cracked
                    c.beginPath(); c.moveTo(b.x + 8, b.y + 3); c.lineTo(b.x + 15, b.y + 9); c.lineTo(b.x + 12, b.y + 13);
                    c.moveTo(b.x + 15, b.y + 9); c.lineTo(b.x + 25, b.y + 6); c.stroke();
                }
            } else {
                c.fillStyle = 'rgba(255,255,255,0.35)';
                c.fillRect(b.x + 3, b.y + 2, b.w - 6, 3);
            }
            if (b.power) {
                c.fillStyle = '#05060f'; c.font = 'bold 11px Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
                c.fillText('✦', b.x + b.w / 2, b.y + b.h / 2 + 1);
            }
            c.restore();
        });
        this.layerDirty = false;
    };

    Game.prototype.draw = function () {
        var ctx = this.ctx;
        if (this.layerDirty) { this.drawLayer(); }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
        //  Background: deep blue with a faint synthwave grid.
        var g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#05060f'); g.addColorStop(1, '#140a2a');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(177,77,255,0.10)'; ctx.lineWidth = 1;
        for (var gx = 0; gx <= W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, TOP); ctx.lineTo(gx, H); ctx.stroke(); }
        for (var gy = TOP; gy <= H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

        ctx.save();
        if (this.fx.shake > 0 && !this.paused) {
            ctx.translate((Math.random() - 0.5) * this.fx.mag * 2, (Math.random() - 0.5) * this.fx.mag * 2);
        }
        if (this.state !== 'title') {
            ctx.drawImage(this.layer, 0, 0, this.layer.width / this.ratio, this.layer.height / this.ratio);
            this.drawPlay(ctx);
        } else {
            ctx.globalAlpha = 0.35;
            ctx.drawImage(this.layer, 0, 0, this.layer.width / this.ratio, this.layer.height / this.ratio);
            ctx.globalAlpha = 1;
        }
        ctx.restore();

        this.drawHud(ctx);
        if (this.fx.flash > 0) { ctx.fillStyle = this.fx.flashColor; ctx.globalAlpha = Math.min(0.35, this.fx.flash); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
        if (this.state === 'title') { this.drawTitle(ctx); }
        if (this.state === 'serve' && !this.paused) { this.center(ctx, t(this.touch ? 'launch.touch' : 'launch.desktop'), 470, 15, '#b0b0c0'); }
        if (this.paused) { this.drawPause(ctx); }
    };

    Game.prototype.drawPlay = function (ctx) {
        var p = this.paddle, i;
        //  Capsules.
        this.capsules.forEach(function (c) {
            var pw = POWERS[c.kind];
            ctx.save(); ctx.shadowColor = pw.color; ctx.shadowBlur = 10; ctx.fillStyle = pw.color;
            roundRect(ctx, c.x - 14, c.y - 7, 28, 14, 7); ctx.fill();
            ctx.shadowBlur = 0; ctx.fillStyle = '#05060f'; ctx.font = 'bold 11px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(pw.letter, c.x, c.y + 1); ctx.restore();
        });
        //  Paddle.
        ctx.save();
        ctx.shadowColor = p.wideFor > 0 ? '#00f0ff' : '#ff00c8'; ctx.shadowBlur = 16;
        ctx.fillStyle = p.wideFor > 0 ? '#00f0ff' : '#ff00c8';
        roundRect(ctx, p.x - p.w / 2, PADDLE_Y, p.w, PADDLE_H, 6); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(p.x - p.w / 2 + 6, PADDLE_Y + 2, p.w - 12, 2);
        ctx.restore();
        //  Balls with a short trail.
        for (i = 0; i < this.balls.length; i++) {
            var b = this.balls[i];
            for (var k = 0; k < b.trail.length; k++) {
                ctx.globalAlpha = (k + 1) / b.trail.length * 0.35;
                ctx.fillStyle = this.slowFor > 0 ? '#00ff9c' : '#00f0ff';
                ctx.beginPath(); ctx.arc(b.trail[k].x, b.trail[k].y, BALL_R * (0.5 + k / b.trail.length * 0.5), 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = 1;
            ctx.save(); ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 14; ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
        //  Particles and floating texts.
        for (i = 0; i < this.particles.length; i++) {
            var q = this.particles[i];
            ctx.globalAlpha = Math.max(0, Math.min(1, q.life * 2)); ctx.fillStyle = q.color;
            ctx.fillRect(q.x - 2, q.y - 2, 4, 4);
        }
        ctx.globalAlpha = 1;
        for (i = 0; i < this.texts.length; i++) {
            var tx = this.texts[i];
            ctx.globalAlpha = Math.min(1, tx.life / tx.max * 2);
            this.center(ctx, tx.text, tx.y, tx.big ? 26 : 13, tx.color, true);
            if (tx.sub) { this.center(ctx, tx.sub, tx.y + 30, 16, '#ffffff'); }
        }
        ctx.globalAlpha = 1;
    };

    Game.prototype.center = function (ctx, text, y, size, color, glow) {
        ctx.save();
        ctx.font = 'bold ' + size + 'px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
        ctx.fillStyle = color; ctx.fillText(text, W / 2, y);
        ctx.restore();
    };

    Game.prototype.drawHud = function (ctx) {
        ctx.fillStyle = 'rgba(5,6,15,0.85)'; ctx.fillRect(0, 0, W, TOP);
        ctx.strokeStyle = '#00f0ff'; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(0, TOP - 0.5); ctx.lineTo(W, TOP - 0.5); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.font = 'bold 22px Arial, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff'; ctx.fillText(num(this.score), 12, 20);
        var goal = D && D.target;
        if (goal) {
            ctx.font = 'bold 12px Arial, sans-serif';
            ctx.fillStyle = this.goalPassed ? '#00ff9c' : '#ffdc3c';
            ctx.fillText(t('target.hud', { t: num(goal.score) }) + (this.goalPassed ? ' ✓' : ''), 12, 41);
        }
        ctx.textAlign = 'center'; ctx.font = 'bold 14px Arial, sans-serif'; ctx.fillStyle = '#00f0ff';
        ctx.fillText(t('hud.wall', { n: this.wall }), W / 2 - 10, 20);
        //  Lives as small balls, right of the wall number, left of the pause button.
        for (var i = 0; i < LIVES; i++) {
            ctx.globalAlpha = i < this.lives ? 1 : 0.2;
            ctx.fillStyle = '#ff00c8'; ctx.beginPath(); ctx.arc(W - 120 + i * 16, 20, 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    };

    Game.prototype.drawTitle = function (ctx) {
        ctx.fillStyle = 'rgba(5,6,15,0.55)'; ctx.fillRect(0, TOP, W, H - TOP);
        this.center(ctx, 'NEON', 170, 54, '#ff00c8', true);
        this.center(ctx, 'BRICKS', 225, 54, '#00f0ff', true);
        if (D) {
            var day = D.today();
            this.center(ctx, t(D.otherDay() ? 'title.shared' : 'title.daily', { n: D.challengeNumber(), date: I.shortDate(day) }), 285, 16, '#ffffff');
            var goal = D.target;
            if (goal) {
                this.center(ctx, t(goal.by === 'bot' ? 'target.title.bot' : 'target.title.player', { t: num(goal.score) }), 330, 18, '#ffdc3c', true);
                this.center(ctx, t(goal.verified ? 'target.verified' : 'target.declared'), 354, 12, goal.verified ? '#00ff9c' : '#b0b0c0');
            }
            if (this.best || this.streak) {
                this.center(ctx, t('title.status', { best: num(this.best), streak: this.streak }), 390, 13, '#b0b0c0');
            }
            if (!D.onPortal) { this.center(ctx, t('title.more', { host: D.CONFIG.portalHost }), 600, 12, '#00ff9c'); }
        }
        ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(this.time * 3));
        this.center(ctx, t(this.touch ? 'title.start.touch' : 'title.start.desktop'), 450, 18, '#ffffff', true);
        ctx.globalAlpha = 1;
    };

    Game.prototype.drawPause = function (ctx) {
        ctx.fillStyle = 'rgba(5,6,15,0.6)'; ctx.fillRect(0, TOP, W, H - TOP);
        this.center(ctx, t('paused'), 300, 34, '#ffffff', true);
        this.center(ctx, t(this.touch ? 'paused.hint.touch' : 'paused.hint'), 340, 14, '#b0b0c0');
    };

    // ---------------------------------------------------------------- the loop

    Game.prototype.frame = function (now) {
        var self = this;
        if (this.last == null) { this.last = now; }
        var elapsed = Math.min((now - this.last) / 1000, 0.1);
        this.last = now;
        if (!this.paused) {
            this.acc = (this.acc || 0) + elapsed;
            while (this.acc >= STEP) { this.update(STEP); this.acc -= STEP; }
        } else {
            this.time += elapsed;
        }
        this.draw();
        window.requestAnimationFrame(function (n) { self.frame(n); });
    };

    Game.prototype.start = function () {
        var self = this;
        if (window.PortalSDK && window.PortalSDK.on) {
            window.PortalSDK.on('PAUSE', function () { self.pause(); });
            window.PortalSDK.on('RESUME', function () { self.resume(); });
        }
        this.announce();
        window.requestAnimationFrame(function (n) { self.frame(n); });
    };

    window.NeonBricks = { Game: Game, buildWall: buildWall, W: W, H: H, PADDLE_Y: PADDLE_Y };
})();
