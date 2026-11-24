/* Ocean of Wisdom — compact on-demand page translator.
   English-first: pages are English; non-English readers tap one button to
   translate the whole page via Google Translate. The control itself is never
   translated. Google Translate is loaded lazily, only when the panel is first
   opened, so ordinary visits load nothing extra. */
(() => {
  'use strict';
  if (window.__oowTranslate) return;
  window.__oowTranslate = true;

  const LANGS = {
    hi:'हिन्दी', ta:'தமிழ்', te:'తెలుగు', kn:'ಕನ್ನಡ', ml:'മലയാളം',
    bn:'বাংলা', mr:'मराठी', gu:'ગુજરાતી', pa:'ਪੰਜਾਬੀ', ur:'اردو',
    es:'Español', fr:'Français', de:'Deutsch', it:'Italiano', pt:'Português',
    ru:'Русский', ar:'العربية', fa:'فارسی', zh:'中文', ja:'日本語',
    ko:'한국어', th:'ไทย', id:'Bahasa Indonesia', nl:'Nederlands'
  };

  let ready, readyResolve, readyReject, loading = false;

  function buildWidget() {
    const wrap = document.createElement('div');
    wrap.className = 'oow-translate-widget notranslate';
    wrap.setAttribute('translate', 'no');

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'oow-translate-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'oow-translate-panel');
    toggle.innerHTML = '<span aria-hidden="true">🌐</span> Translate this page';

    const panel = document.createElement('div');
    panel.className = 'oow-translate-panel';
    panel.id = 'oow-translate-panel';
    panel.hidden = true;

    const inner = document.createElement('div');
    inner.className = 'otp-inner';

    const original = document.createElement('button');
    original.type = 'button';
    original.className = 'oow-lang-btn oow-lang-original';
    original.textContent = 'English (original)';
    original.setAttribute('data-lang', 'en');
    inner.appendChild(original);

    Object.entries(LANGS).forEach(([code, label]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'oow-lang-btn';
      b.setAttribute('data-lang', code);
      b.setAttribute('lang', code);
      b.textContent = label;
      b.setAttribute('aria-label', 'Translate this page to ' + label);
      inner.appendChild(b);
    });

    const hint = document.createElement('p');
    hint.className = 'oow-translate-hint';
    hint.innerHTML = 'Translations are provided automatically and may be imperfect. ' +
      'Your browser’s own Translate feature (Chrome: the address-bar icon or right-click → Translate; ' +
      'Safari: the translate icon in the address bar) often works well too.';

    const status = document.createElement('p');
    status.className = 'oow-translate-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.hidden = true;

    panel.appendChild(inner);
    panel.appendChild(hint);
    panel.appendChild(status);
    wrap.appendChild(toggle);
    wrap.appendChild(panel);

    toggle.addEventListener('click', () => {
      const open = wrap.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      panel.hidden = !open;
      if (open) loadGoogle();
    });

    inner.addEventListener('click', (e) => {
      const btn = e.target.closest('.oow-lang-btn');
      if (!btn) return;
      const lang = btn.getAttribute('data-lang');
      setStatus(status, lang === 'en' ? 'Restoring English…' : 'Translating…');
      translateTo(lang)
        .then(() => setStatus(status, ''))
        .catch(() => setStatus(status,
          'This language could not be loaded. Please try your browser’s built-in Translate feature.'));
    });

    return wrap;
  }

  function setStatus(el, msg) {
    if (!el) return;
    el.textContent = msg || '';
    el.hidden = !msg;
  }

  function loadGoogle() {
    if (ready) return ready;
    ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
    ready.catch(() => {});
    let host = document.getElementById('oow-gt-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'oow-gt-host';
      host.className = 'notranslate';
      host.setAttribute('translate', 'no');
      host.setAttribute('aria-hidden', 'true');
      document.body.appendChild(host);
    }
    window.googleTranslateElementInit = function () {
      try {
        const src = (document.documentElement.getAttribute('lang') || 'en').split('-')[0].toLowerCase();
        new google.translate.TranslateElement(
          { pageLanguage: src, autoDisplay: false }, 'oow-gt-host');
        const started = Date.now();
        const t = setInterval(() => {
          const combo = document.querySelector('.goog-te-combo');
          if (combo) { clearInterval(t); readyResolve(combo); }
          else if (Date.now() - started > 15000) { clearInterval(t); readyReject(new Error('timeout')); }
        }, 120);
      } catch (err) { readyReject(err); }
    };
    const s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    s.onerror = () => readyReject(new Error('load-failed'));
    document.head.appendChild(s);
    return ready;
  }

  async function translateTo(lang) {
    const combo = await loadGoogle();
    const want = lang === 'en' ? '' : lang;
    const opt = Array.from(combo.options).find(o => (o.value || '') === want)
             || Array.from(combo.options).find(o => (o.value || '').toLowerCase().startsWith(want.toLowerCase()));
    if (lang !== 'en' && !opt) throw new Error('not-offered');
    combo.value = opt ? opt.value : '';
    combo.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function place(widget) {
    const anchor = document.getElementById('oow-cinematic-hero')
                || document.querySelector('main')
                || document.getElementById('oow-global-brand');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(widget, anchor.nextSibling);
    else document.body.insertBefore(widget, document.body.firstChild);
  }

  function start() {
    if (document.querySelector('.oow-translate-widget')) return;
    place(buildWidget());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
