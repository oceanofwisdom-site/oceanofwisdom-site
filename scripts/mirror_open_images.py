#!/usr/bin/env python3
"""Download freely licensed Wikimedia Commons images and rewrite site references to local assets.

Only CC0, public-domain, CC BY and CC BY-SA files are accepted. Each downloaded
asset receives a matching attribution record in assets/open-images/credits.json.
"""
from __future__ import annotations
import hashlib, html, json, mimetypes, os, re, sys, time
from pathlib import Path
from urllib.parse import urlparse, unquote, urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "open-images"
CREDITS_FILE = ASSET_DIR / "credits.json"
USER_AGENT = "OceanOfWisdomOpenImageMirror/1.0 (website image reliability audit)"
SRC_RE = re.compile(r'(?P<prefix>\bsrc\s*=\s*)(?P<q>["\'])(?P<url>https?://(?:commons\.wikimedia\.org/wiki/Special:FilePath/|upload\.wikimedia\.org/wikipedia/commons/)[^"\']+)(?P=q)', re.I)
CACHE = {}

def get_json(url: str):
    req = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=35) as response:
        return json.loads(response.read().decode("utf-8"))

def download(url: str, path: Path):
    req = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(req, timeout=60) as response:
        data = response.read()
        content_type = response.headers.get("Content-Type", "")
    if not data or len(data) < 512 or not content_type.startswith("image/"):
        raise RuntimeError(f"Not a valid image response for {url}: {content_type}, {len(data)} bytes")
    path.write_bytes(data)

def mirror(source_url: str):
    if source_url in CACHE:
        return CACHE[source_url]
    parsed = urlparse(source_url)
    if "/Special:FilePath/" in parsed.path:
        filename = unquote(parsed.path.split("/Special:FilePath/", 1)[-1])
    else:
        filename = unquote(parsed.path.rsplit("/", 1)[-1])
        filename = re.sub(r"^\d+px-", "", filename)
    title = "File:" + filename
    api = "https://commons.wikimedia.org/w/api.php?" + urlencode({
        "action":"query","format":"json","titles":title,"prop":"imageinfo",
        "iiprop":"url|extmetadata","iiurlwidth":"1400"
    })
    payload = get_json(api)
    pages = payload.get("query", {}).get("pages", {})
    page = next(iter(pages.values()), {})
    info = (page.get("imageinfo") or [{}])[0]
    meta = info.get("extmetadata", {})
    license_name = html.unescape(meta.get("LicenseShortName", {}).get("value", "")).strip()
    normalized = license_name.lower()
    allowed = (
        "public domain" in normalized or "cc0" in normalized or
        normalized.startswith("cc by") or normalized.startswith("cc-by")
    )
    if not allowed:
        raise RuntimeError(f"Rejected non-open/unclear license for {title}: {license_name or 'missing license'}")
    image_url = info.get("thumburl") or info.get("url")
    if not image_url:
        raise RuntimeError(f"No downloadable image URL for {title}")
    ext = Path(urlparse(image_url).path).suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}:
        ext = mimetypes.guess_extension(info.get("mime", "")) or ".jpg"
    digest = hashlib.sha256(source_url.encode()).hexdigest()[:10]
    safe = re.sub(r"[^a-z0-9-]+", "-", Path(filename).stem.lower()).strip("-")[:55] or "image"
    local_name = f"{safe}-{digest}{ext}"
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    target = ASSET_DIR / local_name
    if not target.exists():
        download(image_url, target)
    relative = os.path.relpath(target, ROOT)
    artist = html.unescape(meta.get("Artist", {}).get("value", "Not stated")).strip()
    credit = html.unescape(meta.get("Credit", {}).get("value", "")).strip()
    license_url = html.unescape(meta.get("LicenseUrl", {}).get("value", "")).strip()
    source_page = "https://commons.wikimedia.org/wiki/" + title.replace(" ", "_")
    record = {
        "file": relative.replace(os.sep, "/"), "title": filename,
        "creator": re.sub("<[^>]+>", "", artist)[:500],
        "credit": re.sub("<[^>]+>", "", credit)[:500],
        "license": license_name, "license_url": license_url,
        "source_page": source_page
    }
    CACHE[source_url] = (relative.replace(os.sep, "/"), record)
    return CACHE[source_url]

def main():
    pages = sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts)
    credits = json.loads(CREDITS_FILE.read_text("utf-8")) if CREDITS_FILE.exists() else {}
    changed, seen = [], set()
    for page in pages:
        original = page.read_text("utf-8")
        def replace(match):
            source = html.unescape(match.group("url"))
            local, record = mirror(source)
            rel = os.path.relpath(ROOT / local, page.parent).replace(os.sep, "/")
            credits[local] = record
            seen.add(source)
            return match.group("prefix") + match.group("q") + rel + match.group("q")
        updated = SRC_RE.sub(replace, original)
        if updated != original:
            page.write_text(updated, encoding="utf-8")
            changed.append(page.relative_to(ROOT).as_posix())
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    CREDITS_FILE.write_text(json.dumps(credits, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"pages_scanned":len(pages),"commons_images_mirrored":len(seen),
                      "pages_rewritten":changed,"asset_count":len(credits)}, indent=2))
    if not seen:
        print("No Wikimedia Commons Special:FilePath image sources were found.")
if __name__ == "__main__":
    main()
