function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(10px)'; }, 2800);
}

function escapeHtml(t) {
  if (typeof t !== 'string') t = String(t || '');
  return t.replace(/&/g, '&amp;').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '&#39;');
}

function renderDrawer(items) {
  const ul = document.getElementById('drawer-menu-list');
  if (!ul) return;
  const defaults = [
    { label: '🏠 Home', url: '#top' }, { label: '🤖 Perpanjang Sewa Bot', url: '#renew-bot' },
    { label: '🔄 Perpanjang Panel', url: '#renew' }, { label: '🔍 Track Order', url: '#track' },
    { label: '⭐ Ulasan', url: '#ulasan' }, { label: '💬 Live Chat', url: '#chat' }
  ];
  const list = items && items.length ? items : defaults;
  ul.innerHTML = '';
  list.forEach(it => {
    const li = document.createElement('li'); const a = document.createElement('a'); a.href = '#';
    const url = (it.url || '#').trim();
    if (url === '#top' || url === '#') { a.onclick = e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); closeDrawer(); }; }
    else if (url === '#chat') { a.onclick = e => { e.preventDefault(); closeDrawer(); setTimeout(() => toggleChat(), 220); }; }
    else if (url === '#renew') { a.onclick = e => { e.preventDefault(); closeDrawer(); setTimeout(() => openRenewModal(), 200); }; }
    else if (url === '#renew-bot') { a.onclick = e => { e.preventDefault(); closeDrawer(); setTimeout(() => openRenewBotModal(), 200); }; }
    else if (url === '#track') { a.onclick = e => { e.preventDefault(); closeDrawer(); setTimeout(() => openTrackModal(), 200); }; }
    else if (url === '#ulasan') { a.onclick = e => { e.preventDefault(); closeDrawer(); setTimeout(() => openUlasanModal(), 200); }; }
    else if (url.startsWith('wa:')) { const msg = url.slice(3); a.onclick = e => { e.preventDefault(); window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`, '_blank'); closeDrawer(); }; }
    else if (url.startsWith('http')) { a.href = url; a.target = '_blank'; a.onclick = () => closeDrawer(); }
    else { a.onclick = e => e.preventDefault(); }
    const parts = it.label.match(/^(\S+)\s(.+)$/);
    if (parts) { a.innerHTML = `<span class="mi">${parts[1]}</span>${parts[2]}`; } else { a.textContent = it.label; }
    li.appendChild(a); ul.appendChild(li);
  });
}

function openDrawer() { document.getElementById('drawer').classList.add('open'); document.getElementById('drawer-overlay').classList.add('open'); }
function closeDrawer() { document.getElementById('drawer').classList.remove('open'); document.getElementById('drawer-overlay').classList.remove('open'); }

function bnSwitch(tab) {
  document.querySelectorAll('.bn-item').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('bn-' + tab); if (el) el.classList.add('active');
  if (tab === 'store') { closeVdl(); closeGchat(); }
}

function openRenewModal() { renderRenewForm(); document.getElementById('renew-overlay').classList.add('open'); }
function closeRenewModal() { document.getElementById('renew-overlay').classList.remove('open'); }

function renderRenewForm() {
  document.getElementById('renew-body').innerHTML = `
    <div class="fg"><label class="fl">Username Panel</label><input class="fi" id="rn-username" placeholder="contoh: botku123" type="text"><div class="fhint">Harus persis sama dengan saat beli.</div></div>
    <div class="fg"><label class="fl">Paket RAM</label><select class="fi" id="rn-durasi" style="cursor:pointer"><option value="RAM 2GB — Rp4.000">📦 RAM 2GB — Rp4.000</option><option value="RAM 3GB — Rp5.000">📦 RAM 3GB — Rp5.000</option><option value="RAM 4GB — Rp6.000">📦 RAM 4GB — Rp6.000</option><option value="RAM 5GB — Rp7.000">📦 RAM 5GB — Rp7.000</option><option value="RAM 6GB — Rp8.000">📦 RAM 6GB — Rp8.000</option><option value="RAM 7GB — Rp9.000">📦 RAM 7GB — Rp9.000</option><option value="RAM 10GB — Rp15.000">📦 RAM 10GB — Rp15.000 🔥 Populer</option><option value="RAM 15GB — Rp20.000">📦 RAM 15GB — Rp20.000</option><option value="RAM 20GB — Rp25.000">📦 RAM 20GB — Rp25.000</option><option value="RAM UNLIMITED — Rp30.000">📦 RAM UNLIMITED — Rp30.000 👑 Best Deal</option></select></div>
    <div class="fg"><label class="fl">Nomor WA Kamu</label><input class="fi" id="rn-wa" placeholder="628xxxxxxxxxx" type="tel"></div>
    <button class="btn-order" style="margin-top:4px" onclick="submitRenew()">🔄 Perpanjang Sekarang</button>
    <div class="wa-note" style="margin-top:9px">Kamu akan diarahkan ke <strong>WhatsApp Admin</strong> ✅</div>`;
}

function submitRenew() {
  const username = document.getElementById('rn-username').value.trim();
  const durasi = document.getElementById('rn-durasi').value;
  const wa = document.getElementById('rn-wa').value.trim();
  if (!username || !wa) { showToast('⚠️ Lengkapi username dan nomor WA!'); return; }
  const msg = `🔄 *PERPANJANG PANEL BOT WA*\n━━━━━━━━━━━━━━━━━━\nUsername  : ${username}\nPaket RAM : ${durasi}\nNomor WA  : ${wa}\n━━━━━━━━━━━━━━━━━━\n🛒 _Via UnoTech Store_`;
  window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`, '_blank');
}

function openRenewBotModal() { renderRenewBotForm(); document.getElementById('renew-bot-overlay').classList.add('open'); }
function closeRenewBotModal() { document.getElementById('renew-bot-overlay').classList.remove('open'); }

function renderRenewBotForm() {
  document.getElementById('renew-bot-body').innerHTML = `
    <div class="fg"><label class="fl">Nomor WA Bot / Grup</label><input class="fi" id="rb-grup" placeholder="Contoh: Grup Gaming Squad" type="text"><div class="fhint">Nama grup atau nomor WA bot yang aktif.</div></div>
    <div class="fg"><label class="fl">Durasi Perpanjangan</label><select class="fi" id="rb-durasi" style="cursor:pointer"><option value="1 Hari — Rp500">1 Hari — Rp500</option><option value="3 Hari — Rp2.000">3 Hari — Rp2.000</option><option value="5 Hari — Rp3.500">5 Hari — Rp3.500</option><option value="7 Hari — Rp4.000">7 Hari — Rp4.000</option><option value="14 Hari — Rp6.000">14 Hari — Rp6.000</option><option value="1 Bulan — Rp7.000">1 Bulan — Rp7.000</option><option value="3 Bulan — Rp26.000">3 Bulan — Rp26.000</option><option value="1 Tahun — Rp40.000">1 Tahun — Rp40.000</option></select></div>
    <div class="fg"><label class="fl">Nomor WA Kamu</label><input class="fi" id="rb-wa" placeholder="628xxxxxxxxxx" type="tel"></div>
    <button class="btn-order" style="margin-top:4px" onclick="submitRenewBot()">🤖 Perpanjang Sekarang</button>
    <div class="wa-note" style="margin-top:9px">Kamu akan diarahkan ke <strong>WhatsApp Admin</strong> ✅</div>`;
}

function submitRenewBot() {
  const grup = document.getElementById('rb-grup').value.trim();
  const durasi = document.getElementById('rb-durasi').value;
  const wa = document.getElementById('rb-wa').value.trim();
  if (!grup || !wa) { showToast('⚠️ Lengkapi nama grup dan nomor WA!'); return; }
  const msg = `🤖 *PERPANJANG SEWA BOT WA*\n━━━━━━━━━━━━━━━━━━\nGrup/Bot  : ${grup}\nDurasi    : ${durasi}\nNomor WA  : ${wa}\n━━━━━━━━━━━━━━━━━━\n🛒 _Via UnoTech Store_`;
  window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`, '_blank');
}

function openTrackModal() { renderTrackForm(); document.getElementById('track-overlay').classList.add('open'); }
function closeTrackModal() { document.getElementById('track-overlay').classList.remove('open'); }

function renderTrackForm(result) {
  const body = document.getElementById('track-body');
  body.innerHTML = `
    <div class="fg"><label class="fl">Nomor WA atau ID Transaksi</label><input class="fi" id="track-input" placeholder="0812xxxxxxxx  atau  TRX-xxxxxx" type="text" value="${result ? escapeHtml(result._query || '') : ''}"></div>
    <button class="btn-order" style="margin-top:0" onclick="submitTrack()">🔍 Cari Order</button>
    ${result ? renderTrackResult(result) : ''}
    <div style="margin-top:15px"></div>
    <div class="wa-note">Tidak menemukan order? <span style="color:var(--purple-light);cursor:pointer" onclick="contactAdmin()">Hubungi admin via WA</span></div>`;
}

async function submitTrack() {
  const q = document.getElementById('track-input').value.trim();
  if (!q) { showToast('⚠️ Masukkan nomor WA atau ID transaksi!'); return; }
  document.getElementById('track-body').innerHTML = `<div style="text-align:center;padding:24px"><div style="font-size:22px;margin-bottom:8px">🔍</div><div style="font-size:12px;color:var(--muted)">Mencari order...</div></div>`;
  try {
    const data = await dbGet('store-orders');
    const orders = normalizeArray(data);
    const found = orders.filter(o => o && ((o.wa && o.wa.replace(/\D/g, '').includes(q.replace(/\D/g, ''))) || (o.id && o.id.toLowerCase().includes(q.toLowerCase()))));
    renderTrackForm(found.length ? { _query: q, found } : { _query: q, found: [], notFound: true });
  } catch { renderTrackForm({ _query: q, found: [], error: true }); }
}

function renderTrackResult(result) {
  if (result.error) return `<div class="result-card"><div class="inapp-empty">❌ Gagal mengambil data. Hubungi admin via WA.</div></div>`;
  if (result.notFound || !result.found || !result.found.length) return `<div class="result-card"><div style="text-align:center;padding:16px 0"><div style="font-size:26px;margin-bottom:8px">📭</div><div style="font-size:13px;font-weight:600;color:#fff;margin-bottom:4px">Order tidak ditemukan</div><div style="font-size:11px;color:var(--muted);line-height:1.6">Pastikan nomor WA atau ID transaksi benar.</div><button class="btn-order" style="margin-top:14px;width:auto;padding:10px 20px;font-size:12px" onclick="contactAdmin()">💬 Hubungi Admin WA</button></div></div>`;
  return result.found.map(o => {
    const sc = o.status === 'aktif' ? 'ok' : o.status === 'expired' ? 'expired' : 'warn';
    return `<div class="result-card"><div class="result-row"><span class="result-label">ID Order</span><span class="result-val">${escapeHtml(o.id || '-')}</span></div><div class="result-row"><span class="result-label">Produk</span><span class="result-val">${escapeHtml(o.produk || '-')}</span></div><div class="result-row"><span class="result-label">Durasi</span><span class="result-val">${escapeHtml(o.durasi || '-')}</span></div><div class="result-row"><span class="result-label">Tanggal</span><span class="result-val">${escapeHtml(o.tanggal || '-')}</span></div><div class="result-row"><span class="result-label">Aktif s/d</span><span class="result-val">${escapeHtml(o.expiry || '-')}</span></div><div class="result-row"><span class="result-label">Status</span><span class="result-val ${sc}">${escapeHtml(o.status || '-')}</span></div></div>`;
  }).join('');
}

async function loadStoreData() {
  try {
    const _fbUrl = window.FIREBASE_URL || (typeof FIREBASE_URL !== 'undefined' ? FIREBASE_URL : '') || 'https://store-minzy-default-rtdb.asia-southeast1.firebasedatabase.app';
    const _maintCtrl = new AbortController(); const _maintTimer = setTimeout(() => _maintCtrl.abort(), 3000);
    const r = await fetch(`${_fbUrl}/store/store-fitur.json`, { signal: _maintCtrl.signal });
    clearTimeout(_maintTimer);
    if (r.ok) { const fitur = await r.json(); if (fitur && fitur.maintenance === true) { _showMaintenanceOverlay(); return; } }
  } catch (e) { console.warn('[Store] Maintenance check skipped:', e.message); }
  try {
    const [info, kontak, prods, imgCfg, heroCfg, payCfg, orderFmtCfg] = await Promise.all([
      dbGet('store-info'), dbGet('store-kontak'), dbGet('store-produk'), dbGet('store-img-produk'), dbGet('store-hero-slides'), dbGet('store-payment'), dbGet('store-order-format'),
    ]);
    if (kontak?.adminWa) ADMIN_WA = kontak.adminWa;
    if (kontak?.grupBuyer) GRUP_BUYER = kontak.grupBuyer;
    if (info?.nama) STORE_NAME = info.nama;
    if (payCfg) PAYMENT_CFG = { ...PAYMENT_CFG, ...payCfg };
    if (orderFmtCfg && typeof orderFmtCfg === 'object') { orderFormat = { ...JSON.parse(JSON.stringify(DEFAULT_ORDER_FORMAT)), ...orderFmtCfg }; }
    let needRerender = false;
    if (prods && prods.length) { products = prods.map(p => { const imgOverride = imgCfg?.[p.id]; return { ...p, imgUrl: imgOverride || p.imgUrl || '' }; }); needRerender = true; }
    else if (imgCfg) { products = products.map(p => ({ ...p, imgUrl: imgCfg[p.id] || '' })); needRerender = true; }
    if (heroCfg && heroCfg.length) { heroSlides = heroCfg; needRerender = true; }
    if (info?.nama) {
      const avatarEl = document.querySelector('.nav-logo .avatar'); if (avatarEl) avatarEl.textContent = (info.nama || 'U').charAt(0).toUpperCase();
      const nameEl = document.querySelector('.nav-logo .store-name-text'); if (nameEl) nameEl.textContent = info.nama;
      document.title = info.nama;
    }
    const marquee = await dbGet('store-marquee');
    if (marquee && marquee.length) { const inner = document.querySelector('.marquee-inner'); if (inner) { const doubled = [...marquee, ...marquee]; inner.innerHTML = doubled.map((t, i) => `<span>${t}</span>${i < doubled.length - 1 ? '<span class="marquee-dot">•</span>' : ''}`).join(''); } }
    const drawer = await dbGet('store-drawer'); renderDrawer(drawer && drawer.length ? drawer : null);
    if (needRerender) {
      renderProductGrid(); buildHeroSlides();
      setTimeout(() => { injectCardShine(); initCardTilt(); addViewCounts(); addFlashBadges(); initScrollReveal(); }, 100);
    }
    loadAiCsAndScConfig();
  } catch (e) { console.error('loadStoreData error:', e); }
}

const MESH_CSS = { purple: 'radial-gradient(ellipse at 20% 20%,rgba(124,58,237,.6) 0%,transparent 50%),linear-gradient(135deg,#05050f,#0d0520)', cyan: 'radial-gradient(ellipse at 20% 20%,rgba(0,229,255,.4) 0%,transparent 50%),linear-gradient(135deg,#020d12,#061220)', fire: 'radial-gradient(ellipse at 20% 20%,rgba(239,68,68,.5) 0%,transparent 50%),linear-gradient(135deg,#0f0505,#1a0a05)', ocean: 'radial-gradient(ellipse at 20% 20%,rgba(6,182,212,.5) 0%,transparent 50%),linear-gradient(135deg,#020d10,#050d1a)' };

async function applyBg() {
  try { const cfg = await dbGet('store-tampilan'); if (!cfg?.background) return; const bg = cfg.background;
    if (bg.type === 'gradient' && bg.value) document.body.style.background = bg.value;
    else if (bg.type === 'image' && bg.url) { const op = (bg.opacity || 60) / 100; document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,${op}),rgba(0,0,0,${op})),url('${bg.url}')`; document.body.style.backgroundSize = 'cover'; document.body.style.backgroundAttachment = 'fixed'; }
    else if (bg.type === 'mesh') document.body.style.background = MESH_CSS[bg.theme || 'purple'];
  } catch (e) { }
}

async function loadAiCsAndScConfig() {
  try {
    const [aiCfg, scCfg] = await Promise.all([dbGet('store-ai-cs'), dbGet('store-sc-config')]);
    if (aiCfg) {
      CS_AI_ACTIVE = aiCfg.active !== false;
      if (aiCfg.name) CS_AI_NAME = aiCfg.name;
      if (aiCfg.prompt) CS_SYSTEM_PROMPT = aiCfg.prompt;
      if (aiCfg.fakeBuyers && aiCfg.fakeBuyers.length) FAKE_BUYERS = aiCfg.fakeBuyers;
      const nameEl = document.querySelector('.chat-head-name');
      if (nameEl) nameEl.innerHTML = CS_AI_NAME + ' <span class="chat-ai-badge">AI</span>';
      const inputEl = document.getElementById('chat-input');
      if (inputEl) inputEl.placeholder = `Tanya ${CS_AI_NAME} sesuatu...`;
    }
    if (scCfg) {
      if (scCfg.url) SCRIPT_DL_URL = scCfg.url;
      if (scCfg.filename) SCRIPT_DL_FILENAME = scCfg.filename;
      if (scCfg.version) SCRIPT_DL_VERSION = scCfg.version;
      const fnEl = document.querySelector('.dl-script-info-row strong');
      if (fnEl && scCfg.filename) fnEl.textContent = scCfg.filename;
    }
  } catch (e) { console.warn('loadAiCsAndScConfig error:', e); }
}

async function initStore() {
  initLoadingScreen();
  initParticles();
  initCursorGlow();
  showSkeletonGrid();
  renderDrawer(null);
  applyBg();
  await loadAllProductReviews();
  renderProductGrid();
  buildHeroSlides();
  initProofDropzone();
  loadStoreData();
  setTimeout(() => { injectCardShine(); initCardTilt(); addViewCounts(); addFlashBadges(); initScrollReveal(); }, 200);
  setTimeout(() => { startFloatNotifs(); startLiveVisitorCounter(); const bcb = document.getElementById('buyer-count-badge'); if (bcb) animateCounter(bcb, 1247); }, 1000);
  setTimeout(initTypewriter, 1400);
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initStore); } else { initStore(); }

