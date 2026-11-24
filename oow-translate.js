/* Ocean of Wisdom — unified site-wide translation.
   Calendar and Bharata Bhasha translator are excluded.
   Aksharamala glyph containers remain in their original scripts. */
(()=>{'use strict';
 if(window.__oowUnifiedTranslate)return;
 window.__oowUnifiedTranslate=true;
 const LANGUAGES={hi:'हिन्दी',ta:'தமிழ்',es:'Español',fr:'Français',de:'Deutsch',it:'Italiano',ru:'Русский',ja:'日本語',ko:'한국어','zh-CN':'简体中文','zh-TW':'繁體中文',th:'ไทย',ms:'Bahasa Melayu',id:'Bahasa Indonesia',sl:'Slovenščina',ur:'اردو',ps:'پښتو',ar:'العربية',he:'עברית',pt:'Português (Brasil)','pt-PT':'Português (Portugal)',nl:'Nederlands'};
 const INCLUDED=Object.keys(LANGUAGES).join(',');
 const PATH=location.pathname;
 const EXCLUDED=PATH==='/calendar'||PATH.startsWith('/calendar/')||/^\/classical-languages\/translator(?:-(?:hi|ta|es))?\.html$/.test(PATH);
 const LEGACY_SELECTOR=['.oow-translate','.home-language-switch','.lang-switcher','.oow-universal-language-switcher','.language-switcher','.language-buttons','.lang-buttons','.langs','.page-language','.lang-sw'].join(',');
 const CSS='.oow-translate{box-sizing:border-box;position:relative;z-index:1002;display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap;width:max-content;max-width:calc(100% - 28px);margin:14px auto 20px;padding:8px 10px;border:1px solid #d8ad43;border-radius:14px;background:#142744;color:#f0d58d;font:600 14px/1.4 Arial,sans-serif}.oow-translate *{box-sizing:border-box}.oow-translate__button{min-height:42px;padding:9px 16px;border:1px solid #d8ad43;border-radius:10px;background:#d8ad43;color:#101d35;font:700 15px Arial,sans-serif;cursor:pointer;touch-action:manipulation}.oow-translate__select{min-width:190px;max-width:min(68vw,310px);min-height:42px;padding:8px 32px 8px 10px;border:1px solid #55d5e2;border-radius:10px;background:#101d35;color:#f6f1e7;font:14px Arial,sans-serif}.oow-translate__status{flex-basis:100%;margin:0;text-align:center;color:#d2dce9;font:12px/1.45 Arial,sans-serif}.oow-translate [hidden]{display:none!important}.goog-te-banner-frame,.skiptranslate{display:none!important}body{top:0!important}@media(max-width:600px){.oow-translate{gap:6px;margin:10px auto 14px;padding:7px}.oow-translate__button,.oow-translate__select{min-height:40px}.oow-translate__select{min-width:0;max-width:64vw}}';
 let providerPromise=null;
 function protectAksharamala(){
  document.querySelectorAll('.letters').forEach(container=>{
   container.classList.add('notranslate','oow-aksharamala-protected');
   container.setAttribute('translate','no');
   container.setAttribute('lang',container.closest('[lang]')?.getAttribute('lang')||document.documentElement.lang||'und');
   container.querySelectorAll('*').forEach(glyph=>{glyph.classList.add('notranslate');glyph.setAttribute('translate','no');});
  });
 }
 function loadProvider(){
  if(providerPromise)return providerPromise;
  providerPromise=new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(new Error('Translation provider timeout')),20000);
   const initialise=()=>{
    try{
     if(!window.google?.translate?.TranslateElement)throw new Error('Translation provider unavailable');
     new google.translate.TranslateElement({pageLanguage:'en',includedLanguages:INCLUDED,autoDisplay:false,multilanguagePage:true},'oow-google-translate');
     const started=Date.now();
     const poll=()=>{
      const combo=document.querySelector('.goog-te-combo');
      if(combo){clearTimeout(timeout);resolve(combo);return;}
      if(Date.now()-started>20000){clearTimeout(timeout);reject(new Error('Translation selector timeout'));return;}
      setTimeout(poll,150);
     };poll();
    }catch(error){clearTimeout(timeout);reject(error);}
   };
   window.googleTranslateElementInit=initialise;
   const script=document.createElement('script');
   script.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
   script.async=true;script.dataset.oowTranslateProvider='true';
   script.onerror=()=>{clearTimeout(timeout);reject(new Error('Translation provider failed to load'));};
   document.head.appendChild(script);
  });
  return providerPromise;
 }
 function statusMessage(status,message){status.textContent=message;status.hidden=false;}
 async function applyLanguage(code,status){
  protectAksharamala();
  if(code==='en'){
   const combo=document.querySelector('.goog-te-combo');
   if(combo){combo.value='';combo.dispatchEvent(new Event('change',{bubbles:true}));}
   else if(typeof window.switchLang==='function')window.switchLang('en');
   else location.reload();
   statusMessage(status,'English original selected.');return;
  }
  if(['hi','ta','es'].includes(code)&&typeof window.switchLang==='function'){
   window.switchLang(code);
   statusMessage(status,'Curated page translation applied. Aksharamala letters remain in their original script.');return;
  }
  const combo=await loadProvider();
  const option=[...combo.options].find(item=>item.value===code||item.value.endsWith('/'+code));
  if(!option)throw new Error('Selected language not offered by provider');
  combo.value=option.value;combo.dispatchEvent(new Event('change',{bubbles:true}));
  setTimeout(protectAksharamala,250);
  statusMessage(status,'Translation requested. Aksharamala letters remain protected in their original script.');
 }
 function createControl(){
  const nav=document.createElement('nav');nav.className='oow-translate notranslate';nav.setAttribute('translate','no');nav.setAttribute('aria-label','Translate this page');
  const button=document.createElement('button');button.type='button';button.className='oow-translate__button notranslate';button.textContent='Translate';button.setAttribute('translate','no');button.setAttribute('aria-expanded','false');
  const select=document.createElement('select');select.className='oow-translate__select notranslate';select.setAttribute('translate','no');select.setAttribute('aria-label','Choose page language');select.hidden=true;
  const original=document.createElement('option');original.value='en';original.textContent='English (original)';select.appendChild(original);
  Object.entries(LANGUAGES).forEach(([code,label])=>{const option=document.createElement('option');option.value=code;option.textContent=label;select.appendChild(option);});
  const status=document.createElement('p');status.className='oow-translate__status notranslate';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.hidden=true;
  nav.append(button,select,status);
  button.addEventListener('click',()=>{select.hidden=!select.hidden;button.setAttribute('aria-expanded',String(!select.hidden));if(!select.hidden)select.focus();});
  select.addEventListener('change',async()=>{try{await applyLanguage(select.value,status);}catch(error){statusMessage(status,'Translation is unavailable right now. Please retry or use your browser’s Translate feature.');}});
  return nav;
 }
 function mount(){
  if(EXCLUDED||!document.body||document.getElementById('oow-unified-translate-css'))return;
  const style=document.createElement('style');style.id='oow-unified-translate-css';style.textContent=CSS;document.head.appendChild(style);
  const host=document.createElement('div');host.id='oow-google-translate';host.className='notranslate';host.setAttribute('translate','no');host.setAttribute('aria-hidden','true');document.body.appendChild(host);
  const legacy=[...document.querySelectorAll(LEGACY_SELECTOR)];
  const anchor=legacy[0]||null;const control=createControl();
  if(anchor){anchor.replaceWith(control);legacy.slice(1).forEach(element=>element.remove());}
  else{
   const hero=document.querySelector('#oow-cinematic-hero,header.hero,body>header');
   const main=document.querySelector('main');const insertion=hero||main||document.body.firstElementChild;
   if(insertion?.parentNode)insertion.parentNode.insertBefore(control,insertion.nextSibling);else document.body.prepend(control);
  }
  protectAksharamala();
 }
 if(EXCLUDED)return;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();