/*
    The Neon Bricks auto-player ("the bot"). Plays with human-like limits: the paddle moves at most `speed` px/s, it
    starts reacting only when the ball comes down past `sees`, and after every hit it picks a new aim offset from its
    own seeded random numbers. It hooks into game.update, so it makes one decision per physics step: a fast-forward
    run and a real-time (recorded) run with the same seed play exactly the same game.

        NBBot.install(game, { seed: 3, speed: 520 })
*/
(function () {
    'use strict';
    function mulberry(seed) {
        var a = seed >>> 0;
        return function () { a = (a + 0x6D2B79F5) >>> 0; var t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }
    function install(game, opts) {
        var o = Object.assign({ seed: 1, speed: 520, sees: 200, aim: 0.75, serveWait: 0.6 }, opts || {});
        var rng = mulberry(o.seed * 2654435761);
        var NB = window.NeonBricks, W = NB.W, PY = NB.PADDLE_Y;
        var offset = 0, lastHits = -1, waited = 0;
        var orig = game.update;
        game.update = function (dt) {
            var p = this.paddle;
            if (this.state === 'title') { this.action(); }
            if (this.state === 'serve') { waited += dt; if (waited >= o.serveWait) { waited = 0; this.action(); } }
            if (this.paddleHits !== lastHits) { lastHits = this.paddleHits; offset = (rng() * 2 - 1) * o.aim; }
            var target = null, lowest = -1;
            for (var i = 0; i < this.balls.length; i++) {
                var b = this.balls[i];
                if (!b.stuck && b.vy > 0 && b.y > o.sees && b.y > lowest) { lowest = b.y; target = b; }
            }
            var want = p.x;
            if (target) {
                var t = (PY - target.y) / target.vy, x = target.x + target.vx * t;
                var span = W - 12; x -= 6; x = ((x % (2 * span)) + 2 * span) % (2 * span); x = (x > span ? 2 * span - x : x) + 6;
                want = x - offset * p.w / 2;
            } else if (this.capsules.length) {
                want = this.capsules[0].x;                // nothing to save: go for a power-up
            }
            var step = o.speed * dt;
            this.pointerX = p.x + Math.max(-step, Math.min(step, want - p.x));
            orig.call(this, dt);
        };
        game.botOptions = o;
        return game;
    }
    window.NBBot = { install: install };
})();
