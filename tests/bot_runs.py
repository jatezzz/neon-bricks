"""Fast-forward the auto-player on one day with several seeds and speeds: score, wall, game time of each run."""
import json, subprocess, sys, time
from playwright.sync_api import sync_playwright
DAY = sys.argv[1] if len(sys.argv) > 1 else "2026-11-22"
SPEEDS = [int(s) for s in (sys.argv[2] if len(sys.argv) > 2 else "420,520,650").split(",")]
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8095", "-d", "/site"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
BOT = open("/site/tests/autoplayer.js").read()
out = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    for speed in SPEEDS:
        for seed in range(1, 6):
            pg.goto(f"http://127.0.0.1:8095/index.html?debug=true&day={DAY}"); pg.wait_for_timeout(250)
            pg.add_script_tag(content=BOT)
            r = pg.evaluate("""([seed, speed]) => { NBBot.install(game, {seed, speed});
                let n = 0; while (game.state !== 'over' && n < 120 * 900) { game.update(1/120); n++; }
                return {seed, speed, score: game.score, wall: game.wall, bricks: game.stats.bricks, combo: game.stats.maxCombo, seconds: Math.round(n / 120), over: game.state === 'over'}; }""", [seed, speed])
            out.append(r); print(json.dumps(r), flush=True)
    b.close()
srv.terminate()
