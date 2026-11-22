"""Fast-forward the simple auto-player through the next days' walls: no wall may trap the ball in a loop."""
import json, subprocess, sys, time
from playwright.sync_api import sync_playwright
sys.path.insert(0, "/t")
from smoke_bot import BOT
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8096", "-d", "/site"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
out = {}
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    for d in range(22, 31):
        day = "2026-11-%02d" % d
        pg.goto("http://127.0.0.1:8096/index.html?debug=true&day=" + day); pg.wait_for_timeout(300)
        r = pg.evaluate(BOT, {"steps": 120 * 180})
        out[day] = {k: r[k] for k in ("wall", "bricks", "score")} | {"paddle": r["events"].get("paddle")}
    b.close()
srv.terminate(); print(json.dumps(out, indent=0))
