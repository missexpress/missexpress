/* =====================================================================
   Miss Express · animación de bienvenida (intro) con sonido
   ---------------------------------------------------------------------
   En la página va SOLO esta etiqueta, justo después de <body>:
       <script src="img/intro.js"></script>
   Tapa la página con la animación (unos 5,3 s) y al terminar se desvanece y se quita sola.
   Usa las imágenes de esta misma carpeta: intro-figura.webp (Figura.webp) e intro-logo.webp (Logo.webp).

   En el sitio:
   - Se ve una vez por visita (por pestaña). Para verla de nuevo: missexpress.net/?intro
   - Con "reducir movimiento" activado en el teléfono no se muestra.
   - Si las imágenes tardan más de 4 s en cargar, no se muestra (no hace esperar).
   - Botón de parlante abajo a la derecha: silenciar / activar. Tecla Esc: cierra la intro.
     Los navegadores no dejan sonar audio hasta que la persona toca la pantalla:
     al primer toque el sonido entra sincronizado con la animación.

   Vista previa: img/intro.html (carga este mismo archivo con data-vista).
   Ahí no se quita al terminar y tocar la pantalla la repite.

   Línea de tiempo (en segundos de la versión original):
   0.0–1.4  chispa verde · 1.2–3.2 entra la repartidora en neón · 3.2–4.4 espiral, anillo y vórtice
   4.3–4.85 aparece el logo · 4.8–6.2 se "escribe" Miss Express · 6.3–7.0 brillo · 7.0–8.0 logo quieto
   ===================================================================== */
(function () {
'use strict';
const yo = document.currentScript;
const base = yo && yo.src ? yo.src : location.href;          // las imágenes están junto a este archivo
const VISTA = !!(yo && yo.hasAttribute('data-vista'));         // img/intro.html
const params = new URLSearchParams(location.search);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// en el sitio: una vez por visita, nunca con "reducir movimiento"; ?intro la fuerza
if (!VISTA) {
  let yaVista = false;
  try { yaVista = sessionStorage.getItem('mx-intro') === '1'; sessionStorage.setItem('mx-intro', '1'); } catch (e) { /* sin almacenamiento */ }
  if (reduceMotion || (yaVista && !params.has('intro'))) return;
}

/* ---------- la capa que tapa la página, el lienzo y el botón de sonido ---------- */
const estilo = document.createElement('style');
estilo.textContent = `
  #mx-intro { position: fixed; inset: 0; z-index: 2147483647; background: #FCF2FB; visibility: visible; transition: opacity .6s ease; }
  #mx-intro canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: block; }
  #mx-intro-sonido { position: absolute; right: 16px; bottom: max(16px, env(safe-area-inset-bottom)); width: 44px; height: 44px; border: 0; border-radius: 50%;
    background: #fff; color: #C2187A; box-shadow: 0 2px 10px rgba(194,24,122,.25); cursor: pointer;
    display: flex; align-items: center; justify-content: center; padding: 0; z-index: 2; }
  #mx-intro-sonido svg { width: 22px; height: 22px; }
  #mx-intro-sonido .x { display: none; }
  #mx-intro-sonido[aria-pressed="true"] .x { display: inline; }
  #mx-intro-sonido[aria-pressed="true"] .onda { display: none; }`;
// visibility:visible porque la página nace oculta (clase fp) hasta que cargan las fuentes
const capa = document.createElement('div');
capa.id = 'mx-intro';
capa.innerHTML = `
<canvas role="img" aria-label="Miss Express: la repartidora llega en neón y aparece el logo"${VISTA ? ' style="cursor:pointer"' : ''}></canvas>
<button id="mx-intro-sonido" type="button" aria-label="Silenciar sonido" aria-pressed="false">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/>
    <path class="onda" d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>
    <path class="x" d="m16 9 6 6m0-6-6 6"/>
  </svg>
</button>`;
const lienzo = capa.querySelector('canvas');
const botonSonido = capa.querySelector('#mx-intro-sonido');
const ctx = lienzo.getContext('2d');
const html = document.documentElement, overflowAntes = html.style.overflow;

// La línea de tiempo está escrita en segundos de animación (0–8). El inicio (la moto y el espiral) pasa rápido
// y el final (logo, letras y brillo) va a velocidad normal para que se luzca.
const A_INICIO = .9, A_LOGO = 4.3, A_FIN = 7.6, R_LOGO = 2;          // R_LOGO: segundo real en que aparece el logo
const DURACION_REAL = R_LOGO + (A_FIN - A_LOGO);                       // unos 5,3 s
const animDeReal = r => r < R_LOGO ? A_INICIO + (A_LOGO - A_INICIO) * r / R_LOGO : Math.min(A_LOGO + r - R_LOGO, A_FIN);
const realDeAnim = a => a < A_LOGO ? (a - A_INICIO) * R_LOGO / (A_LOGO - A_INICIO) : R_LOGO + a - A_LOGO;
const DURATION = 8;

const C = { bgTop: '#f7d0e5', bgMid: '#fbe3f0', floor: '#fdf1f8', pink: '#ff4fd8', greenSpark: '#7be22b' };
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, s, e) => clamp((t - s) / (e - s));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeBack = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const rand = (a, b) => a + Math.random() * (b - a);

/* ---------- tamaño: todo se escala según la pantalla (vertical u horizontal) ---------- */
let W, H, CX, CY, R, S, DPR, bokeh = [];
function medir() {
  const r = lienzo.getBoundingClientRect();
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = r.width; H = r.height;
  lienzo.width = Math.round(W * DPR); lienzo.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  R = Math.min(W * 0.36, H * 0.22);   // radio final del logo
  S = R / 175;                         // la maqueta original usaba radio 175
  CX = W / 2; CY = H * 0.44;
  bokeh = Array.from({ length: 70 }, () => ({
    x: rand(0, W), y: rand(0, H), r: Math.random() < .12 ? rand(8, 16) * S : rand(1, 3),
    sp: rand(4, 14) * S, ph: rand(0, 6.28)
  }));
}

/* ---------- partículas ---------- */
let particles = [];
function emit(x, y, o = {}) {
  const n = o.count || 1;
  for (let i = 0; i < n; i++) {
    const ang = o.angle !== undefined ? o.angle + rand(-o.spread, o.spread) : rand(0, Math.PI * 2);
    const sp = rand(o.speedMin ?? 20, o.speedMax ?? 120) * S;
    particles.push({
      x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, max: rand(o.lifeMin ?? .4, o.lifeMax ?? 1.2),
      size: rand(o.sizeMin ?? 1, o.sizeMax ?? 3) * Math.max(S, .7), color: o.color || C.pink,
      star: o.star ?? Math.random() < .35, drag: o.drag ?? .96
    });
  }
  if (particles.length > 600) particles.splice(0, particles.length - 600);
}
function updateParticles(dt) {
  for (const p of particles) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= p.drag; p.vy *= p.drag; }
  particles = particles.filter(p => p.life < p.max);
}
function drawStar(x, y, r, color, a) {
  ctx.globalAlpha = a; ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(x, y - r * 3); ctx.quadraticCurveTo(x, y, x + r * 3, y);
  ctx.quadraticCurveTo(x, y, x, y + r * 3); ctx.quadraticCurveTo(x, y, x - r * 3, y);
  ctx.quadraticCurveTo(x, y, x, y - r * 3); ctx.fill();
}
function drawParticles() {
  ctx.save(); ctx.globalCompositeOperation = 'source-over';
  for (const p of particles) {
    const a = Math.sin((p.life / p.max) * Math.PI);
    if (p.star) drawStar(p.x, p.y, p.size, p.color, a);
    else { ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}

/* ---------- fondo ---------- */
function drawBackground(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, C.bgTop); g.addColorStop(.55, C.bgMid); g.addColorStop(1, C.floor);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const floorY = CY + 130 * S;
  const fl = ctx.createRadialGradient(CX, floorY, 20 * S, CX, floorY, Math.max(W, H) * .8);
  fl.addColorStop(0, 'rgba(255,255,255,.6)'); fl.addColorStop(1, 'rgba(255,230,235,0)');
  ctx.fillStyle = fl; ctx.fillRect(0, 0, W, H);
  const v = ctx.createRadialGradient(CX, CY, 150 * S, CX, CY, Math.max(W, H) * .8);
  v.addColorStop(0, 'rgba(232,140,195,0)'); v.addColorStop(1, 'rgba(232,140,195,.28)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const streakA = 1 - prog(t, 3.5, 4.5);
  if (streakA > 0) {
    ctx.save(); ctx.strokeStyle = `rgba(242,82,200,${.18 * streakA})`; ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const x = ((i * 260 * S + t * 300 * S) % (W + 400 * S)) - 200 * S, y = (i * 137 * S) % (H * .45);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 140 * S, y - 60 * S); ctx.stroke();
    }
    ctx.restore();
  }
}

/* estela con brillo: pocos trazos por cuadro para que vaya fluido en teléfonos */
function glowPath(pts, color, width, alpha = 1) {
  if (pts.length < 2) return;
  ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const parts = 8, n = pts.length;
  for (let pass = 0; pass < 2; pass++) {
    ctx.shadowColor = color; ctx.shadowBlur = (pass ? 4 : 22) * S * DPR;
    ctx.strokeStyle = pass ? '#fff' : color; ctx.lineWidth = pass ? width * .35 : width;
    for (let j = 0; j < parts; j++) {
      const a = Math.floor(j * (n - 1) / parts), b = Math.floor((j + 1) * (n - 1) / parts);
      if (b <= a) continue;
      ctx.globalAlpha = alpha * (j + 1) / parts;
      ctx.beginPath(); ctx.moveTo(pts[a][0], pts[a][1]);
      for (let i = a + 1; i <= b; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/* ---------- escena 1: chispa verde ---------- */
function sparkPos(u) {
  const ang = -Math.PI * .2 + u * Math.PI * 2.4, r = lerp(20, 90, easeOut(u)) * S;
  return [CX + 60 * S + Math.cos(ang) * r * 1.3, CY - 40 * S + Math.sin(ang) * r * .7];
}
function drawGreenSpark(t) {
  const u = prog(t, 0, 1.4), fade = 1 - prog(t, 1.4, 2.0);
  if (fade <= 0) return;
  const pts = [];
  for (let i = 0; i <= 30; i++) pts.push(sparkPos(Math.max(0, u - .45 + i * .45 / 30)));
  glowPath(pts, C.greenSpark, 6 * S, fade);
  const [x, y] = sparkPos(u);
  if (t < 1.4) emit(x, y, { count: 4, color: C.greenSpark, speedMin: 30, speedMax: 160, lifeMax: .8 });
  ctx.save(); ctx.translate(0, 2 * (CY + 130 * S)); ctx.scale(1, -1);
  glowPath(pts, C.greenSpark, 4 * S, .3 * fade); ctx.restore();
}

/* ---------- la silueta del favicon (Figura.webp) en neón rosa ---------- */
const FIG = new Image(); FIG.src = new URL('intro-figura.webp', base).href;
const CROP = { x: 60, y: 130, w: 320, h: 215 }; // recorte de la silueta dentro de la imagen de 500x500
let NEON = null;
function buildNeon() {
  const pad = 60, w = CROP.w + pad * 2, h = CROP.h + pad * 2;
  const tint = document.createElement('canvas'); tint.width = w; tint.height = h;
  const tg = tint.getContext('2d');
  tg.drawImage(FIG, CROP.x, CROP.y, CROP.w, CROP.h, pad, pad, CROP.w, CROP.h);
  tg.globalCompositeOperation = 'source-in';
  const gr = tg.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, '#ffb8f4'); gr.addColorStop(.5, '#ff4fd8'); gr.addColorStop(1, '#c0179a');
  tg.fillStyle = gr; tg.fillRect(0, 0, w, h);
  tg.globalCompositeOperation = 'source-atop';
  const hl = tg.createLinearGradient(0, pad, 0, h - pad);
  hl.addColorStop(0, 'rgba(255,255,255,.45)'); hl.addColorStop(.6, 'rgba(255,255,255,0)');
  tg.fillStyle = hl; tg.fillRect(0, 0, w, h);
  // halo con sombras (funciona también en Safari, que no aplica filtros al canvas)
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.shadowColor = '#ff4fd8'; g.shadowBlur = 34; g.drawImage(tint, 0, 0); g.drawImage(tint, 0, 0);
  g.shadowBlur = 12; g.drawImage(tint, 0, 0);
  NEON = { canvas: c, pad };
}
function drawScooter(x, y, s, rot, alpha) {
  if (!NEON) return;
  const k = 300 * S / CROP.w, w = NEON.canvas.width * k, h = NEON.canvas.height * k;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = alpha;
  ctx.drawImage(NEON.canvas, -w / 2, -h + NEON.pad * k, w, h);
  ctx.restore();
}
function riderState(t) {
  const R0 = 140 * S;
  if (t < 3.2) {
    const u = easeOut(prog(t, 1.2, 3.2));
    return { x: lerp(-W * .6, CX, u), y: CY + R0, s: lerp(1.5, 1, u), rot: 0 };
  }
  const u = easeInOut(prog(t, 3.2, 4.4));
  const ang = Math.PI / 2 - u * Math.PI * 2.3, r = lerp(R0, 40 * S, u);
  return { x: CX + Math.cos(ang) * r, y: CY + Math.sin(ang) * r, s: lerp(1, .25, u), rot: ang - Math.PI / 2 };
}
// punto de la estela: detrás de la moto, siguiendo su giro
function trailPoint(tt) {
  const st = riderState(tt), back = 70 * S * st.s;
  return [st.x - Math.cos(st.rot) * back, st.y - Math.sin(st.rot) * back + 6 * S * st.s, st.s];
}
function drawRider(t) {
  if (t < 1.2 || t > 4.5) return;
  const st = riderState(t);
  // la estela se calcula sobre la trayectoria con pasos finos (no con los cuadros),
  // así la curva sale redonda en cualquier teléfono
  const STEP = 0.004, N = 140, pts = [];
  for (let i = N; i >= 0; i--) { const tt = t - i * STEP; if (tt >= 1.2) pts.push(trailPoint(tt)); }
  // 5 líneas paralelas, separadas en perpendicular a la dirección de avance
  for (let k = -2; k <= 2; k++) {
    const line = pts.map((p, i) => {
      const q = pts[Math.min(i + 1, pts.length - 1)], o = pts[Math.max(i - 1, 0)];
      const dx = q[0] - o[0], dy = q[1] - o[1], len = Math.hypot(dx, dy) || 1;
      return [p[0] - dy / len * k * 8 * S * p[2], p[1] + dx / len * k * 8 * S * p[2]];
    });
    glowPath(line, C.pink, (4 - Math.abs(k)) * S, .9);
  }
  const tp = pts[pts.length - 1];
  if (tp) emit(tp[0], tp[1], { count: 5, color: Math.random() < .2 ? C.greenSpark : C.pink, angle: st.rot + Math.PI, spread: 1, speedMin: 40, speedMax: 220, sizeMax: 2.5 });
  drawScooter(st.x, st.y, st.s, st.rot, 1 - prog(t, 4.2, 4.5));
  if (t < 3.3) {
    ctx.save(); ctx.translate(0, 2 * (st.y + 18 * S * st.s)); ctx.scale(1, -1);
    drawScooter(st.x, st.y, st.s * .98, 0, .12); ctx.restore();
  }
}

/* ---------- anillo rosa y vórtice verde ---------- */
function drawRingAndVortex(t) {
  const ringU = easeInOut(prog(t, 3.2, 4.5)), ringFade = 1 - prog(t, 5.2, 6.2);
  if (ringU > 0 && ringFade > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.shadowColor = C.pink; ctx.shadowBlur = 22 * S * DPR;
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = i ? `rgba(200,90,225,${.55 * ringFade})` : `rgba(242,82,200,${.9 * ringFade})`;
      ctx.lineWidth = (i ? 2 : 4) * Math.max(S, .7);
      const r = (185 + i * 14 + Math.sin(t * 6 + i) * 4) * S;
      const start = -Math.PI / 2 + i * .7 + t * (i ? 1.5 : .5);
      ctx.beginPath(); ctx.ellipse(CX, CY, r, r * .98, 0, start, start + ringU * Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    if (t < 5) { const a = Math.random() * Math.PI * 2; emit(CX + Math.cos(a) * 180 * S, CY + Math.sin(a) * 178 * S, { count: 2, color: C.pink, star: true, speedMax: 40, sizeMax: 2 }); }
  }
  if (t > 3.6 && t < 4.5) {
    for (let i = 0; i < 10; i++) {
      const a = rand(0, Math.PI * 2), r = rand(60, 150) * S;
      emit(CX + Math.cos(a) * r, CY + Math.sin(a) * r, { count: 1, color: C.greenSpark, angle: a + Math.PI * .6, spread: .2, speedMin: 150, speedMax: 300, lifeMax: .4, sizeMax: 1.8, star: false });
    }
  }
}

/* ---------- el logo de la app (Logo.webp): el disco aparece y luego se "escribe" el texto ---------- */
const LOGO = new Image(); LOGO.src = new URL('intro-logo.webp', base).href;
const IMG = { cx: 539, cy: 519, r: 396, rin: 353, w: 1080, h: 1080 }; // medidas del círculo dentro de Logo.webp
const VERDE = '#81fb2e';
const toScreen = (ix, iy) => { const k = R / IMG.r; return [CX + (ix - IMG.cx) * k, CY + (iy - IMG.cy) * k]; };
function drawLogoImage() { const k = R / IMG.r, [ox, oy] = toScreen(0, 0); ctx.drawImage(LOGO, ox, oy, IMG.w * k, IMG.h * k); }
function wipe(y0, y1, x0, x1, u) {
  if (u <= 0) return;
  const xi = lerp(x0, x1, u), [sx0, sy0] = toScreen(x0, y0), [sxi, sy1] = toScreen(xi, y1);
  ctx.save(); ctx.beginPath(); ctx.rect(sx0, sy0, sxi - sx0, sy1 - sy0); ctx.clip(); drawLogoImage(); ctx.restore();
  if (u < 1) {
    const by = (sy0 + sy1) / 2;
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.shadowColor = C.pink; ctx.shadowBlur = 20 * S * DPR; ctx.fillStyle = '#ffb3ef';
    ctx.beginPath(); ctx.arc(sxi, by, 6 * S, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    emit(sxi, by, { count: 2, color: C.pink, speedMax: 60, sizeMax: 2 });
  }
}
function drawLogo(t) {
  const appear = prog(t, 4.3, 4.85);
  if (appear <= 0 || !LOGO.naturalWidth) return;
  const s = easeBack(appear), float = Math.sin(t * 2) * 2 * S * prog(t, 6, 7);
  ctx.save(); ctx.translate(CX, CY + float); ctx.scale(s, s); ctx.translate(-CX, -CY);
  // sombra en el piso
  ctx.save(); ctx.globalAlpha = appear; ctx.translate(CX, CY + R + 35 * S); ctx.scale(1, (14 * S) / (R * .8));
  const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * .8);
  sg.addColorStop(0, 'rgba(122,58,85,.35)'); sg.addColorStop(1, 'rgba(122,58,85,0)');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, R * .8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  drawLogoImage();
  if (t < 6.2) {
    // tapa el texto con el mismo verde del disco y lo va descubriendo: "Miss" y la moto, luego "Express"
    ctx.fillStyle = VERDE; ctx.beginPath(); ctx.arc(CX, CY, IMG.rin * R / IMG.r, 0, Math.PI * 2); ctx.fill();
    wipe(250, 508, 290, 830, easeInOut(prog(t, 4.8, 5.5)));
    wipe(508, 780, 290, 830, easeInOut(prog(t, 5.4, 6.2)));
  }
  const sh = prog(t, 6.3, 7.0);
  if (sh > 0 && sh < 1) {
    ctx.save(); ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2); ctx.clip();
    const sx = lerp(CX - R * 1.6, CX + R * 1.6, sh);
    const gg = ctx.createLinearGradient(sx - 60 * S, 0, sx + 60 * S, 0);
    gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, 'rgba(255,255,255,.5)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gg; ctx.translate(sx, CY); ctx.rotate(.35); ctx.translate(-sx, -CY);
    ctx.fillRect(sx - 60 * S, CY - 300 * S, 120 * S, 600 * S); ctx.restore();
  }
  ctx.restore();
  const flash = 1 - prog(t, 4.3, 4.9);
  if (flash > 0 && flash < 1) {
    ctx.save(); ctx.globalCompositeOperation = 'source-over';
    const fg = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.max(W, H) * .5);
    fg.addColorStop(0, `rgba(255,220,250,${.7 * flash})`); fg.addColorStop(1, 'rgba(255,220,250,0)');
    ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
}
function drawBokeh(t) {
  const a = prog(t, 4.4, 5.5);
  if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#f39ad3';
  for (const b of bokeh) {
    const y = (b.y - t * b.sp + H) % H, tw = .5 + .5 * Math.sin(t * 2 + b.ph);
    ctx.globalAlpha = a * (b.r > 5 ? .18 : .6) * tw;
    ctx.beginPath(); ctx.arc(b.x, y, b.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function render(t, dt) {
  drawBackground(t); drawGreenSpark(t); drawRingAndVortex(t); drawRider(t);
  updateParticles(dt); drawBokeh(t); drawLogo(t); drawParticles();
  if (t < .3) { ctx.fillStyle = `rgba(252,242,251,${1 - t / .3})`; ctx.fillRect(0, 0, W, H); }
}

/* ===== Sonido Miss Express (Web Audio, sin archivos de audio) =====
   Agregado para el sitio: detener() apaga el sonido si la intro se cierra antes de terminar. */
const MissExpressSonido = (() => {
  let AC = null, salida = null, reverb = null, bus = null, ruidoBuf = null, inicio = 0, mute = false, detenido = false;

  function iniciar() {
    if (AC) return AC;
    const A = window.AudioContext || window.webkitAudioContext;
    if (!A) return null;
    AC = new A();
    salida = AC.createGain(); salida.gain.value = mute ? 0 : .9;
    const comp = AC.createDynamicsCompressor(); salida.connect(comp); comp.connect(AC.destination);
    reverb = AC.createConvolver();
    const n = Math.floor(AC.sampleRate * 2), ir = AC.createBuffer(2, n, AC.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); }
    reverb.buffer = ir;
    const wet = AC.createGain(); wet.gain.value = .3; reverb.connect(wet); wet.connect(salida);
    // los navegadores bloquean el audio hasta el primer toque: al tocar, se desbloquea y se sincroniza
    // iPhone y Firefox solo aceptan el toque al soltar el dedo (touchend / click), no al apoyarlo (pointerdown)
    const GESTOS = ['touchend', 'click', 'keydown', 'pointerup'];
    const desbloquear = () => {
      // en iPhone, sin esto el interruptor de silencio apaga el sonido de la página
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* Safari viejo */ }
      // un sonido vacío dentro del toque termina de desbloquear el audio en iPhone
      const s = AC.createBufferSource(); s.buffer = AC.createBuffer(1, 1, AC.sampleRate); s.connect(AC.destination); s.start(0);
      AC.resume().then(() => {
        if (AC.state !== 'running') return;
        GESTOS.forEach(g => removeEventListener(g, desbloquear, true));
        if (inicio) sonarSincronizado(false);
      }).catch(() => {});
    };
    GESTOS.forEach(g => addEventListener(g, desbloquear, true));
    return AC;
  }
  function ruido() {
    if (!ruidoBuf) {
      const n = AC.sampleRate * 2; ruidoBuf = AC.createBuffer(1, n, AC.sampleRate);
      const d = ruidoBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    return ruidoBuf;
  }
  function conPan(dest, t0, dur, pan, pan2) {
    if (pan === undefined || !AC.createStereoPanner) return dest;
    const p = AC.createStereoPanner(); p.pan.setValueAtTime(pan, t0);
    if (pan2 !== undefined) p.pan.linearRampToValueAtTime(pan2, t0 + dur);
    p.connect(dest); return p;
  }
  function tono(dest, t0, dur, o) {
    const osc = AC.createOscillator(), g = AC.createGain();
    osc.type = o.tipo || 'sine'; osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + (o.glide || dur));
    if (o.det) osc.detune.value = o.det;
    const a = o.a || .005;
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(o.v, t0 + a);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    let n = osc;
    if (o.lp) { const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); n = f; }
    n.connect(g); g.connect(conPan(dest, t0, dur, o.pan, o.pan2));
    osc.start(t0); osc.stop(t0 + dur + .05);
  }
  function soplo(dest, t0, dur, o) {
    const src = AC.createBufferSource(); src.buffer = ruido(); src.loop = true;
    const f = AC.createBiquadFilter(); f.type = o.tipo || 'bandpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f, t0); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t0 + dur);
    const g = AC.createGain(), pico = Math.max(t0 + .005, t0 + dur * (o.pico || .5));
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(o.v, pico);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(conPan(dest, t0, dur, o.pan, o.pan2));
    src.start(t0, Math.random() * 1.5); src.stop(t0 + dur + .05);
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  // marimba de madera: cuerpo cálido + resonador, parcial afinado a 4x y golpe de baqueta
  function marimba(dest, t, m, v, pan, brillo = 1) {
    const f = hz(m), d = Math.max(.28, Math.min(1.5, 1.5 * Math.pow(262 / f, .7)));
    const g = AC.createGain();
    g.connect(conPan(dest, t, d, pan !== undefined ? pan : Math.max(-.55, Math.min(.55, (m - 72) / 24 * .55))));
    tono(g, t, d, { f, v, a: .0012 });
    tono(g, t, d * 1.15, { f, v: v * .3, a: .015 });
    tono(g, t, d * .22, { f: f * 4, v: v * .24 * brillo, a: .001 });
    tono(g, t, d * .07, { f: f * 9.2, v: v * .05 * brillo, a: .001 });
    soplo(g, t, .02, { f: 900, q: .5, v: v * .35, pico: .05 });
  }
  // Scooter discreto: un zumbido suave que acelera al entrar y vuelve a ralentí al llegar al centro
  function moto(dest, t0, dur) {
    const fin = t0 + dur, acelera = t0 + dur * .3, llega = t0 + dur * .7;
    const g = AC.createGain(); g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(.07, t0 + .1); g.gain.linearRampToValueAtTime(.11, acelera);
    g.gain.setValueAtTime(.11, llega); g.gain.linearRampToValueAtTime(.05, fin - .2); g.gain.linearRampToValueAtTime(0, fin);
    g.connect(conPan(dest, t0, dur, -.8, 0));
    // filtro cerrado: se oye redondo, sin aspereza
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = .7; lp.connect(g);
    lp.frequency.setValueAtTime(700, t0); lp.frequency.exponentialRampToValueAtTime(1300, acelera); lp.frequency.exponentialRampToValueAtTime(600, fin);
    const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 120; hp.connect(lp);
    const mezcla = AC.createGain(); mezcla.gain.value = .8; mezcla.connect(hp);
    // revoluciones: ralentí, acelerón suave y de vuelta a ralentí
    const rpm = (p, k) => { p.setValueAtTime(80 * k, t0); p.exponentialRampToValueAtTime(150 * k, acelera); p.exponentialRampToValueAtTime(135 * k, llega); p.exponentialRampToValueAtTime(85 * k, fin); };
    [[1, 'sawtooth', .5], [1.005, 'triangle', .5]].forEach(([k, tipo, v]) => {
      const o = AC.createOscillator(), og = AC.createGain(); o.type = tipo; og.gain.value = v; rpm(o.frequency, k);
      o.connect(og); og.connect(mezcla); o.start(t0); o.stop(fin + .05);
    });
    // un leve ronroneo del motor
    const lfo = AC.createOscillator(), prof = AC.createGain(); lfo.type = 'sine'; prof.gain.value = .12;
    lfo.frequency.setValueAtTime(14, t0); lfo.frequency.linearRampToValueAtTime(20, acelera); lfo.frequency.linearRampToValueAtTime(12, fin);
    lfo.connect(prof); prof.connect(mezcla.gain); lfo.start(t0); lfo.stop(fin + .05);
  }

  function partitura(offset = 0) {
    if (detenido) return;   // la intro ya se cerró: no empezar a sonar tarde
    if (bus) { const viejo = bus; viejo.gain.setTargetAtTime(0, AC.currentTime, .03); setTimeout(() => viejo.disconnect(), 400); }
    const b = bus = AC.createGain(); b.connect(salida); b.connect(reverb);
    // los tiempos de abajo están en segundos de la animación; realDeAnim los pasa a segundos reales
    const T0 = AC.currentTime + .03 - offset, at = s => T0 + realDeAnim(s), ya = s => realDeAnim(s) >= offset - .05;
    const dura = (s, d) => realDeAnim(s + d) - realDeAnim(s);

    // fondo: acorde suave que crece y se apaga (bajito, para que se luzca la marimba)
    const p0 = Math.min(offset, DURACION_REAL - .6);
    [53, 57, 60, 64].forEach(m => [-8, 8].forEach(det =>
      tono(b, T0 + p0, DURACION_REAL - p0, { f: hz(m), tipo: 'sawtooth', lp: 900, det, a: 1.4, v: .016 })));
    // chispa verde: solo un brillo suave
    if (ya(A_INICIO)) soplo(b, at(A_INICIO), .4, { f: 2500, f2: 7000, q: 4, v: .08, pico: .3, pan: .3, pan2: -.2 });
    // llega la moto: el scooter y un whoosh suave de izquierda al centro
    if (ya(1)) moto(b, at(1), dura(1, 2.5));
    if (ya(1.2)) soplo(b, at(1.2), dura(1.2, 2), { f: 300, f2: 1400, q: .8, v: .18, pico: .4, pan: -.9, pan2: 0 });
    // aparece el logo: logo sonoro "Miss · Ex · press" en marimba
    if (ya(4.3)) {
      [[0, 72, .26], [.125, 81, .26], [.3125, 79, .2], [.4375, 77, .3], [.4375, 69, .13], [.4375, 53, .16], [.625, 72, .11], [.75, 77, .1]]
        .forEach(([d, m, v]) => marimba(b, at(4.3 + d), m, v));
    }
    // trazo del texto
    [[4.8, 5.5], [5.4, 6.2]].forEach(([s0, s1]) => { if (ya(s0)) soplo(b, at(s0), s1 - s0, { f: 2500, f2: 4200, q: 6, v: .05, pan: -.5, pan2: .5 }); });
    // brillo final
    if (ya(6.3)) {
      [89, 93, 96, 101].forEach((m, i) => marimba(b, at(6.35 + i * .09), m, .13, i / 2 - .75, 1.4));
      soplo(b, at(6.3), .7, { tipo: 'highpass', f: 4000, f2: 10000, v: .04, pan: -.6, pan2: .6 });
    }
  }

  // el sonido sigue al reloj real de la animación: espera a que el audio arranque de verdad
  // (en frío puede tardar, sobre todo con audífonos Bluetooth) y descuenta el retraso de la salida
  function sonarSincronizado(forzar) {
    const desde = performance.now();
    const ir = () => {
      if (detenido || (bus && !forzar)) return;
      if (AC.currentTime === 0 && performance.now() - desde < 1000) { setTimeout(ir, 10); return; }
      const t = (performance.now() - inicio) / 1000 + (AC.outputLatency || AC.baseLatency || 0);
      if (t < DURACION_REAL) partitura(t);
    };
    ir();
  }

  return {
    // se llama apenas carga la página, para que el audio ya esté listo cuando empiece la intro
    preparar() { iniciar(); },
    reproducir() {
      inicio = performance.now(); detenido = false;
      const ac = iniciar(); if (!ac) return;
      if (ac.state === 'running') sonarSincronizado(true);
      else {                                              // si está bloqueado, suena al primer toque
        if (bus) { bus.disconnect(); bus = null; }
        ac.resume().then(() => { if (ac.state === 'running') sonarSincronizado(false); }).catch(() => {});
      }
    },
    silenciar(si = true) {
      mute = si;
      if (AC) salida.gain.setTargetAtTime(si ? 0 : .9, AC.currentTime, .02);
    },
    detener() {
      detenido = true;
      if (bus) { const viejo = bus; bus = null; viejo.gain.setTargetAtTime(0, AC.currentTime, .03); setTimeout(() => viejo.disconnect(), 400); }
    },
  };
})();

/* ---------- reproducción ---------- */
let start = null, last = null, terminado = false, cerrada = false, fadeTimer = null;

function frame(now) {
  if (terminado) return;
  if (last === null) last = A_INICIO;
  const t = animDeReal(Math.max(0, now - start) / 1000);
  const dt = Math.min(Math.max(t - last, 0), .05); last = t;
  render(t, dt);
  if (t >= A_FIN) { terminado = true; if (!VISTA) cerrar(300); return; }
  requestAnimationFrame(frame);
}
// en el sitio: al terminar (o con Esc) se desvanece, se quita y la página queda como siempre
function cerrar(espera = 0) {
  if (cerrada) return;
  cerrada = terminado = true;
  removeEventListener('keydown', teclas);
  removeEventListener('resize', alCambiarTamano);
  clearTimeout(fadeTimer);
  fadeTimer = setTimeout(() => {
    MissExpressSonido.detener();
    capa.style.opacity = '0'; capa.style.pointerEvents = 'none';
    setTimeout(() => { capa.remove(); estilo.remove(); html.style.overflow = overflowAntes; }, 650);
  }, espera);
}
function play() {
  last = null; terminado = false; particles = [];
  if (reduceMotion) { render(DURATION, 0); terminado = true; return; }   // solo llega aquí en la vista previa
  // la animación y el sonido parten del mismo instante
  start = performance.now();
  MissExpressSonido.reproducir();
  requestAnimationFrame(frame);
}

// vista previa: tocar la pantalla vuelve a reproducir la animación
if (VISTA) lienzo.addEventListener('click', play);
// botón para silenciar o volver a activar el sonido
botonSonido.addEventListener('click', () => {
  const silencio = botonSonido.getAttribute('aria-pressed') !== 'true';
  botonSonido.setAttribute('aria-pressed', String(silencio));
  botonSonido.setAttribute('aria-label', silencio ? 'Activar sonido' : 'Silenciar sonido');
  MissExpressSonido.silenciar(silencio);
});
function teclas(e) { if (e.key === 'Escape' && !VISTA) cerrar(0); }
function alCambiarTamano() { medir(); if (terminado) render(DURATION, 0); }

function montar() {
  document.head.append(estilo);
  document.body.prepend(capa);
  if (!VISTA) html.style.overflow = 'hidden';
  addEventListener('keydown', teclas);
  addEventListener('resize', alCambiarTamano);
  medir();
  MissExpressSonido.preparar();
  // espera a que carguen las imágenes; si decode() falla o no existe (navegadores viejos), se usa el evento load
  const cargada = i => new Promise(r => { if (i.complete && i.naturalWidth) r(); else { i.onload = r; i.onerror = r; } });
  const lista = i => (i.decode ? i.decode().catch(() => cargada(i)) : cargada(i));
  const listas = Promise.all([FIG, LOGO].map(lista)).then(() => { try { buildNeon(); } catch { /* sin neón, igual se ve el logo */ } });
  // en el sitio no se hace esperar: si las imágenes no llegan en 4 s, la intro no se muestra
  const plazo = new Promise((_, no) => setTimeout(() => no(new Error('lento')), VISTA ? 15000 : 4000));
  Promise.race([listas, plazo]).then(play, () => (VISTA ? play() : cerrar(0)));
}

if (document.body) montar(); else document.addEventListener('DOMContentLoaded', montar);
})();
