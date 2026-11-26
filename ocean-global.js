/* Shared Ocean of Wisdom starfield, sticky nav header, cinematic hero */
(()=>{'use strict';
if(document.getElementById('oow-global-brand'))return;

const canvas=document.createElement('canvas');canvas.id='oow-starfield';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);

const header=document.createElement('header');header.id='oow-global-brand';
header.innerHTML=
'<div class="oow-brandbar">'+
 '<a class="oow-brand-home" href="/" aria-label="Ocean of Wisdom home"><img src="/logo.png" alt="Ocean of Wisdom logo"><span class="oow-brand-word">Ocean of Wisdom</span></a>'+
 '<button class="oow-nav-toggle" type="button" aria-expanded="false" aria-controls="oow-nav" aria-label="Open menu"><span></span><span></span><span></span></button>'+
 '<nav class="oow-nav" id="oow-nav" aria-label="Primary">'+
  '<a href="/tools.html">Tools</a>'+
  '<a href="/sacred-india-pilgrimage-map.html">Pilgrimage Atlas</a>'+
  '<div class="oow-nav-dd">'+
   '<button type="button" class="oow-nav-ddbtn" aria-expanded="false">Traditions</button>'+
   '<div class="oow-nav-ddmenu">'+
    '<a href="/hinduism.html">Hinduism</a><a href="/buddhism.html">Buddhism</a><a href="/jainism.html">Jainism</a>'+
    '<a href="/sikhism.html">Sikhism</a><a href="/islam.html">Islam</a><a href="/christianity.html">Christianity</a>'+
    '<a href="/zoroastrianism.html">Zoroastrianism</a>'+
   '</div>'+
  '</div>'+
  '<div class="oow-nav-dd">'+
   '<button type="button" class="oow-nav-ddbtn" aria-expanded="false">About</button>'+
   '<div class="oow-nav-ddmenu">'+
    '<a href="/about.html">About</a><a href="/editorial-policy.html">Editorial Policy</a>'+
    '<a href="/methodology.html">Methodology</a><a href="/contact.html">Contact</a>'+
   '</div>'+
  '</div>'+
  '<span id="oow-header-translate" class="oow-nav-translate"></span>'+
 '</nav>'+
'</div>';
document.body.insertBefore(header,canvas.nextSibling);

/* nav interactions: hamburger + dropdowns (click/tap friendly) */
const navToggle=header.querySelector('.oow-nav-toggle');
const nav=header.querySelector('#oow-nav');
navToggle.addEventListener('click',()=>{const open=header.classList.toggle('oow-nav-open');navToggle.setAttribute('aria-expanded',open?'true':'false');navToggle.setAttribute('aria-label',open?'Close menu':'Open menu');});
header.querySelectorAll('.oow-nav-ddbtn').forEach(btn=>{btn.addEventListener('click',e=>{e.stopPropagation();const dd=btn.parentElement;const willOpen=!dd.classList.contains('open');header.querySelectorAll('.oow-nav-dd.open').forEach(o=>{if(o!==dd){o.classList.remove('open');o.querySelector('.oow-nav-ddbtn').setAttribute('aria-expanded','false');}});dd.classList.toggle('open',willOpen);btn.setAttribute('aria-expanded',willOpen?'true':'false');});});
document.addEventListener('click',e=>{if(!header.contains(e.target)){header.classList.remove('oow-nav-open');navToggle.setAttribute('aria-expanded','false');header.querySelectorAll('.oow-nav-dd.open').forEach(o=>{o.classList.remove('open');o.querySelector('.oow-nav-ddbtn').setAttribute('aria-expanded','false');});}});
/* shadow on scroll */
addEventListener('scroll',()=>{header.classList.toggle('oow-scrolled',scrollY>8);},{passive:true});

const hero=document.createElement('section');hero.id='oow-cinematic-hero';
hero.innerHTML='<img src="/ocean-wisdom-hero.webp" alt="A meditator overlooking a luminous cosmic ocean at sunrise, with the words Explore the Ocean of Wisdom"><div class="oow-star-gap"><a class="oow-global-scroll-cue" href="#oow-page-content" aria-label="Scroll down to explore this page"><span class="oow-global-scroll-arrow" aria-hidden="true">↓</span><span class="oow-global-scroll-label">Scroll to Explore</span></a></div>';
const heroImage=hero.querySelector('img');heroImage.addEventListener('error',()=>{if(!heroImage.dataset.fallback){heroImage.dataset.fallback='1';heroImage.src='/ocean-wisdom-hero.svg';}else{heroImage.hidden=true;}},{once:false});
header.insertAdjacentElement('afterend',hero);

function setScrollTarget(){const candidates=[...document.body.children].filter(el=>el!==header&&el!==canvas&&el!==hero&&!el.matches('script,style,link'));let target=candidates.find(el=>{const st=getComputedStyle(el);return st.display!=='none'&&st.visibility!=='hidden'&&el.getBoundingClientRect().height>0&&el.textContent.trim().length>0;});if(!target){target=document.querySelector('main,article,[role="main"]');}if(target){if(!target.id)target.id='oow-page-content';const cue=hero.querySelector('.oow-global-scroll-cue');if(cue)cue.href='#'+target.id;}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setScrollTarget,{once:true});else setScrollTarget();

if(location.pathname==='/'||location.pathname.endsWith('/index.html'))document.body.classList.add('oow-homepage');

const ctx=canvas.getContext('2d');if(ctx){
 const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let w=0,h=0,dpr=1,stars=[],raf=0;
 function resize(){dpr=Math.min(window.devicePixelRatio||1,1.5);w=window.innerWidth;h=window.innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);const count=Math.min(150,Math.max(55,Math.round(w*h/9500)));stars=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,r:.35+Math.random()*1.15,v:.06+Math.random()*.2,a:.25+Math.random()*.65,p:Math.random()*6.28}));draw(true);}
 function draw(staticFrame){ctx.clearRect(0,0,w,h);for(const s of stars){const twinkle=.72+.28*Math.sin(s.p);ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle='rgba(240,231,205,'+(s.a*twinkle)+')';ctx.fill();if(!staticFrame){s.y+=s.v;s.p+=.012;if(s.y>h+2){s.y=-2;s.x=Math.random()*w;}}}if(!staticFrame)raf=requestAnimationFrame(draw);}
 function startAnim(){if(!reduced&&!raf)raf=requestAnimationFrame(draw);}
 function stopAnim(){if(raf){cancelAnimationFrame(raf);raf=0;}}
 document.addEventListener('visibilitychange',()=>document.hidden?stopAnim():startAnim());window.addEventListener('resize',resize,{passive:true});resize();if(!reduced)startAnim();
}

const translationScript=document.createElement('script');translationScript.src='/oow-translate.js';translationScript.defer=true;document.head.appendChild(translationScript);
})();
