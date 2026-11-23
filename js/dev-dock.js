/* ============================================================
   Barra del desarrollador (programador + "Lo que la hace única")
   Componente independiente: no depende de ningún otro archivo.
   Se configura con window.NR_DOCK (ver dev-dock.config.js).
   ============================================================ */
(() => {
  const C = window.NR_DOCK; if (!C || document.getElementById('nrDock')) return;
  const script = document.currentScript;
  const ROOT = new URL(C.root || '../', script ? script.src : location.href);
  const href = (h) => (/^(https?:|mailto:|#)/.test(h) ? h : new URL(h, ROOT).href);
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const col = Object.assign({ accent: '#B3135C', accent2: '#D12F7A', gold: '#D9B968', shirt: '#B3135C' }, C.colors || {});
  const phrase = C.phrase || '¡Weo aquí!';
  const mail = `mailto:${C.email}?subject=${encodeURIComponent('Quiero una página web')}`;
  const wa = `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(`Hola, vi la web de ${C.site} y me gustaría una página web.`)}`;

  /* ---------- estilos (prefijo nr- para no chocar con el sitio) ---------- */
  const css = `
  .nr-dock{--nr-a:${col.accent};--nr-a2:${col.accent2};--nr-g:${col.gold};position:fixed;left:50%;bottom:18px;z-index:94;display:flex;align-items:center;gap:.8rem;max-width:calc(100% - ${2 * (C.avoidRight || 90) + 20}px);padding:.5rem .55rem .5rem 84px;border-radius:999px;color:#AEB6C6;font:500 14px/1.3 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
    background:linear-gradient(160deg,rgba(30,39,64,.97),rgba(20,26,39,.97));-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.1);
    box-shadow:0 22px 50px -18px rgba(14,20,32,.7),0 0 0 6px rgba(255,255,255,.04);opacity:0;visibility:hidden;transform:translate(-50%,calc(100% + 40px));
    transition:transform .9s cubic-bezier(.2,.9,.25,1.15),opacity .6s ease,bottom .5s ease,visibility 0s linear .9s;box-sizing:border-box}
  .nr-dock *{box-sizing:border-box}
  .nr-dock.on{opacity:1;visibility:visible;transform:translate(-50%,0);transition:transform .9s cubic-bezier(.2,.9,.25,1.15),opacity .6s ease,bottom .5s ease,visibility 0s}
  .nr-dock.lift{bottom:96px}
  .nr-dock::before{content:"";position:absolute;left:28px;right:28px;top:-1px;height:1px;background:linear-gradient(90deg,transparent,var(--nr-a2),var(--nr-g),transparent)}
  .nr-coder{position:absolute;left:4px;bottom:2px;width:80px;height:auto;overflow:visible;filter:drop-shadow(0 6px 10px rgba(0,0,0,.25))}
  .nr-me{transform-box:fill-box;transform-origin:50% 100%}
  .nr-arm{transform-box:view-box;transform-origin:57px 47px;transform:rotate(150deg)}
  .nr-tag{transform-box:fill-box;transform-origin:20% 100%;opacity:0;transform:scale(.4);transition:opacity .3s}
  .nr-dock.on .nr-coder{animation:nrIn .9s cubic-bezier(.3,1.6,.5,1) .35s both}
  .nr-dock.on .nr-me{animation:nrType .5s ease-in-out 1.2s infinite alternate}
  .nr-dock.on .nr-tag{animation:nrPop .6s cubic-bezier(.3,1.6,.5,1) 1s forwards,nrFloat 3s ease-in-out 1.6s infinite}
  .nr-dock.wave .nr-arm{animation:nrWave 1.9s ease-in-out both}
  .nr-dock.wave .nr-tag{opacity:0!important}
  .nr-dock.wave .nr-me{animation:nrHop 1.9s ease-in-out both}
  @keyframes nrIn{from{transform:translateY(26px) scale(.8);opacity:0}to{transform:none;opacity:1}}
  @keyframes nrType{from{transform:translateY(0)}to{transform:translateY(1.2px)}}
  @keyframes nrPop{to{opacity:1;transform:none}}
  @keyframes nrFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
  @keyframes nrWave{0%{transform:rotate(150deg)}16%{transform:rotate(8deg)}28%{transform:rotate(-14deg)}40%{transform:rotate(12deg)}52%{transform:rotate(-14deg)}64%{transform:rotate(12deg)}76%{transform:rotate(-6deg)}100%{transform:rotate(150deg)}}
  @keyframes nrHop{0%,100%{transform:none}14%{transform:translateY(-3px)}24%{transform:none}}
  .nr-say{position:absolute;left:30px;bottom:calc(100% + 10px);padding:.45rem .8rem;border-radius:14px 14px 14px 4px;background:#fff;color:#1B2333;font-weight:800;font-size:.86rem;white-space:nowrap;box-shadow:0 12px 26px -10px rgba(14,20,32,.55);opacity:0;transform:translateY(8px) scale(.85);transform-origin:0 100%;transition:opacity .35s,transform .45s cubic-bezier(.3,1.6,.5,1);pointer-events:none}
  .nr-say::after{content:"";position:absolute;left:10px;bottom:-6px;width:12px;height:12px;background:#fff;transform:rotate(45deg);border-radius:0 0 3px 0}
  .nr-dock.wave .nr-say{opacity:1;transform:none}
  .nr-t{display:grid;margin:0;line-height:1.25;white-space:nowrap;min-width:0}
  .nr-t b{font:600 1.12rem/1.2 ${C.titleFont || "'Cormorant Garamond',Georgia,serif"};color:#fff}
  .nr-t span{font-size:.74rem;color:#8E97A8;overflow:hidden;text-overflow:ellipsis}
  .nr-links{display:flex;gap:.4rem;flex:none}
  .nr-a{display:inline-flex;align-items:center;gap:.45rem;padding:.55rem .9rem;border-radius:999px;font-size:.78rem;font-weight:600;color:#E6E9EF;border:1px solid rgba(255,255,255,.16);background:transparent;white-space:nowrap;text-decoration:none;cursor:pointer;font-family:inherit;line-height:1.2;transition:background .3s,border-color .3s,transform .3s}
  .nr-a svg{flex:none;width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  .nr-a:hover{background:var(--nr-a);border-color:var(--nr-a);color:#fff;transform:translateY(-2px)}
  .nr-a--wa{background:rgba(37,211,102,.14);border-color:rgba(37,211,102,.4)}
  .nr-a--wa:hover{background:#1FAF57;border-color:#1FAF57}
  .nr-dock--compact .nr-a:not(.nr-a--x) .nr-lbl{display:none}.nr-dock--compact .nr-a:not(.nr-a--x){padding:.6rem}
  .nr-a--x{position:relative;overflow:hidden;color:#1B2333;border:0;background:linear-gradient(100deg,var(--nr-g),#F6E3A6 45%,var(--nr-g));font-weight:800;box-shadow:0 8px 22px -8px var(--nr-g)}
  .nr-a--x::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.75) 50%,transparent 70%);transform:translateX(-120%);animation:nrShine 3.4s ease-in-out 2s infinite}
  .nr-a--x:hover{background:linear-gradient(100deg,var(--nr-g),#F6E3A6 45%,var(--nr-g));color:#1B2333}
  .nr-a--x svg{stroke-width:2}
  @keyframes nrShine{0%,55%{transform:translateX(-120%)}85%,100%{transform:translateX(120%)}}
  /* panel "lo que la hace única" */
  .nr-ov{position:fixed;inset:0;z-index:400;display:grid;place-items:center;padding:16px;background:rgba(11,15,26,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;visibility:hidden;transition:opacity .4s,visibility 0s linear .4s;font:400 15px/1.55 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
  .nr-ov.on{opacity:1;visibility:visible;transition:opacity .4s}
  .nr-ov *{box-sizing:border-box}
  .nr-box{--nr-a:${col.accent};--nr-g:${col.gold};position:relative;width:min(880px,100%);max-height:calc(100vh - 32px);overflow:auto;border-radius:24px;background:#fff;color:#2A3140;box-shadow:0 40px 90px -30px rgba(0,0,0,.6);transform:translateY(24px) scale(.97);transition:transform .5s cubic-bezier(.2,.9,.25,1.1)}
  .nr-ov.on .nr-box{transform:none}
  .nr-hd{position:relative;padding:28px 30px 22px;color:#C9CFDA;background:radial-gradient(420px 220px at 90% 0%,color-mix(in srgb,var(--nr-a) 45%,transparent),transparent 70%),linear-gradient(160deg,#1E2740,#141A27)}
  .nr-hd::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,var(--nr-a),var(--nr-g))}
  .nr-kick{display:inline-block;font-size:.7rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--nr-g);margin-bottom:.4rem}
  .nr-hd h3{margin:0 0 .35rem;font:600 clamp(1.5rem,3.4vw,2.1rem)/1.15 ${C.titleFont || "'Cormorant Garamond',Georgia,serif"};color:#fff}
  .nr-hd p{margin:0;max-width:620px;font-size:.92rem}
  .nr-close{position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#fff;font-size:1.5rem;line-height:1;cursor:pointer}
  .nr-close:hover{background:rgba(255,255,255,.2)}
  .nr-bd{padding:24px 30px 28px}
  .nr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin:0;padding:0;list-style:none}
  .nr-f{position:relative;display:flex;flex-direction:column;gap:.3rem;padding:16px 16px 14px;border-radius:16px;border:1px solid #ECE7E3;background:linear-gradient(180deg,#fff,#FBF8F6);opacity:0;transform:translateY(12px);transition:opacity .5s,transform .5s cubic-bezier(.2,.8,.2,1),box-shadow .3s,border-color .3s}
  .nr-ov.on .nr-f{opacity:1;transform:none}
  .nr-f:hover{border-color:color-mix(in srgb,var(--nr-a) 40%,#fff);box-shadow:0 16px 30px -18px rgba(27,35,51,.4)}
  .nr-f i{font-style:normal;display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:color-mix(in srgb,var(--nr-a) 12%,#fff);color:var(--nr-a);font-weight:800;font-size:.8rem}
  .nr-f b{color:#1B2333;font-size:.98rem;line-height:1.3}
  .nr-f span{font-size:.85rem;color:#667085;line-height:1.45}
  .nr-f a{margin-top:auto;padding-top:.35rem;color:var(--nr-a);font-weight:700;font-size:.84rem;text-decoration:none}
  .nr-f a:hover{text-decoration:underline}
  .nr-cmp{margin-top:22px;border:1px solid #ECE7E3;border-radius:16px;overflow:hidden}
  .nr-cmp h4{margin:0;padding:14px 18px;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:#1B2333;background:#F7F5F3}
  .nr-row{display:grid;grid-template-columns:1.4fr 1fr 1fr;border-top:1px solid #ECE7E3;font-size:.88rem}
  .nr-row>*{padding:10px 18px}
  .nr-row--h{font-weight:800;font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;color:#667085}
  .nr-row--h>:last-child{color:var(--nr-a)}
  .nr-no{color:#9AA1AE}.nr-no::before{content:"✕ ";color:#C9524F;font-weight:800}
  .nr-yes{color:#1B2333;font-weight:600;background:color-mix(in srgb,var(--nr-a) 5%,#fff)}.nr-yes::before{content:"✓ ";color:#137a55;font-weight:800}
  .nr-cta{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-top:20px;padding:16px 18px;border-radius:16px;background:#F7F5F3}
  .nr-cta b{color:#1B2333;font-size:1.02rem}
  .nr-cta .nr-a{color:#fff;background:var(--nr-a);border-color:var(--nr-a)}
  .nr-cta .nr-a--wa{background:#1FAF57;border-color:#1FAF57}
  @media (max-width:980px){.nr-dock .nr-lbl{display:none}.nr-dock .nr-a{padding:.6rem}.nr-dock{max-width:calc(100% - ${(C.avoidRight || 90) + 20}px)}}
  @media (max-width:760px){
    .nr-dock{left:10px;right:${C.avoidRightMobile || 80}px;bottom:${C.mobileBottom || 16}px;max-width:none;transform:translateY(calc(100% + 40px));gap:.4rem;padding:.42rem .42rem .42rem 60px}
    .nr-dock.on{transform:none}.nr-dock.lift{bottom:${(C.mobileBottom || 16) + 70}px}
    .nr-coder{width:60px;left:1px}
    .nr-t{flex:1}.nr-t b{font-size:.92rem;white-space:normal;line-height:1.1}.nr-t span{display:none}
    .nr-links{gap:.3rem}.nr-dock .nr-a{padding:.5rem}.nr-a svg{width:17px;height:17px}
    .nr-say{left:14px;font-size:.8rem}
    .nr-hd{padding:22px 20px 18px}.nr-bd{padding:18px 16px 20px}
    .nr-grid{grid-template-columns:1fr 1fr;gap:8px}.nr-f{padding:12px 11px 10px;border-radius:13px}.nr-f i{width:28px;height:28px;font-size:.72rem;border-radius:8px}.nr-f b{font-size:.86rem}.nr-f span{font-size:.76rem;line-height:1.4}.nr-f a{font-size:.78rem}
    .nr-row{grid-template-columns:1fr 1fr}.nr-row>:first-child{grid-column:1/-1;padding-bottom:0;font-weight:700;color:#1B2333}
    .nr-row--h>:first-child{display:none}
  }
  @media (prefers-reduced-motion:reduce){.nr-dock *,.nr-ov *{animation:none!important;transition:none!important}}
  @media print{.nr-dock,.nr-ov{display:none!important}}`;
  document.head.insertAdjacentHTML('beforeend', `<style id="nrDockCss">${css}</style>`);

  /* ---------- programador (SVG) ---------- */
  const coder = `<svg class="nr-coder" viewBox="0 0 84 76" aria-hidden="true">
    <g class="nr-tag"><rect x="54" y="2" width="28" height="17" rx="8.5" fill="#fff" stroke="#1B2333" stroke-width="1.6"/><path d="M60 19l-3 5 7-5" fill="#fff" stroke="#1B2333" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M62.5 7.5L59.5 10.5l3 3M73.5 7.5l3 3-3 3M69.6 6.5l-3 8" fill="none" stroke="${col.accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></g>
    <g class="nr-arm"><path d="M57 47L67 26" stroke="#1B2333" stroke-width="9" stroke-linecap="round"/><path d="M57 47L67 26" stroke="${col.shirt}" stroke-width="5.4" stroke-linecap="round"/><circle cx="68.5" cy="22.5" r="4.8" fill="#F2CDB9" stroke="#1B2333" stroke-width="1.8"/><path d="M66 19.5v-3M68.6 18.6v-3.4M71.2 19.5v-2.8" stroke="#1B2333" stroke-width="1.4" stroke-linecap="round"/></g>
    <g class="nr-me">
      <path d="M20 60c0-12 9-19 22-19s22 7 22 19z" fill="${col.shirt}" stroke="#1B2333" stroke-width="2"/>
      <path d="M36 41.5l6 6 6-6" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>
      <circle cx="42" cy="27" r="12" fill="#F2CDB9" stroke="#1B2333" stroke-width="2"/>
      <path d="M30.5 25c0-8 5-12.5 11.5-12.5S54 17 53.5 25c-3-4.5-7-6-11.5-6-4.5 0-8.5 1.5-11.5 6z" fill="#1B2333"/>
      <circle cx="37.5" cy="28" r="3.6" fill="#fff" fill-opacity=".55" stroke="#1B2333" stroke-width="1.6"/><circle cx="46.5" cy="28" r="3.6" fill="#fff" fill-opacity=".55" stroke="#1B2333" stroke-width="1.6"/><path d="M41.1 28h1.8" stroke="#1B2333" stroke-width="1.6"/>
      <path d="M39 34q3 2.2 6 0" fill="none" stroke="#1B2333" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="34" cy="32.5" r="1.8" fill="#F48DB6" opacity=".7"/><circle cx="50" cy="32.5" r="1.8" fill="#F48DB6" opacity=".7"/>
    </g>
    <rect x="18" y="44" width="48" height="24" rx="4" fill="#E9ECF2" stroke="#1B2333" stroke-width="2"/>
    <path d="M42 59.5c-3-2.4-6-4.4-6-7 0-1.7 1.3-3 3-3 1.3 0 2.4.8 3 1.9.6-1.1 1.7-1.9 3-1.9 1.7 0 3 1.3 3 3 0 2.6-3 4.6-6 7z" fill="${col.accent2}"/>
    <rect x="10" y="67" width="64" height="5" rx="2.5" fill="#AEB6C6" stroke="#1B2333" stroke-width="2"/>
  </svg>`;
  const I = {
    mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M4 7.5l8 5.5 8-5.5"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.2A8.5 8.5 0 1 0 12 3.5z"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.2 5.6L20 11l-5.8 2.4L12 19l-2.2-5.6L4 11l5.8-2.4z"/></svg>'
  };

  document.body.insertAdjacentHTML('beforeend', `
  <aside class="nr-dock${C.compact ? ' nr-dock--compact' : ''}" id="nrDock" aria-label="Contacto del desarrollador de esta web">
    ${coder}<span class="nr-say" aria-hidden="true">${esc(phrase)}</span>
    <p class="nr-t"><b>¿Te gustó esta web?</b><span>Contáctame y creamos la tuya</span></p>
    <div class="nr-links">
      <button class="nr-a nr-a--x" type="button" id="nrOpen" aria-haspopup="dialog">${I.star}<span class="nr-lbl">Lo que la hace única</span></button>
      <a class="nr-a" href="${mail}" aria-label="Escribir a ${esc(C.email)}">${I.mail}<span class="nr-lbl">${esc(C.email)}</span></a>
      <a class="nr-a nr-a--wa" href="${wa}" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(C.whatsappLabel)}">${I.wa}<span class="nr-lbl">${esc(C.whatsappLabel)}</span></a>
    </div>
  </aside>
  <div class="nr-ov" id="nrOv" role="dialog" aria-modal="true" aria-labelledby="nrTitle" hidden>
    <div class="nr-box">
      <div class="nr-hd"><button class="nr-close" type="button" aria-label="Cerrar">×</button>
        <span class="nr-kick">Hecha a la medida</span>
        <h3 id="nrTitle">Lo que esta web tiene y una plantilla genérica no</h3>
        <p>${esc(C.intro || 'Las webs genéricas cuestan caro y se ven iguales para todos. Esta se diseñó y programó desde cero, con herramientas propias pensadas para sus clientes.')}</p></div>
      <div class="nr-bd">
        <ul class="nr-grid">${(C.features || []).map((f, i) => `<li class="nr-f" style="transition-delay:${(.08 + i * .05).toFixed(2)}s"><i>${String(i + 1).padStart(2, '0')}</i><b>${esc(f.t)}</b><span>${esc(f.d)}</span>${f.href ? `<a href="${href(f.href)}">Verlo →</a>` : ''}</li>`).join('')}</ul>
        <div class="nr-cmp"><h4>Web genérica vs. esta web</h4>
          <div class="nr-row nr-row--h"><span></span><span>Plantilla genérica</span><span>Esta web</span></div>
          ${(C.compare || []).map(([k, no, yes]) => `<div class="nr-row"><span>${esc(k)}</span><span class="nr-no">${esc(no)}</span><span class="nr-yes">${esc(yes)}</span></div>`).join('')}
        </div>
        <div class="nr-cta"><b>¿Quieres una web así para tu negocio?</b><div class="nr-links"><a class="nr-a" href="${mail}">${I.mail}Escríbeme</a><a class="nr-a nr-a--wa" href="${wa}" target="_blank" rel="noopener">${I.wa}WhatsApp</a></div></div>
      </div>
    </div>
  </div>`);

  const dock = document.getElementById('nrDock'), ov = document.getElementById('nrOv');

  /* ---------- aparece al hacer scroll y se queda ---------- */
  const show = () => { if (dock.classList.contains('on')) return; dock.classList.add('on'); removeEventListener('scroll', check); setTimeout(wave, 1300); };
  const check = () => { if (scrollY > Math.min(320, innerHeight * .4)) show(); };
  if (REDUCED) dock.classList.add('on'); else { addEventListener('scroll', check, { passive: true }); check(); }

  /* ---------- saluda en cada sección nueva ---------- */
  let last = 0, wt;
  function wave() {
    if (REDUCED || !dock.classList.contains('on') || ov.classList.contains('on')) return;
    const now = Date.now(); if (now - last < 2600) return; last = now;
    dock.classList.remove('wave'); void dock.offsetWidth; dock.classList.add('wave');
    clearTimeout(wt); wt = setTimeout(() => dock.classList.remove('wave'), 1900);
  }
  const seen = new WeakSet();
  const secIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !seen.has(e.target)) { seen.add(e.target); wave(); } }), { rootMargin: '-45% 0px -45% 0px' });
  const watch = () => document.querySelectorAll(C.sections || 'main section, body > section, footer').forEach((s) => { if (s.offsetHeight > 160) secIO.observe(s); });
  watch(); setTimeout(watch, 1500);

  /* ---------- no tapar avisos del sitio (se eleva cuando aparecen) ---------- */
  if (C.liftWhen) {
    const sync = () => dock.classList.toggle('lift', !!document.querySelector(C.liftWhen));
    new MutationObserver(sync).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class', 'hidden'], childList: true });
  }

  /* ---------- panel "Lo que la hace única" ---------- */
  let back = null;
  const open = () => { back = document.activeElement; ov.hidden = false; requestAnimationFrame(() => ov.classList.add('on')); ov.querySelector('.nr-close').focus(); document.documentElement.style.overflow = 'hidden'; };
  const close = () => { ov.classList.remove('on'); document.documentElement.style.overflow = ''; setTimeout(() => { ov.hidden = true; }, 400); back && back.focus && back.focus(); };
  document.getElementById('nrOpen').onclick = open;
  ov.querySelector('.nr-close').onclick = close;
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  ov.querySelectorAll('.nr-f a').forEach((a) => a.addEventListener('click', () => { document.documentElement.style.overflow = ''; }));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && ov.classList.contains('on')) close(); });
})();
