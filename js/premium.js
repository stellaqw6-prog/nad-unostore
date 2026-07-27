function initLoadingScreen() {
  const fill = document.getElementById('ls-bar-fill');
  if (!fill) return;
  let progress = 0;
  const iv = setInterval(() => {
    progress += Math.random() * 18 + 4;
    if (progress >= 100) { progress = 100; clearInterval(iv);
      setTimeout(() => { document.getElementById('loading-screen').classList.add('hidden'); }, 300); }
    fill.style.width = progress + '%';
  }, 120);
}

function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], orbs = [];
  const COLORS = ['rgba(124,58,237,', 'rgba(168,85,247,', 'rgba(217,70,239,', 'rgba(255,255,255,'];
  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = Math.random() * W; this.y = init ? Math.random() * H : H + 5;
      this.r = Math.random() * 1.6 + .3; this.vx = (Math.random() - .5) * .22;
      this.vy = -Math.random() * .35 - .08; this.alpha = Math.random() * .55 + .1;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)]; this.twinkle = Math.random() * Math.PI * 2;
    }
    update() {
      this.x += this.vx; this.y += this.vy; this.twinkle += .035;
      this.alpha = .08 + Math.abs(Math.sin(this.twinkle)) * .45;
      if (this.y < -5 || this.x < -5 || this.x > W + 5) this.reset(false);
    }
    draw() {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.alpha + ')'; ctx.fill();
    }
  }
  class GlowOrb {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W; this.y = Math.random() * H;
      this.r = Math.random() * 3 + 2; this.vx = (Math.random() - .5) * .12; this.vy = (Math.random() - .5) * .12;
      this.alpha = Math.random() * .2 + .04; this.pulse = Math.random() * Math.PI * 2;
    }
    update() {
      this.x += this.vx; this.y += this.vy; this.pulse += .018;
      if (this.x < 0 || this.x > W) this.vx *= -1; if (this.y < 0 || this.y > H) this.vy *= -1;
    }
    draw() {
      const a = this.alpha + Math.sin(this.pulse) * .07;
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 5);
      grad.addColorStop(0, 'rgba(124,58,237,' + a + ')'); grad.addColorStop(1, 'rgba(124,58,237,0)');
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r * 5, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
    }
  }
  function build() {
    W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight;
    const COUNT = Math.min(100, Math.floor(W * H / 12000));
    particles = []; for (let i = 0; i < COUNT; i++) particles.push(new Particle());
    orbs = []; for (let i = 0; i < 7; i++) orbs.push(new GlowOrb());
  }
  build();
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 200); });
  function animate() {
    ctx.clearRect(0, 0, W, H);
    orbs.forEach(o => { o.update(); o.draw(); });
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}

function initCursorGlow() {
  if ('ontouchstart' in window) return;
  const glow = document.getElementById('cursor-glow');
  if (!glow) return;
  document.addEventListener('mousemove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });
}

function initCardTilt() {
  function applyTilt(card) {
    if (card._tiltInit) return;
    card._tiltInit = true;
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - .5;
      const y = (e.clientY - rect.top) / rect.height - .5;
      card.style.transform = `perspective(700px) rotateX(${y * 9}deg) rotateY(${-x * 9}deg) translateY(-3px) scale(1.02)`;
      const shine = card.querySelector('.card-tilt-shine');
      if (shine) { shine.style.background = `radial-gradient(circle at ${50 + x * 80}% ${50 + y * 80}%,rgba(255,255,255,.13) 0%,rgba(255,255,255,0) 60%)`; }
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; const shine = card.querySelector('.card-tilt-shine'); if (shine) shine.style.background = ''; });
    card.addEventListener('touchstart', () => { card.style.transform = 'translateY(-2px) scale(1.01)'; }, { passive: true });
    card.addEventListener('touchend', () => { setTimeout(() => { card.style.transform = ''; }, 200); }, { passive: true });
  }
  document.querySelectorAll('.product-card').forEach(applyTilt);
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.classList && node.classList.contains('product-card')) applyTilt(node);
        if (node.querySelectorAll) node.querySelectorAll('.product-card').forEach(applyTilt);
      });
    });
  });
  const grid = document.getElementById('products-grid');
  if (grid) observer.observe(grid, { childList: true, subtree: true });
}

function injectCardShine() {
  document.querySelectorAll('.product-card').forEach(card => {
    if (!card.querySelector('.card-tilt-shine')) {
      const shine = document.createElement('div'); shine.className = 'card-tilt-shine'; card.appendChild(shine);
    }
  });
}

function showSkeletonGrid() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const isFeatured = i === 2;
    const div = document.createElement('div');
    div.className = 'skel-card' + (isFeatured ? ' featured' : '');
    div.style.gridColumn = isFeatured ? '1/-1' : '';
    div.innerHTML = `<div class="skel-img skeleton"></div><div class="skel-body"><div class="skel-line w-80 skeleton"></div><div class="skel-line w-60 skeleton"></div><div class="skel-line w-40 skeleton"></div></div>`;
    grid.appendChild(div);
  }
}

let twInterval = null;
function initTypewriter() {
  const phrases = ['Bot WA 1800+ Fitur Aktif', 'Panel Premium VPS Legal', 'Source Code Full Tanpa Enkripsi', 'Aktivasi Otomatis, Support 24/7', 'Harga Mulai Rp500 Saja!'];
  let pi = 0, ci = 0, deleting = false;
  if (twInterval) clearInterval(twInterval);
  function getTarget() { return document.getElementById('hero-tw-0') || document.querySelector('.hero-content p'); }
  const el = getTarget();
  if (!el) return;
  el.innerHTML = '<span id="tw-text"></span><span class="typewriter-cursor"></span>';
  function type() {
    const tw = document.getElementById('tw-text');
    if (!tw) return;
    const phrase = phrases[pi];
    if (!deleting) { tw.textContent = phrase.slice(0, ci + 1); ci++; if (ci === phrase.length) { deleting = true; setTimeout(type, 2200); return; } }
    else { tw.textContent = phrase.slice(0, ci - 1); ci--; if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; } }
    setTimeout(type, deleting ? 45 : 85);
  }
  type();
}

let _revealObserver = null;
function initScrollReveal() {
  if (_revealObserver) _revealObserver.disconnect();
  _revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); _revealObserver.unobserve(e.target); } });
  }, { threshold: .08, rootMargin: '0px 0px -10px 0px' });
  document.querySelectorAll('.product-card').forEach((el, i) => {
    if (el._revealDone) return; el.classList.add('reveal'); el.style.transitionDelay = (i % 2) * 0.06 + 's'; _revealObserver.observe(el);
  });
  document.querySelectorAll('.trust-badge').forEach((el, i) => {
    el.classList.add('reveal'); el.style.transitionDelay = (i * 0.05) + 's'; setTimeout(() => el.classList.add('visible'), 300 + (i * 50));
  });
}

let notifIdx = 0;
function showFloatNotif() {
  const b = FAKE_BUYERS[notifIdx % FAKE_BUYERS.length]; notifIdx++;
  const notif = document.getElementById('float-notif');
  const av = document.getElementById('fn-av'); const nm = document.getElementById('fn-name'); const pr = document.getElementById('fn-product');
  if (!notif) return;
  const gradients = ['linear-gradient(135deg,#7c3aed,#d946ef)', 'linear-gradient(135deg,#1d4ed8,#7c3aed)', 'linear-gradient(135deg,#065f46,#059669)', 'linear-gradient(135deg,#92400e,#d97706)', 'linear-gradient(135deg,#9d174d,#ec4899)'];
  av.textContent = b.avatar; av.style.background = gradients[notifIdx % gradients.length];
  nm.textContent = b.name + ' dari ' + b.city; pr.textContent = 'baru saja membeli ' + b.product;
  notif.classList.add('show'); setTimeout(() => notif.classList.remove('show'), 4500);
}
function startFloatNotifs() { setTimeout(() => { showFloatNotif(); setInterval(showFloatNotif, 14000); }, 5000); }

function startLiveVisitorCounter() {
  const el = document.getElementById('live-count');
  if (!el) return;
  let base = Math.floor(Math.random() * 20) + 8; el.textContent = base;
  setInterval(() => { const delta = Math.random() < .5 ? 1 : -1; base = Math.max(5, Math.min(60, base + delta)); el.textContent = base; }, 7000);
}

function animateCounter(el, target, duration = 1500) {
  if (!el) return;
  let start = 0; const step = target / duration * 16;
  const iv = setInterval(() => { start += step; if (start >= target) { start = target; clearInterval(iv); } el.textContent = Math.floor(start).toLocaleString() + '+'; }, 16);
}

function launchKonfetti() {
  const canvas = document.getElementById('konfetti-canvas');
  if (!canvas) return;
  canvas.style.display = 'block'; canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const pieces = [];
  const COLORS2 = ['#7c3aed', '#a855f7', '#d946ef', '#f59e0b', '#22c55e', '#60a5fa', '#fff'];
  for (let i = 0; i < 120; i++) {
    pieces.push({
      x: Math.random() * canvas.width, y: canvas.height * (.2 + Math.random() * .3),
      r: Math.random() * 5 + 3, color: COLORS2[Math.floor(Math.random() * COLORS2.length)],
      vx: (Math.random() - .5) * 6, vy: -(Math.random() * 8 + 4), gravity: .25,
      rotation: Math.random() * 360, rotV: (Math.random() - .5) * 8, shape: Math.random() > .5 ? 'circle' : 'rect', alpha: 1
    });
  }
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.rotation += p.rotV; p.alpha -= .008;
      if (p.alpha <= 0) return;
      ctx.save(); ctx.globalAlpha = p.alpha; ctx.translate(p.x, p.y); ctx.rotate(p.rotation * Math.PI / 180);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); } else { ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); }
      ctx.restore();
    });
    frame++; if (frame < 200) requestAnimationFrame(draw); else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.style.display = 'none'; }
  }
  draw();
}

function addViewCounts() {
  document.querySelectorAll('.product-card').forEach(card => {
    const body = card.querySelector('.card-body');
    if (body && !card.querySelector('.view-count')) {
      const views = Math.floor(Math.random() * 200 + 50); const vc = document.createElement('div');
      vc.className = 'view-count'; vc.innerHTML = `👁️ ${views} dilihat hari ini`; body.appendChild(vc);
    }
  });
}

function addFlashBadges() {
  document.querySelectorAll('.product-card.featured').forEach(card => {
    const body = card.querySelector('.card-body');
    if (body && !card.querySelector('.flash-badge')) {
      const fb = document.createElement('div'); fb.style.marginBottom = '5px';
      fb.innerHTML = '<span class="flash-badge">🔥 Terlaris</span>'; body.insertBefore(fb, body.firstChild);
    }
  });
}

async function _showMaintenanceOverlay() {
  if (document.getElementById('_maint-overlay')) return;
  const ov = document.createElement('div');
  ov.id = '_maint-overlay';
  ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#080810,#0f0a1a);z-index:9999999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;';
  ov.innerHTML = '<div style="font-size:56px;margin-bottom:20px">⚙️</div><div style="font-family:Syne,sans-serif;font-weight:800;font-size:26px;color:#fff;margin-bottom:8px">Mode Maintenance</div><div style="font-size:14px;color:#888;max-width:280px;line-height:1.6;margin-bottom:28px">Store sedang dalam perbaikan. Silahkan coba lagi beberapa saat.</div><div style="font-size:12px;padding:8px 20px;border-radius:20px;background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);color:#a78bfa">🔧 Segera Kembali</div>';
  document.body.appendChild(ov); document.body.style.overflow = 'hidden';
}

