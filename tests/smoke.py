"""Smoke test for Neon Bricks: runs in mcr.microsoft.com/playwright/python with the game mounted at /site.

    python3 /t/smoke.py            -> prints a JSON report, screenshots in /out
"""
import json, subprocess, sys, time
from playwright.sync_api import sync_playwright
sys.path.insert(0, "/t")

srv = subprocess.Popen([sys.executable, "-m", "http.server", "8099", "-d", "/site"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
BASE = "http://127.0.0.1:8099/index.html"
R = {"errors": [], "checks": {}, "failed": []}

def check(name, ok, detail=None):
    R["checks"][name] = {"ok": bool(ok), "detail": detail}
    if not ok:
        R["failed"].append(name)

#  A simple auto-player run inside the page, in fast-forward: it steps the simulation directly.
from smoke_bot import BOT


with sync_playwright() as p:
    b = p.chromium.launch()
    phone = p.devices["iPhone 13"]

    # 1. Phone: title, start, serve, launch; screenshots.
    ctx = b.new_context(**phone, locale="es-EC")
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: R["errors"].append(str(e)))
    pg.on("console", lambda m: m.type == "error" and R["errors"].append(m.text))
    pg.goto(BASE + "?debug=true&day=2026-11-22"); pg.wait_for_timeout(800)
    check("title state", pg.evaluate("game.state") == "title", pg.evaluate("game.state"))
    size = pg.evaluate("(() => { const r = document.getElementById('gameCanvas').getBoundingClientRect(); return [r.width, r.height, innerWidth, innerHeight, document.documentElement.scrollHeight]; })()")
    check("canvas fits phone", size[0] <= size[2] and size[1] <= size[3] and size[4] <= size[3] + 1, size)
    pg.screenshot(path="/out/01-title.png")
    pg.touchscreen.tap(195, 300); pg.wait_for_timeout(300)
    check("tap starts a run (serve)", pg.evaluate("game.state") == "serve", pg.evaluate("game.state"))
    pg.touchscreen.tap(195, 300); pg.wait_for_timeout(1500)
    check("tap launches", pg.evaluate("game.state") == "play", pg.evaluate("game.state"))
    pg.screenshot(path="/out/02-play.png")
    # pause button
    pg.locator("#pauseBtn").dispatch_event("pointerdown")
    pg.wait_for_timeout(200)
    t0 = pg.evaluate("game.balls[0] && [game.balls[0].x, game.balls[0].y]"); pg.wait_for_timeout(500)
    t1 = pg.evaluate("game.balls[0] && [game.balls[0].x, game.balls[0].y]")
    check("pause freezes the ball", pg.evaluate("game.paused") and t0 == t1, [t0, t1])
    pg.screenshot(path="/out/03-pause.png")
    pg.touchscreen.tap(195, 300); pg.wait_for_timeout(200)
    check("tap resumes", not pg.evaluate("game.paused"))

    # 2. Bot run in fast-forward: physics sanity, walls cleared, power-ups.
    r1 = pg.evaluate(BOT, {"steps": 120 * 240})
    R["bot_good"] = r1
    check("bot breaks bricks", r1["bricks"] > 40, r1["bricks"])
    check("bot clears at least one wall", r1["wall"] >= 2, r1["wall"])
    pg.wait_for_timeout(300)
    pg.screenshot(path="/out/04-later.png")

    # 3. Game over: a player who misses on purpose.
    pg.goto(BASE + "?debug=true&day=2026-11-22&vs=600&by=bot"); pg.wait_for_timeout(600)
    r2 = pg.evaluate(BOT, {"steps": 120 * 600, "miss": 400})
    R["bot_miss"] = r2
    check("run ends", r2["state"] == "over", r2)
    pg.wait_for_timeout(900)
    check("game-over card shown", pg.evaluate("!document.getElementById('gameover').hidden"))
    share = pg.evaluate("NeonDaily.shareMessage()")
    R["share"] = share
    check("share text", share and "Neon Bricks · Muro #1" in share and "/play/neon-bricks?d=2026-11-22" in share and ("vs=%d" % r2["score"]) in share, share)
    check("outcome headline", pg.evaluate("NeonDaily.lastResult().outcome") in ("win", "lose", "tie"), pg.evaluate("NeonDaily.lastResult()"))
    pg.screenshot(path="/out/05-over.png")
    pg.locator("#goAgain").click(); pg.wait_for_timeout(300)
    check("play again", pg.evaluate("game.state") == "serve" and pg.evaluate("document.getElementById('gameover').hidden"), pg.evaluate("game.state"))
    ctx.close()

    # 4. Same wall for everyone on a day, a different wall on another day.
    walls = {}
    for day in ("2026-11-22", "2026-11-22", "2026-11-23", "2026-11-24"):
        c = b.new_context(); q = c.new_page(); q.goto(BASE + "?debug=true&day=" + day); q.wait_for_timeout(300)
        walls.setdefault(day, []).append(q.evaluate("(() => [1,2,3].map(n => { const w = NeonBricks.buildWall(n); return w.shape + ':' + w.bricks.length + ':' + w.bricks.filter(x=>x.hard).length + ':' + w.bricks.filter(x=>x.power).map(x=>x.r+'.'+x.c+x.power).join(','); }))()"))
        c.close()
    R["walls"] = walls
    check("same day, same walls", walls["2026-11-22"][0] == walls["2026-11-22"][1])
    check("other days differ", walls["2026-11-23"][0] != walls["2026-11-22"][0] and walls["2026-11-24"][0] != walls["2026-11-23"][0])

    # 5. Desktop: keyboard and mouse.
    c = b.new_context(viewport={"width": 1280, "height": 800}, locale="en-US"); q = c.new_page()
    q.on("pageerror", lambda e: R["errors"].append(str(e)))
    q.goto(BASE + "?debug=true&day=2026-11-22"); q.wait_for_timeout(500)
    q.keyboard.press("Space"); q.wait_for_timeout(100); q.keyboard.press("Space"); q.wait_for_timeout(300)
    check("desktop space starts and launches", q.evaluate("game.state") == "play", q.evaluate("game.state"))
    x0 = q.evaluate("game.paddle.x"); q.keyboard.down("ArrowLeft"); q.wait_for_timeout(300); q.keyboard.up("ArrowLeft")
    check("arrow moves paddle", q.evaluate("game.paddle.x") < x0 - 50, [x0, q.evaluate("game.paddle.x")])
    q.keyboard.press("Escape"); q.wait_for_timeout(100)
    check("esc pauses", q.evaluate("game.paused"))
    check("english texts", q.evaluate("document.title") == "Neon Bricks: daily challenge")
    q.screenshot(path="/out/06-desktop.png")
    c.close()
    b.close()

srv.terminate()
print(json.dumps(R, indent=1, ensure_ascii=False))
