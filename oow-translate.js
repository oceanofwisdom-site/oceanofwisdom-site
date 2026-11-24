/* Ocean of Wisdom — unified, same-page translation control.
   Calendar and Bhasha tool are intentionally excluded.
   Aksharamala panels are protected from machine translation. */
(()=>{'use strict';
if(window.__oowUnifiedTranslate)return;window.__oowUnifiedTranslate=true;
const LANGS={
 hi:'हिन्दी',ta:'தமிழ்',es:'Español',fr:'Français',de:'Deutsch',it:'Italiano',ru:'Русский',
 ja:'日本語',ko:'한국어','zh-CN':'简体中文','zh-TW':'繁體中文',th:'ไทย',ms:'Bahasa Melayu',
 id:'Bahasa Indonesia',sl:'Slovenščina',ur:'اردو',ps:'پښتو',fa:'دری',ar:'العربية',
 he:'עברית',pt:'Português (Brasil)','pt-PT':'Português (Portugal)',nl:'Nederlands'
};
const CODES=Object.keys(LANGS).join(',');
const EXCLUDED=()=>/^\/calendar(?:\/|$)/.test(location.pathname)||
 /^\/classical-languages\/translator(?:-(?:hi|ta|es))?\.html$/.test(location.pathname);
const OLD_CONTROLS='.home-language-switch,.lang-switcher,.oow-universal-language-switcher,.language-switcher,.language-buttons,.lang-buttons,.langs,.page-language,.lang-sw';
const css=`
.oow-translate{box-sizing:border-box;position:relative;z-index:35;display:flex;align-items:center;justify-content:center;gap:9px;flex-wrap:wrap;width:max-content;max-width:calc(100% - 28px);margin:14px auto 20px;padding:8px 10px;border:1px solid #d8ad43;border-radius:14px;background:#142744;color:#f0d58d;font:600 14px/1.4 Arial,sans-serif}
.oow-translate *{box-sizing:border-box}
.oow-translate__button{min-height:42px;padding:9px 16px;border:1px solid #d8ad43;border-radius:10px;background:#d8ad43;color:#101d35;font:700 15px Arial,sans-serif;cursor:pointer;touch-action:manipulation}
.oow-translate__select{min-width:190px;max-width:min(68vw,310px);min-height:42px;padding:8px 32px 8px 10px;border:1px solid #55d5e2;border-radius:10px;background:#101d35;color:#f6f1e7;font:14px Arial,sans-serif}
.oow-translate__status{flex-basis:100%;margin:0;text-align:center;color:#d2dce9;font:12px/1.45 Arial,sans-serif}
.oow-translate [hidden]{display:none!important}
.goog-te-banner-frame,.skiptranslate{display:none!important}body{top:0!important}
@media(max-width:600px){.oow-translate{gap:6px;margin:10px auto 14px;padding:7px}.oow-translate__button,.oow-translate__select{min-height:40px}.oow-translate__select{min-width:0;max-width:64vw}}
`;
function protectAksharamala(){
 document.querySelectorAll('h1,h2,h3').forEach(heading=>{
  if(!/aksharamala|alphabet/i.test(heading.textContent||''))return;
  let node=heading.nextElementSibling;
  while(node&&node.tagName!=='SECTION'&&!node.matches('.panel,.letters'))node=node.nextElementSibling;
  if(node){node.classList.add('notranslate','oow-aksharamala-protected');node.setAttribute('translate','no');node.setAttribute('lang',document.documentElement.lang||'und');}
 });
 document.querySelectorAll('.oow-aksharamala-protected,.oow-aksharamala-protected *').forEach(el=>{el.classList.add('notranslate');el.setAttribute('translate','no')});
}
let widgetPromise=null;
function loadWidget(){
 if(widgetPromise)return widgetPromise;
 widgetPromise=new Promise((resolve,reject)=>{
  const init=()=>{
   try{
    new google.translate.TranslateElement({pageLanguage:'en',includedLanguages:CODES,autoDisplay:false,multilanguagePage:true},'oow-google-translate');
    const start=Date.now();const poll=()=>{const combo=document.querySelector('.goog-te-combo');if(combo){resolve(combo);return}if(Date.now()-start>20000){reject(new Error('Translation service timed out'));return}setTimeout(poll,120)};poll();
   }catch(e){reject(e)}
  };
  window.googleTranslateElementInit=init;
  const s=document.createElement('script');s.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';s.async=true;s.onerror=()=>reject(new Error('Translation service unavailable'));document.head.appendChild(s);
 });
 return widgetPromise;
}
function control(){
 const existing=document.querySelector(OLD_CONTROLS);
 const nav=document.createElement('nav');nav.className='oow-translate notranslate';nav.setAttribute('translate','no');nav.setAttribute('aria-label','Translate this page');
 const button=document.createElement('button');button.type='button';button.className='oow-translate__button notranslate';button.textContent='Translate';button.setAttribute('translate','no');button.setAttribute('aria-expanded','false');
 const select=document.createElement('select');select.className='oow-translate__select notranslate';select.setAttribute('translate','no');select.setAttribute('aria-label','Choose page language');select.hidden=true;
 const original=document.createElement('option');original.value='';original.textContent='English (original)';select.appendChild(original);
 Object.entries(LANGS).forEach(([code,label])=>{const option=document.createElement('option');option.value=code;option.textContent=label;select.appendChild(option)});
 const status=document.createElement('p');status.className='oow-translate__status notranslate';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.hidden=true;
 nav.append(button,select,status);
 if(existing){existing.replaceWith(nav)}else{
  const hero=document.querySelector('#oow-cinematic-hero,header.hero,header');
  const main=document.querySelector('main');
  const anchor=hero||main||document.body.firstElementChild;
  if(anchor?.parentNode)anchor.parentNode.insertBefore(nav,anchor.nextSibling);else document.body.prepend(nav);
 }
 button.addEventListener('click',()=>{select.hidden=!select.hidden;button.setAttribute('aria-expanded',String(!select.hidden));if(!select.hidden)select.focus()});
 select.addEventListener('change',async()=>{
  status.hidden=false;
  try{
   const combo=await loadWidget();
   combo.value=select.value;combo.dispatchEvent(new Event('change',{bubbles:true}));
   status.textContent=select.value?'Translation applied to this page. Aksharamala letters remain in their original script.':'English original selected. Reload the page to fully restore the source text.';
  }catch(error){status.textContent='Translation could not be loaded. Please retry or use your browser’s built-in Translate.';}
 });
}
function init(){
 if(EXCLUDED())return;
 const style=document.createElement('style');style.id='oow-unified-translate-css';style.textContent=css;document.head.appendChild(style);
 const host=document.createElement('div');host.id='oow-google-translate';host.className='notranslate';host.setAttribute('translate','no');host.setAttribute('aria-hidden','true');document.body.appendChild(host);
 protectAksharamala();control();protectAksharamala();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();