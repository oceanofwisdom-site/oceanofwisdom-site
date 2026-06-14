# 🪔 Ocean of Wisdom — Site Files

A 16-page interfaith philosophy site, fully interconnected, with:
- 1 Homepage
- 6 Pillar pages (each in 4 languages: EN / हि / த / ES)
- 1 Sanatana Dharma deep-dive (449 i18n keys across 4 languages, 16 sections)
- 1 Wisdom Articles hub
- 7 Wisdom Articles
- 12 sacred audio recordings (in /audio/)

---

## 📦 What's in this folder

```
oceanofwisdom-site/
├── CNAME                 ← tells GitHub Pages to serve at www.oceanofwisdom.site
├── robots.txt
├── sitemap.xml
├── index.html            ← Homepage
├── who-am-i.html         ← Pillar 1 (4-language)
├── what-is-all-this.html ← Pillar 2 (4-language)
├── am-i-connected.html   ← Pillar 3 (4-language)
├── i-am-that.html        ← Pillar 4 (4-language)
├── what-is-truth.html    ← Pillar 5 (4-language)
├── what-is-bliss.html    ← Pillar 6 (4-language)
├── sanatana-dharma.html  ← The big 16-section, 4-language masterpiece
├── wisdom-feed.html      ← Articles hub
├── compassion-across-traditions.html
├── eternal-now.html
├── finding-inner-peace.html
├── path-to-liberation.html
├── question-of-purpose.html
├── truth-beyond-words.html
├── unity-of-all-things.html
└── audio/                ← 12 sacred recordings
    ├── gayatri-mantra.mp3
    ├── bismillah.mp3
    ├── ahimsa-paramo-dharma.mp3
    ├── ana-al-haqq.mp3
    ├── humata-hukhta-hvarshta.mp3
    ├── bahai-earth-one-country.mp3
    ├── confucius-golden-rule.mp3
    ├── tao-te-ching.mp3
    ├── sabbe-sankhara-anicca.mp3
    ├── shema-yisrael.mp3
    ├── sikh-mool-mantar.mp3
    └── jesus-i-am-the-way.mp3
```

Every HTML page has the same Universal Navigation bar at the top — so any visitor on any page can reach any other in one click.

---

## 🚀 Deployment steps (when you're ready)

### Step 1 — Create the GitHub repository
Create a new repository on GitHub. Recommended name: `oceanofwisdom-site`. Push these files to the `main` branch at the repository root.

### Step 2 — GitHub Pages settings
- Settings → Pages
- Source: deploy from `main` branch, root (`/`)
- Custom domain: `www.oceanofwisdom.site`  (the CNAME file is already there)
- Enforce HTTPS: ON

### Step 3 — Namecheap DNS for oceanofwisdom.site
Add these records under "Advanced DNS":

| Type  | Host | Value                              |
|-------|------|------------------------------------|
| A     | @    | 185.199.108.153                    |
| A     | @    | 185.199.109.153                    |
| A     | @    | 185.199.110.153                    |
| A     | @    | 185.199.111.153                    |
| CNAME | www  | YOUR-GITHUB-USERNAME.github.io.    |

(Replace `YOUR-GITHUB-USERNAME` with the GitHub account that owns the new repo. The trailing dot in the CNAME value is required by some DNS interfaces.)

### Step 4 — Submit to Google Search Console
- Add `www.oceanofwisdom.site` as a new property
- Submit `https://www.oceanofwisdom.site/sitemap.xml`
- Request indexing of the homepage

---

## 🪔 The mission

*"Money is Maya, knowledge is sarva pradhanam. Tat Tvam Asi — truth is within you."*

This is a wisdom-sharing project, not a revenue vehicle. The domain name itself now speaks the mission: **Ocean of Wisdom.**
