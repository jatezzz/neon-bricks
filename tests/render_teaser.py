"""Draw the teaser frames straight from the game (no screen recording). Pass A plays the bot run in fast-forward to
find its moments; pass B replays the same run (same seed, clock reset at the same point) and draws 30 frames per second
of video around those moments. Writes /out/frames/f00001.jpg... and /out/segments.json."""
import base64, json, os, subprocess, sys, time
from playwright.sync_api import sync_playwright
SEED, SPEED = 3, 520
os.makedirs("/out/frames", exist_ok=True)
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8093", "-d", "/site"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
BOT = open("/site/tests/autoplayer.js").read()
SETUP = """([seed, speed]) => { game.frame = function () {}; game.time = 0; game.events = [];
    NBBot.install(game, {seed, speed}); window.__step = (k) => { for (let i = 0; i < k; i++) game.update(1/120); }; }"""
def page(b):
    pg = b.new_page(viewport={"width": 560, "height": 1000}, device_scale_factor=2)
    pg.goto("http://127.0.0.1:8093/index.html?lang=es"); pg.wait_for_timeout(600)
    pg.add_script_tag(content=BOT); pg.evaluate(SETUP, [SEED, SPEED]); return pg
with sync_playwright() as p:
    b = p.chromium.launch()
    a = page(b)
    ev = a.evaluate("() => { let n = 0; while (game.state !== 'over' && n < 120 * 900) { game.update(1/120); n++; } return game.events.map(e => ({ev: e.ev, t: e.t, combo: e.combo || 0, kind: e.kind || ''})); }")
    final_a = a.evaluate("game.score"); a.close()
    first = lambda name: next(e["t"] for e in ev if e["ev"] == name)
    lose1 = first("lose"); power1 = first("power"); clear1 = first("clear"); over = first("over")
    SEGS = [(0.0, 3.4, 1), (lose1 + 0.6, 6.0, 2), (power1 - 1.0, 6.0, 2), (clear1 - 1.4, 3.0, 1), (over - 2.2, 3.6, 1)]
    pg = page(b)
    n, vt, out = 0, 0.0, []
    for t0, dur, speed in SEGS:
        pg.evaluate("(t0) => { while (game.time < t0 - 1e-9) game.update(1/120); }", t0)
        frames = int(round(dur / speed * 30))
        seg = {"t0": t0, "dur": dur, "speed": speed, "v0": vt, "frames": frames, "first": n + 1}
        for f in range(frames):
            data = pg.evaluate("(k) => { game.draw(); const d = game.canvas.toDataURL('image/jpeg', 0.9); window.__step(k); return d; }", 4 * speed)
            n += 1
            open(f"/out/frames/f{n:05d}.jpg", "wb").write(base64.b64decode(data.split(",", 1)[1]))
        seg["events"] = [e for e in ev if t0 <= e["t"] < t0 + dur]
        vt += frames / 30; out.append(seg)
    final = pg.evaluate("({score: game.score, wall: game.wall, state: game.state})")
    b.close()
srv.terminate()
json.dump({"segments": out, "final": final, "final_fastforward": final_a, "frames": n}, open("/out/segments.json", "w"), indent=1)
print(n, "frames", final, "fast-forward:", final_a)
