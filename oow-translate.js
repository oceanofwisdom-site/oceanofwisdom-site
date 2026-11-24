/* Ocean of Wisdom — shared same-page translation controller
   Language controls are deliberately excluded from translation. */
(()=>{'use strict';
if(window.__oowTranslationController)return;
window.__oowTranslationController=true;
const LANGS={
 en:'English',hi:'हिन्दी',ta:'தமிழ்',es:'Español',
 fr:'Français',de:'Deutsch',it:'Italiano',ru:'Русский',
 ja:'日本語',ko:'한국어','zh-CN':'简体中文','zh-TW':'繁體中文',
 th:'ไทย',ms:'Bahasa Melayu',id:'Bahasa Indonesia',sl:'Slovenščina',
 ur:'اردو',ps:'پښتو',fa:'دری',ar:'العربية',he:'עברית',
 pt:'Português','pt-PT':'Português (Portugal)',nl:'Nederlands'
};
const SWITCHERS='.home-language-switch,.lang-switcher,.langs,.page-language,.lang-sw,.language-switcher,.language-buttons,.lang-buttons,.lang-btn,.lb,button[data-lang],a[data-lang],[aria-label*="language" i],[aria-label*="idioma" i]';
const BUTTONS='a,button,[role="button"]';
let readyResolve,readyReject;
const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject});
ready.catch(()=>{});
let initialized=false,waitTimer=null;
function protectControls(){
 document.querySelectorAll(SWITCHERS).forEach(box=>{
  box.classList.add('notranslate');
  box.setAttribute('translate','no');
  box.querySelectorAll(BUTTONS).forEach(button=>{
   button.classList.add('notranslate');
   button.setAttribute('translate','no');
   button.setAttribute('data-oow-language-control','true');
  });
 });
}
function addSwitcherIfMissing(){
 if(document.querySelector(SWITCHERS))return;
 const nav=document.createElement('nav');
 nav.className='oow-universal-language-switcher notranslate';
 nav.setAttribute('aria-label','Page language');
 nav.setAttribute('translate','no');
 Object.entries(LANGS).forEach(([code,label])=>{
  const button=document.createElement('button');
  button.type='button';button.className='oow-language-button notranslate';
  button.dataset.lang=code;button.lang=code;button.translate='no';
  button.textContent=label;button.setAttribute('aria-label','Translate page to '+label);
  nav.appendChild(button);
 });
 const anchor=document.querySelector('#oow-cinematic-hero,main,body>*:not(#oow-starfield):not(#oow-global-brand)');
 if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(nav,anchor.nextSibling);
 else document.body.insertBefore(nav,document.body.firstChild);
}
function ensureGoogleWidget(){
 if(initialized)return;
 initialized=true;
 let host=document.getElementById('oow-google-translate');
 if(!host){host=document.createElement('div');host.id='oow-google-translate';host.className='notranslate';host.setAttribute('translate','no');host.setAttribute('aria-hidden','true');document.body.appendChild(host);}
 window.googleTranslateElementInit=function(){
  try{
   const source=(document.documentElement.getAttribute('lang')||'en').split('-')[0].toLowerCase();
   const included=Object.keys(LANGS).filter(code=>code!=='en').join(',');
   new google.translate.TranslateElement({pageLanguage:source,includedLanguages:included,autoDisplay:false,multilanguagePage:true},'oow-google-translate');
   const started=Date.now();
   waitTimer=setInterval(()=>{
    const combo=document.querySelector('.goog-te-combo');
    if(combo){clearInterval(waitTimer);waitTimer=null;readyResolve(combo);}
    else if(Date.now()-started>15000){clearInterval(waitTimer);waitTimer=null;readyReject(new Error('Translation control did not initialise.'));}
   },100);
  }catch(error){readyReject(error);}
 };
 const script=document.createElement('script');
 script.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
 script.async=true;script.onerror=()=>readyReject(new Error('Translation service could not be loaded.'));
 document.head.appendChild(script);
}
function normalizeLanguage(value){
 const raw=String(value||'').trim();
 if(Object.prototype.hasOwnProperty.call(LANGS,raw))return raw;
 const lower=raw.toLowerCase();
 return Object.keys(LANGS).find(code=>code.toLowerCase()===lower)||null;
}
function targetLanguage(control){
 const direct=normalizeLanguage(control.dataset.lang||control.getAttribute('lang'));
 if(direct)return direct;
 const click=control.getAttribute('onclick')||'';
 const match=click.match(/(?:switchLang|setLanguage|changeLanguage)\s*\(\s*['"]([a-z]{2}(?:-[a-z]{2})?)['"]/i);
 if(match)return normalizeLanguage(match[1]);
 const href=control.getAttribute('href')||'';
 const query=href.match(/[?&]tl=([a-z]{2}(?:-[a-z]{2})?)/i);
 if(query)return normalizeLanguage(query[1]);
 const path=href.match(/(?:-|_)(en|hi|ta|es|fr|de|it|ru|ja|ko|zh-cn|zh-tw|th|ms|id|sl|ur|ps|fa|ar|he|pt|nl)(?:\.html)?(?:$|[?#])/i);
 if(path)return normalizeLanguage(path[1]);
 return null;
}
async function translateTo(lang){
 lang=normalizeLanguage(lang);
 if(!lang||lang==='en')return;
 protectControls();
 const combo=await ready;
 const option=Array.from(combo.options).find(item=>normalizeLanguage(item.value)===lang);
 if(!option)throw new Error('Language is not offered by the translation provider: '+lang);
 combo.value=option.value;
 combo.dispatchEvent(new Event('change',{bubbles:true}));
 document.documentElement.dataset.oowLanguage=lang;
}
function showFailure(){
 let status=document.getElementById('oow-translation-status');
 if(!status){
  status=document.createElement('p');status.id='oow-translation-status';status.className='oow-translation-status';
  status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const nav=document.querySelector(SWITCHERS);if(nav)nav.insertAdjacentElement('afterend',status);
 }
 if(status)status.textContent='This language is not available in the site translator. Use your browser’s built-in Translate feature (Chrome: address-bar Translate icon or right-click → Translate).';
}
function onClick(event){
 const control=event.target.closest(BUTTONS);
 if(!control)return;
 const box=control.closest(SWITCHERS);
 if(!box)return;
 const lang=targetLanguage(control);
 if(!lang)return;
 if(/switchLang\s*\(/.test(control.getAttribute('onclick')||'')&&window.translations&&window.translations[lang]){event.preventDefault();return;}
 event.preventDefault();event.stopImmediatePropagation();
 translateTo(lang).catch(showFailure);
}
function start(){
 protectControls();addSwitcherIfMissing();protectControls();ensureGoogleWidget();
 document.addEventListener('click',onClick,true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();