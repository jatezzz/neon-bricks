import subprocess, sys, time
from playwright.sync_api import sync_playwright
srv = subprocess.Popen([sys.executable, "-m", "http.server", "8098", "-d", "/site"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1200, "height": 630})
    pg.goto("http://127.0.0.1:8098/tools/og.html"); pg.wait_for_timeout(500)
    pg.locator("#c").screenshot(path="/out/og.png"); b.close()
srv.terminate(); print("og done")
