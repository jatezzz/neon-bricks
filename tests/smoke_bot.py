"""The simple auto-player used by the tests (fast-forward, inside the page)."""
BOT = """(args) => {
  const g = window.game, NB = window.NeonBricks, STEP = 1/120;
  const steps = args.steps, miss = args.miss || 0;
  if (g.state === 'title') g.action();
  let n = 0;
  for (; n < steps && g.state !== 'over'; n++) {
    if (g.state === 'serve') g.action();
    // track the lowest ball coming down; aim slightly off-centre to send it at an angle
    let target = null, lowest = -1;
    for (const b of g.balls) { if (b.vy > 0 && b.y > lowest) { lowest = b.y; target = b; } }
    if (target) {
      // predict where it reaches the paddle line, folding the side-wall bounces
      let t = (NB.PADDLE_Y - target.y) / target.vy, x = target.x + target.vx * t;
      const span = NB.W - 12; x = x - 6; x = ((x % (2*span)) + 2*span) % (2*span); x = (x > span ? 2*span - x : x) + 6;
      g.pointerX = miss && (n % 1200 > 1200 - miss) ? (x < 200 ? 390 : 10) : x + (x < 200 ? 14 : -14);
    }
    g.update(STEP);
  }
  return { steps: n, state: g.state, score: g.score, wall: g.wall, lives: g.lives, bricks: g.stats.bricks,
           maxCombo: g.stats.maxCombo, powers: g.stats.powers, left: g.wallData.bricks.length,
           events: g.events.reduce((m, e) => (m[e.ev] = (m[e.ev] || 0) + 1, m), {}) };
}"""
