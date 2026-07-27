let allProductReviews = {};
let reviewingProdIdx = null;
let selectedStars = 5;
let ulasanData = [];
const DB_KEY_ULASAN = 'store-ulasan';

function getProductReviews(prodId) {
  return allProductReviews[prodId] || [];
}

function getReviewStats(reviews) {
  const total = reviews.length;
  if (!total) return { avg: 5.0, total: 0 };
  const avg = Math.round((reviews.reduce((s, u) => s + (u.stars || 5), 0) / total) * 10) / 10;
  return { avg, total };
}

async function loadAllProductReviews() {
  const data = await dbGet('store-product-reviews');
  if (data && typeof data === 'object') allProductReviews = data;
  else allProductReviews = {};
}

async function saveProductReview(prodId, review) {
  if (!allProductReviews[prodId]) allProductReviews[prodId] = [];
  allProductReviews[prodId].push(review);
  return await dbSet('store-product-reviews', allProductReviews);
}

async function likeProductReview(prodId, idx) {
  if (!allProductReviews[prodId] || idx < 0 || idx >= allProductReviews[prodId].length) return;
  allProductReviews[prodId][idx].likes = (allProductReviews[prodId][idx].likes || 0) + 1;
  await dbSet('store-product-reviews', allProductReviews);
}

function renderMiniReviews(prodId, container) {
  const reviews = getProductReviews(prodId);
  const { avg, total } = getReviewStats(reviews);
  const last2 = reviews.slice(-2).reverse();
  const prodIdx = products.findIndex(p => p.id === prodId);
  const openReviewsHandler = prodIdx >= 0 ? `openProductReviewsModal(${prodIdx})` : '';
  const writeReviewHandler = prodIdx >= 0 ? `openWriteReviewModal(${prodIdx})` : '';
  const miniDiv = document.createElement('div');
  miniDiv.className = 'card-reviews-mini';
  let html = `<div class="card-reviews-mini-title">
    <span>⭐ ${avg.toFixed(1)} (${total} ulasan)</span>
    ${openReviewsHandler ? `<span class="see-all" onclick="event.stopPropagation();${openReviewsHandler}">Lihat semua →</span>` : ''}</div>`;
  if (last2.length === 0) {
    html += `<div class="mini-empty">Belum ada ulasan. Jadilah yang pertama! 🌟</div>`;
  } else {
    last2.forEach(r => {
      const nama = escapeHtml(r.nama || 'Anonim');
      const teks = escapeHtml(r.teks || '');
      html += `<div class="mini-review-item">
        <div class="mini-review-av">${nama.charAt(0).toUpperCase()}</div>
        <div class="mini-review-content">
          <div class="mini-review-name">${nama} <span class="mini-review-stars">${'★'.repeat(r.stars || 5)}</span></div>
          <div class="mini-review-text">${teks}</div>
        </div>
      </div>`;
    });
  }
  if (writeReviewHandler) {
    html += `<button class="btn-write-review" onclick="event.stopPropagation();${writeReviewHandler}">✏️ Tulis Ulasan</button>`;
  }
  miniDiv.innerHTML = html;
  container.appendChild(miniDiv);
}

function renderProductReviewsSection(prodIdx) {
  const p = products[prodIdx];
  const reviews = getProductReviews(p.id);
  const { avg, total } = getReviewStats(reviews);
  const starsHtml = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
  const section = document.getElementById('m-reviews-section');
  const bars = [5, 4, 3, 2, 1].map(s => {
    const cnt = reviews.filter(u => (u.stars || 5) === s).length;
    const pct = total ? Math.round(cnt / total * 100) : 0;
    return { s, cnt, pct };
  });
  section.innerHTML = `
    <div class="vlabel" style="margin-top:4px">Ulasan Pembeli</div>
    <div class="prod-reviews-summary">
      <div style="text-align:center">
        <div class="prod-reviews-score">${avg.toFixed(1)}</div>
        <div class="prod-reviews-stars-big">${starsHtml}</div>
        <div class="prod-reviews-total">${total} ulasan</div>
      </div>
      <div class="prod-review-bars">
        ${bars.map(b => `<div class="prod-review-bar-row">
          <span>${b.s}</span>
          <div class="prod-review-bar-track"><div class="prod-review-bar-fill" style="width:${b.pct}%"></div></div>
          <span>${b.cnt}</span>
        </div>`).join('')}
      </div>
    </div>
    <button class="btn-tulis-prod" onclick="openWriteReviewModal(${prodIdx})">✏️ Tulis Ulasan untuk Produk Ini</button>
    <div class="prod-review-divider">Ulasan Terbaru</div>
    ${total === 0 ? `<div class="prod-reviews-empty"><div class="ei">📭</div>Belum ada ulasan. Jadilah yang pertama!</div>` : ''}
    ${reviews.slice().reverse().map((r, i) => `
      <div class="prod-review-card">
        <div class="prod-review-card-head">
          <div class="prod-review-av">${escapeHtml(r.nama || 'A').charAt(0).toUpperCase()}</div>
          <div class="prod-review-meta">
            <div class="prod-review-nm">${escapeHtml(r.nama || 'Anonim')} <span class="prod-review-verified">✓ Verified</span></div>
            <div class="prod-review-time">${escapeHtml(r.waktu || 'Baru saja')}</div>
          </div>
          <div class="prod-review-stars">${'★'.repeat(r.stars || 5)}</div>
        </div>
        <div class="prod-review-text">${escapeHtml(r.teks || '')}</div>
        <button class="prod-review-like" onclick="likeProductReviewAndRefresh(${prodIdx},${reviews.length - 1 - i})">👍 Membantu ${r.likes || 0}</button>
      </div>`).join('')}`;
}

async function likeProductReviewAndRefresh(prodIdx, revIdx) {
  const p = products[prodIdx];
  await likeProductReview(p.id, revIdx);
  renderProductReviewsSection(prodIdx);
  updateCardStars(p.id);
}

function openProductReviewsModal(prodIdx) {
  openModal(prodIdx);
  setTimeout(() => {
    const section = document.getElementById('m-reviews-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 350);
}

function openWriteReviewModal(prodIdx) {
  reviewingProdIdx = prodIdx;
  selectedStars = 5;
  const prodOverlay = document.getElementById('prod-overlay');
  if (prodOverlay.classList.contains('open')) { prodOverlay.classList.remove('open'); }
  document.getElementById('ulasan-overlay').classList.add('open');
  const body = document.getElementById('ulasan-body');
  const p = products[prodIdx];
  body.innerHTML = `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:14px;display:flex;align-items:center;gap:10px">
      <div style="font-size:20px">${p.cat === 'bot-wa' ? '💬' : p.cat === 'panel' ? '🖥️' : '📦'}</div>
      <div><div style="font-size:12px;font-weight:600;color:#fff">${escapeHtml(p.title)}</div><div style="font-size:10px;color:var(--muted)">${p.cat === 'bot-wa' ? 'Bot WA' : p.cat === 'panel' ? 'Panel' : p.cat === 'source-code' ? 'Source Code' : p.cat}</div></div>
    </div>
    <div class="fg"><label class="fl">Nama Kamu</label><input class="fi" id="ul-nama" placeholder="Nama kamu..." maxlength="30"></div>
    <div class="fg">
      <label class="fl">Rating</label>
      <div class="star-picker" id="star-picker">
        <span onclick="setStars(1)">⭐</span><span onclick="setStars(2)">⭐</span><span onclick="setStars(3)">⭐</span><span onclick="setStars(4)">⭐</span><span onclick="setStars(5)">⭐</span>
      </div>
    </div>
    <div class="fg"><label class="fl">Ulasan</label><textarea class="fta" id="ul-teks" placeholder="Ceritakan pengalamanmu..." rows="3" style="min-height:80px"></textarea></div>
    <button class="btn-order" onclick="submitProductReview()">📨 Kirim Ulasan</button>
    <button style="width:100%;margin-top:9px;padding:10px;background:none;border:1px solid var(--border);border-radius:9px;color:var(--muted);font-size:12px;cursor:pointer;font-family:Sora,sans-serif" onclick="closeUlasanModal()">Batal</button>`;
  updateStarPicker(5);
}

async function submitProductReview() {
  const nama = (document.getElementById('ul-nama').value || '').trim();
  const teks = (document.getElementById('ul-teks').value || '').trim();
  if (!nama || !teks) { showToast('⚠️ Nama dan ulasan wajib diisi!'); return; }
  const now = new Date();
  const waktu = `${now.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][now.getMonth()]} ${now.getFullYear()}`;
  const newR = { nama, teks, stars: selectedStars, waktu, likes: 0 };
  const p = products[reviewingProdIdx];
  const saved = await saveProductReview(p.id, newR);
  if (saved) { showToast('✅ Ulasan berhasil dikirim!'); } else { showToast('⚠️ Gagal menyimpan, coba lagi.'); }
  closeUlasanModal();
  updateCardStars(p.id);
  setTimeout(() => { openModal(reviewingProdIdx); }, 350);
}

function updateCardStars(prodId) {
  const reviews = getProductReviews(prodId);
  const { avg, total } = getReviewStats(reviews);
  document.querySelectorAll(`.product-card[data-prodid="${prodId}"]`).forEach(card => {
    const sc = card.querySelector('.star-count');
    const sr = card.querySelector('.star-review');
    if (sc) sc.textContent = ` ${avg.toFixed(1)}`;
    if (sr) sr.textContent = ` (${total})`;
    const oldMini = card.querySelector('.card-reviews-mini');
    if (oldMini) { oldMini.remove(); renderMiniReviews(prodId, card); }
  });
}

function openUlasanModal() {
  reviewingProdIdx = null;
  document.getElementById('ulasan-overlay').classList.add('open');
  loadGlobalUlasan();
}

function closeUlasanModal() { document.getElementById('ulasan-overlay').classList.remove('open'); }

async function loadGlobalUlasan() {
  document.getElementById('ulasan-body').innerHTML = `<div style="text-align:center;padding:24px"><div style="font-size:22px;margin-bottom:8px">⭐</div><div style="font-size:12px;color:var(--muted)">Memuat ulasan...</div></div>`;
  const data = await dbGet(DB_KEY_ULASAN);
  ulasanData = normalizeArray(data);
  renderGlobalUlasanList();
}

function renderGlobalUlasanList() {
  const total = ulasanData.length;
  const avg = total ? Math.round((ulasanData.reduce((s, u) => s + (u.stars || 5), 0) / total) * 10) / 10 : 5.0;
  const starsHtml = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));
  const body = document.getElementById('ulasan-body');
  body.innerHTML = `
    <div class="ulasan-stat">
      <div style="text-align:center">
        <div class="ulasan-score">${avg.toFixed(1)}</div>
        <div class="ulasan-stars-big">${starsHtml}</div>
        <div class="ulasan-total">${total} ulasan</div>
      </div>
      <div style="flex:1">
        ${[5, 4, 3, 2, 1].map(s => {
          const cnt = ulasanData.filter(u => (u.stars || 5) === s).length;
          const pct = total ? Math.round(cnt / total * 100) : 0;
          return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="font-size:10px;color:var(--muted);width:12px">${s}</span>
            <div style="flex:1;height:5px;background:var(--bg);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--gold);border-radius:3px"></div></div>
            <span style="font-size:10px;color:var(--muted);width:14px">${cnt}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
    <button class="btn-tulis" onclick="showGlobalUlasanForm()">✏️ Tulis Ulasan</button>
    <div class="inapp-divider">Ulasan Pembeli</div>
    ${total === 0 ? `<div class="inapp-empty">📭 Belum ada ulasan. Jadilah yang pertama!</div>` : ''}
    ${ulasanData.slice().reverse().map((u, i) => `
      <div class="ulasan-card">
        <div class="ulasan-card-head">
          <div class="ulasan-av">${escapeHtml(u.nama || 'A').charAt(0).toUpperCase()}</div>
          <div class="ulasan-meta">
            <div class="ulasan-nm">${escapeHtml(u.nama || 'Anonim')} <span class="ulasan-verified">✓ Verified</span></div>
            <div class="ulasan-time">${escapeHtml(u.waktu || 'Baru saja')}</div>
          </div>
          <div class="ulasan-stars">${'★'.repeat(u.stars || 5)}</div>
        </div>
        <div class="ulasan-text">${escapeHtml(u.teks || '')}</div>
        <button class="ulasan-like" onclick="likeGlobalUlasan(${ulasanData.length - 1 - i})">👍 Membantu ${u.likes || 0}</button>
      </div>`).join('')}`;
}

function showGlobalUlasanForm() {
  selectedStars = 5;
  const body = document.getElementById('ulasan-body');
  body.innerHTML = `
    <button style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--muted);background:none;border:none;cursor:pointer;padding:0;margin-bottom:16px;font-family:Sora,sans-serif" onclick="renderGlobalUlasanList()">← Kembali</button>
    <div class="fg"><label class="fl">Nama Kamu</label><input class="fi" id="ul-nama" placeholder="Nama kamu..." maxlength="30"></div>
    <div class="fg"><label class="fl">Rating</label>
      <div class="star-picker" id="star-picker">
        <span onclick="setStars(1)">⭐</span><span onclick="setStars(2)">⭐</span><span onclick="setStars(3)">⭐</span><span onclick="setStars(4)">⭐</span><span onclick="setStars(5)">⭐</span>
      </div>
    </div>
    <div class="fg"><label class="fl">Ulasan</label><textarea class="fta" id="ul-teks" placeholder="Ceritakan pengalamanmu..." rows="3" style="min-height:80px"></textarea></div>
    <button class="btn-order" onclick="submitGlobalUlasan()">📨 Kirim Ulasan</button>`;
  updateStarPicker(5);
}

async function submitGlobalUlasan() {
  const nama = (document.getElementById('ul-nama').value || '').trim();
  const teks = (document.getElementById('ul-teks').value || '').trim();
  if (!nama || !teks) { showToast('⚠️ Nama dan ulasan wajib diisi!'); return; }
  const now = new Date();
  const waktu = `${now.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][now.getMonth()]} ${now.getFullYear()}`;
  ulasanData.push({ nama, teks, stars: selectedStars, waktu, likes: 0 });
  const saved = await dbSet(DB_KEY_ULASAN, ulasanData);
  if (saved) { showToast('✅ Ulasan berhasil dikirim!'); } else { showToast('⚠️ Gagal menyimpan, coba lagi.'); }
  setTimeout(() => { renderGlobalUlasanList(); }, 400);
}

async function likeGlobalUlasan(idx) {
  if (idx < 0 || idx >= ulasanData.length) return;
  ulasanData[idx].likes = (ulasanData[idx].likes || 0) + 1;
  await dbSet(DB_KEY_ULASAN, ulasanData);
  renderGlobalUlasanList();
}

function setStars(n) { selectedStars = n; updateStarPicker(n); }
function updateStarPicker(n) {
  document.querySelectorAll('#star-picker span').forEach((el, i) => { el.classList.toggle('lit', i < n); });
}

