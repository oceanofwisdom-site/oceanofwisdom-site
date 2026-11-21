/* Shared Ocean of Wisdom starfield and identity header */
(()=>{'use strict';
if(document.getElementById('oow-global-brand'))return;
const canvas=document.createElement('canvas');canvas.id='oow-starfield';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
const header=document.createElement('div');header.id='oow-global-brand';
header.innerHTML='<div class="oow-brandbar"><a class="oow-brand-home" href="/" aria-label="Ocean of Wisdom home"><img src="/ocean-wisdom-logo.png" alt="Ocean of Wisdom logo"></a><a class="oow-brand-homebtn" href="/" aria-label="Go to home">⌂ HOME</a></div>';
document.body.insertBefore(header,canvas.nextSibling);
const hero=document.createElement('section');hero.id='oow-cinematic-hero';hero.innerHTML='<img src="/ocean-wisdom-hero.webp" alt="A meditator overlooking a luminous cosmic ocean at sunrise, with the words Explore the Ocean of Wisdom"><div class="oow-star-gap" aria-hidden="true"></div>';
header.insertAdjacentElement('afterend',hero);
if(location.pathname==='/'||location.pathname.endsWith('/index.html'))document.body.classList.add('oow-homepage');
const ctx=canvas.getContext('2d');if(!ctx)return;
const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let w=0,h=0,dpr=1,stars=[],raf=0;
function resize(){dpr=Math.min(window.devicePixelRatio||1,1.5);w=window.innerWidth;h=window.innerHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);const count=Math.min(150,Math.max(55,Math.round(w*h/9500)));stars=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,r:.35+Math.random()*1.15,v:.06+Math.random()*.2,a:.25+Math.random()*.65,p:Math.random()*6.28}));draw(true)}
function draw(staticFrame){ctx.clearRect(0,0,w,h);for(const s of stars){const twinkle=.72+.28*Math.sin(s.p);ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle='rgba(240,231,205,'+(s.a*twinkle)+')';ctx.fill();if(!staticFrame){s.y+=s.v;s.p+=.012;if(s.y>h+2){s.y=-2;s.x=Math.random()*w}}}if(!staticFrame)raf=requestAnimationFrame(draw)}
function start(){if(!reduced&&!raf)raf=requestAnimationFrame(draw)}
function stop(){if(raf){cancelAnimationFrame(raf);raf=0}}
document.addEventListener('visibilitychange',()=>document.hidden?stop():start());window.addEventListener('resize',resize,{passive:true});resize();if(!reduced)start();
})();