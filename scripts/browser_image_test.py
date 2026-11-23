#!/usr/bin/env python3
"""Cross-engine image smoke test for every HTML page containing images."""
import json, os, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = os.environ.get("SITE_TEST_BASE", "http://127.0.0.1:8000").rstrip("/")
PAGES = [p.relative_to(ROOT).as_posix() for p in ROOT.rglob("*.html")
         if ".git" not in p.parts and "<img" in p.read_text("utf-8", errors="ignore").lower()]

def check(browser, name, page_path, viewport=None, device_scale_factor=1, is_mobile=False):
    context = browser.new_context(viewport=viewport or {"width":1440,"height":1000},
                                  device_scale_factor=device_scale_factor, is_mobile=is_mobile)
    page = context.new_page()
    page.goto(f"{BASE}/{page_path}", wait_until="domcontentloaded", timeout=45000)
    page.evaluate("""() => { document.querySelectorAll('img').forEach(img => img.loading='eager'); }""")
    page.wait_for_timeout(1200)
    results = page.evaluate("""async () => {
      const imgs = [...document.images];
      return await Promise.all(imgs.map(img => new Promise(resolve => {
        const result = () => resolve({src: img.currentSrc || img.src, alt: img.alt || '', ok: img.complete && img.naturalWidth > 0});
        if (img.complete) return result();
        img.addEventListener('load', result, {once:true});
        img.addEventListener('error', result, {once:true});
        setTimeout(result, 12000);
      })));
    }""")
    failures = [x for x in results if not x["ok"]]
    context.close()
    if failures:
        print(json.dumps({"browser":name,"page":page_path,"failed_images":failures}, ensure_ascii=False))
        return len(failures)
    print(f"PASS {name}: {page_path} ({len(results)} images)")
    return 0

def main():
    errors = 0
    with sync_playwright() as p:
        for name, engine in [("Chromium desktop", p.chromium), ("Firefox desktop", p.firefox), ("WebKit iOS-sized", p.webkit)]:
            browser = engine.launch()
            for path in PAGES:
                viewport = {"width":390,"height":844} if "iOS" in name else {"width":1440,"height":1000}
                errors += check(browser, name, path, viewport=viewport, device_scale_factor=2 if "iOS" in name else 1)
            browser.close()
        browser = p.chromium.launch()
        for path in PAGES:
            errors += check(browser, "Chromium Android-sized", path,
                            viewport={"width":412,"height":915}, device_scale_factor=2, is_mobile=True)
        browser.close()
    print(json.dumps({"pages_tested":len(PAGES),"browser_profiles":4,"failed_images":errors}, indent=2))
    if errors:
        sys.exit(1)
if __name__ == "__main__":
    main()
