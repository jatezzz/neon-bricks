"""One fast-forward bot run: its event log (game time) and final result. Args: day seed speed"""
import json, subprocess, sys, time
from playwright.sync_api import sync_playwright
DAY, SEED, SPEED = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8094", "-d", "/site"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.goto(f"http://127.0.0.1:8094/index.html?debug=true&day={DAY}"); pg.wait_for_timeout(250)
    pg.add_script_tag(content=open("/site/tests/autoplayer.js").read())
    r = pg.evaluate("""([seed, speed]) => { NBBot.install(game, {seed, speed}); let n = 0;
        while (game.state !== 'over' && n < 120 * 900) { game.update(1/120); n++; }
        return {score: game.score, wall: game.wall, steps: n, events: game.events.filter(e => e.ev !== 'paddle' || true).map(e => Object.assign({}, e, {at: undefined}))}; }""", [SEED, SPEED])
    b.close()
srv.terminate()
json.dump(r, open("/out/events.json", "w"))
ev = r["events"]; from collections import Counter
print(r["score"], r["wall"], r["steps"], Counter(e["ev"] for e in ev))
for e in ev:
    if e["ev"] in ("launch", "lose", "clear", "power", "capsule", "wall", "over", "ball_out"): print(e)
