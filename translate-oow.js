/* Ocean of Wisdom — accessible machine-translation controls.
   Original English remains authoritative; translated views are supplied by Google Translate.
   This script does not send form data or personal information. */
(() => {
  'use strict';
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'es', label: 'Español' }
  ];
  const style = document.createElement('style');
  style.textContent = `
    .oow-translation-tools{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;
      margin:14px auto 18px;padding:12px 14px;max-width:980px;border:1px solid #d7b56d88;
      border-radius:12px;background:#14233d;color:#f5f1e8;font:14px/1.45 Arial,sans-serif}
    .oow-translation-tools__label{width:100%;text-align:center;color:#e8edf5;font-weight:600}
    .oow-translation-tools a{display:inline-block;padding:8px 13px;border:1px solid #d7b56d;
      border-radius:8px;color:#f5f1e8;text-decoration:none;font-weight:700}
    .oow-translation-tools a:hover,.oow-translation-tools a:focus-visible{background:#d7b56d;color:#14233d;outline:2px solid #6dd6df;outline-offset:2px}
    .oow-translation-tools a[aria-current="page"]{background:#d7b56d;color:#14233d}
    .oow-translation-tools__note{width:100%;text-align:center;color:#cbd5e1;font-size:12px}
  `;
  document.head.appendChild(style);
  const bar = document.createElement('nav');
  bar.className = 'oow-translation-tools';
  bar.setAttribute('aria-label', 'Page language');
  const label = document.createElement('div');
  label.className = 'oow-translation-tools__label';
  label.textContent = 'Read this page in another language';
  bar.appendChild(label);
  const current = document.documentElement.lang || 'en';
  languages.forEach(({ code, label: text }) => {
    const link = document.createElement('a');
    link.textContent = text;
    if (code === 'en') {
      link.href = location.href.split('#')[0];
      link.setAttribute('aria-current', 'page');
    } else {
      link.href = 'https://translate.google.com/translate?sl=auto&tl=' + code + '&u=' + encodeURIComponent(location.href.split('#')[0]);
      link.target = '_self';
      link.rel = 'noopener';
      link.setAttribute('aria-label', text + ' machine translation, opens in a new tab');
    }
    bar.appendChild(link);
  });
  const note = document.createElement('div');
  note.className = 'oow-translation-tools__note';
  note.textContent = 'Hindi, Tamil and Spanish views use Google Translate. The English original is the editorial reference.';
  bar.appendChild(note);
  const home = document.querySelector('.home, .oow-home-button');
  if (home) home.insertAdjacentElement('afterend', bar);
  else document.body.insertBefore(bar, document.body.firstChild);
})();