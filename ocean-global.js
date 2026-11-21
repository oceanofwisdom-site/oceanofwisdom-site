/* Shared Ocean of Wisdom starfield and identity header */
(()=>{'use strict';
if(document.getElementById('oow-global-brand'))return;
const canvas=document.createElement('canvas');canvas.id='oow-starfield';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
const header=document.createElement('div');header.id='oow-global-brand';
header.innerHTML='<div class="oow-site-banner"><a href="/" aria-label="Ocean of Wisdom home"><img src="/banner.png" alt="Ocean of Wisdom — timeless wisdom across traditions"></a></div>';
document.body.insertBefore(header,canvas.nextSibling);
const intro=document.createElement('section');intro.id='oow-intro';
intro.setAttribute('aria-label','Introduction');
intro.innerHTML='<div class="oow-intro-inner"><h2 data-oow-copy="title">Where Wisdom Meets Wonder</h2><p data-oow-copy="description">Explore the mysteries of existence, the depth of human thought, and the knowledge of ancient civilisations.</p><div class="oow-intro-motto" data-oow-copy="motto">ज्ञान • அறிவு • Sabiduría • Wisdom</div></div>';
header.insertAdjacentElement('afterend',intro);
const introCopy={
en:{title:'Where Wisdom Meets Wonder',description:'Explore the mysteries of existence, the depth of human thought, and the knowledge of ancient civilisations.',motto:'ज्ञान • அறிவு • Sabiduría • Wisdom'},
hi:{title:'जहाँ ज्ञान और जिज्ञासा मिलते हैं',description:'अस्तित्व के रहस्यों, मानव विचारों की गहराई और प्राचीन सभ्यताओं के ज्ञान का अन्वेषण करें।',motto:'ज्ञान • அறிவு • Sabiduría • Wisdom'},
ta:{title:'அறிவும் வியப்பும் சங்கமிக்கும் இடம்',description:'இருப்பின் மர்மங்கள், மனித சிந்தனையின் ஆழம், பண்டைய நாகரிகங்களின் அறிவு ஆகியவற்றை ஆராயுங்கள்.',motto:'ज्ञान • அறிவு • Sabiduría • Wisdom'},
es:{title:'Donde la sabiduría encuentra el asombro',description:'Explora los misterios de la existencia, la profundidad del pensamiento humano y el conocimiento de las civilizaciones antiguas.',motto:'ज्ञान • அறிவு • Sabiduría • Wisdom'}
};
function setIntroLanguage(lang){const copy=introCopy[lang]||introCopy.en;intro.querySelectorAll('[data-oow-copy]').forEach(el=>el.textContent=copy[el.dataset.oowCopy]);}
function detectIntroLanguage(){const active=document.querySelector('.lang-btn.active[data-lang],.lang-btn[aria-pressed="true"][data-lang]');if(active)setIntroLanguage(active.dataset.lang);}
document.addEventListener('click',e=>{const b=e.target.closest('.lang-btn[data-lang]');if(b)setTimeout(()=>setIntroLanguage(b.dataset.lang),0);});
const langObserver=new MutationObserver(detectIntroLanguage);langObserver.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','aria-pressed']});detectIntroLanguage();
const ctx=canvas.getContext('2d');if(!ctx)return;
const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let w=0,h=0,dpr=1,stars=[],raf=0;
function resize(){dpr=Math.min(window.devicePixelRatio||1,1.5);w=window.innerWidth;h=window.innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);const count=Math.min(150,Math.max(55,Math.round(w*h/9500)));stars=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,r:.35+Math.random()*1.15,v:.06+Math.random()*.2,a:.25+Math.random()*.65,p:Math.random()*6.28}));draw(true)}
function draw(staticFrame){ctx.clearRect(0,0,w,h);for(const s of stars){const twinkle=.72+.28*Math.sin(s.p);ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle='rgba(240,231,205,'+(s.a*twinkle)+')';ctx.fill();if(!staticFrame){s.y+=s.v;s.p+=.012;if(s.y>h+2){s.y=-2;s.x=Math.random()*w}}}if(!staticFrame)raf=requestAnimationFrame(draw)}
function start(){if(!reduced&&!raf)raf=requestAnimationFrame(draw)}
function stop(){if(raf){cancelAnimationFrame(raf);raf=0}}
document.addEventListener('visibilitychange',()=>document.hidden?stop():start());window.addEventListener('resize',resize,{passive:true});resize();if(!reduced)start();
})();