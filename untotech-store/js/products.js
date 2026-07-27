let products = [];
const DEFAULT_PRODUCTS = [];
let activeIdx = null, activeVar = 0;
let heroSlides = null;
let currentSlide = 0, sliderInterval = null;
const BG_CLASSES = ['', 'bg2', 'bg3'];

function buildHeroSlides() {
  const slidesEl = document.getElementById('hero-slides');
  const dotsEl = document.getElementById('hero-dots');
  if (!slidesEl || !dotsEl) return;
  slidesEl.innerHTML = ''; dotsEl.innerHTML = '';
  const slides = heroSlides && heroSlides.length ? heroSlides : products.map((p, i) => ({
    badge: p.cat === 'bot-wa' ? 'Sewa Bot' : p.cat === 'panel' ? 'Panel' : p.cat === 'source-code' ? 'Source Code' : p.cat || 'Produk',
    title: p.title, subtitle: p.desc ? p.desc.split('.')[0] : p.title,
    btnLabel: 'Lihat →', prodIdx: i, imgUrl: p.imgUrl || '', bgClass: BG_CLASSES[i % 3], titleOverlay: p.imgTitle || p.title,
  }));
  slides.forEach((s, i) => {
    const slide = document.createElement('div'); slide.className = 'hero-slide';
    const bg = document.createElement('div'); bg.className = 'hero-anime-bg' + (s.bgClass ? ' ' + s.bgClass : '');
    if (s.imgUrl) { bg.classList.add('bg-img'); bg.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55)),url('${s.imgUrl}')`; }
    slide.appendChild(bg);
    if (!s.imgUrl) {
      const o1 = document.createElement('div'); o1.style.cssText = 'position:absolute;top:18%;right:8%;width:85px;height:85px;border-radius:50%;background:radial-gradient(circle,rgba(140,50,240,.42),transparent 70%);z-index:1;pointer-events:none;animation:floatOrb 5s ease-in-out infinite'; slide.appendChild(o1);
      const o2 = document.createElement('div'); o2.style.cssText = 'position:absolute;top:38%;right:28%;width:50px;height:50px;border-radius:50%;background:radial-gradient(circle,rgba(210,70,240,.28),transparent 70%);z-index:1;pointer-events:none;animation:floatOrb 4s ease-in-out infinite;animation-delay:1.5s'; slide.appendChild(o2);
    }
    const content = document.createElement('div'); content.className = 'hero-content';
    content.innerHTML = `<div class="hero-badge">${s.badge}</div><h1>${s.title}</h1><p id="hero-tw-${i}">${s.subtitle}</p><button class="btn-hero" onclick="openModal(${s.prodIdx != null ? s.prodIdx : 0})">${s.btnLabel || 'Lihat →'}</button>`;
    slide.appendChild(content);
    const ov = document.createElement('div'); ov.className = 'hero-title-overlay'; ov.textContent = s.titleOverlay || s.title; slide.appendChild(ov);
    if (i === 0) {
      const si = document.createElement('div');
      si.className = 'scroll-indicator';
      si.innerHTML = '<div class="scroll-indicator-line"></div>';
      slide.appendChild(si);
    }
    slidesEl.appendChild(slide);
    const dot = document.createElement('div'); dot.className = 'hero-dot' + (i === 0 ? ' active' : ''); dot.onclick = () => goToSlide(i); dotsEl.appendChild(dot);
  });
  let tX = 0;
  slidesEl.addEventListener('touchstart', e => { tX = e.touches[0].clientX; }, { passive: true });
  slidesEl.addEventListener('touchend', e => { const d = tX - e.changedTouches[0].clientX; if (Math.abs(d) > 50) { d > 0 ? nextSlide() : prevSlide(); } });
  startSlider(slides.length);
}

function goToSlide(idx) {
  const s = document.getElementById('hero-slides');
  const dots = document.querySelectorAll('.hero-dot');
  currentSlide = idx;
  if (s) s.style.transform = `translateX(-${idx * 100}%)`;
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}

function nextSlide() { const n = document.querySelectorAll('.hero-dot').length; goToSlide((currentSlide + 1) % n); }
function prevSlide() { const n = document.querySelectorAll('.hero-dot').length; goToSlide((currentSlide - 1 + n) % n); }
function startSlider(count) { if (sliderInterval) clearInterval(sliderInterval); if (count > 1) sliderInterval = setInterval(nextSlide, 3500); }

function renderProductGrid() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const catMap = { 'bot-wa': 'bot', 'panel': 'panel', 'source-code': 'sc' };
  products.forEach((p, i) => {
    const featured = (i === products.length - 1 && products.length % 2 !== 0) || p.featured;
    const card = document.createElement('div');
    card.className = 'product-card' + (featured ? ' featured' : '');
    card.dataset.cat = p.cat || 'semua';
    card.dataset.prodid = p.id;
    card.onclick = () => openModal(i);
    let cardImgStyle = '';
    if (p.imgUrl) { cardImgStyle = `background-image:linear-gradient(to top,rgba(4,1,12,.92) 0%,rgba(4,1,12,.4) 58%,rgba(4,1,12,.05) 100%),url('${p.imgUrl}');background-size:cover;background-position:center;`; }
    const imgClass = catMap[p.cat] || 'bot';
    const reviews = getProductReviews(p.id);
    const { avg, total } = getReviewStats(reviews);
    card.innerHTML = `
      <div class="card-img ${p.imgUrl ? '' : imgClass}" style="${cardImgStyle}">
        ${!p.imgUrl ? `<div class="orb" style="width:${featured ? '65' : '52'}px;height:${featured ? '65' : '52'}px;top:9%;right:11%;background:radial-gradient(circle,rgba(160,60,255,.52),transparent 70%)"></div>
        <div class="orb" style="width:32px;height:32px;bottom:22%;left:14%;background:radial-gradient(circle,rgba(200,60,240,.38),transparent 70%);animation-delay:2s"></div>` : ''}
        <div class="card-img-label">
          <div class="card-title-img">${(p.imgTitle || p.title).replace(/<[^>]+>/g, '')}</div>
          <div class="card-sub-img">${STORE_NAME}</div>
        </div>
      </div>
      <span class="badge-new">Baru</span>
      <span class="badge-type">${p.cat === 'bot-wa' ? 'Sewa Bot' : p.cat === 'panel' ? 'Panel' : p.cat === 'source-code' ? 'Download' : p.cat || 'Produk'}</span>
      <div class="card-body">
        <div class="card-name">${p.title}</div>
        <div class="card-category">${p.cat === 'bot-wa' ? 'Bot WA' : p.cat === 'panel' ? 'Panel' : p.cat === 'source-code' ? 'Source Code' : p.cat || 'Lainnya'}</div>
        <div class="stars"><span class="star-icons">★★★★★</span><span class="star-count"> ${avg.toFixed(1)}</span><span class="star-review"> (${total})</span></div>
        <div class="card-price">${p.price || 'Rp0'}</div>
        <div class="stock-info"><span class="stock-dot"></span>Stok Unlimited</div>
      </div>`;
    renderMiniReviews(p.id, card);
    grid.appendChild(card);
  });
  const pc = document.getElementById('prod-count');
  if (pc) pc.textContent = `${products.length} Produk`;
  setTimeout(() => {
    if (typeof injectCardShine === 'function') injectCardShine();
    if (typeof initCardTilt === 'function') initCardTilt();
    if (typeof addViewCounts === 'function') addViewCounts();
    if (typeof addFlashBadges === 'function') addFlashBadges();
    if (typeof initScrollReveal === 'function') initScrollReveal();
  }, 60);
}

function openModal(idx) {
  activeIdx = idx; activeVar = 0;
  const p = products[idx];
  const catMap = { 'bot-wa': 'bot', 'panel': 'panel', 'source-code': 'sc' };
  const imgEl = document.getElementById('m-modal-img');
  if (!imgEl) return;
  imgEl.className = 'modal-img ' + (catMap[p.cat] || 'bot');
  if (p.imgUrl) {
    imgEl.style.backgroundImage = `linear-gradient(to top,rgba(4,1,12,.96) 0%,rgba(4,1,12,.42) 58%,rgba(4,1,12,.08) 100%),url('${p.imgUrl}')`;
    imgEl.style.backgroundSize = 'cover';
    imgEl.style.backgroundPosition = 'center';
  } else { imgEl.style.backgroundImage = ''; imgEl.style.backgroundSize = ''; }
  const mImgTitle = document.getElementById('m-img-title');
  const mTitle = document.getElementById('m-title');
  const mPrice = document.getElementById('m-price');
  const mAvail = document.getElementById('m-avail');
  const mDesc = document.getElementById('m-desc');
  if (mImgTitle) mImgTitle.textContent = p.imgTitle || p.title;
  if (mTitle) mTitle.textContent = p.title;
  if (mPrice) mPrice.textContent = p.price;
  if (mAvail) mAvail.textContent = p.available;
  if (mDesc) mDesc.textContent = p.desc;
  const vg = document.getElementById('m-varians');
  if (vg) {
    vg.innerHTML = '';
    (p.varians || []).forEach((v, i) => {
      const b = document.createElement('button'); b.className = 'vbtn' + (i === 0 ? ' active' : '');
      b.innerHTML = `<div class="vbtn-name">${v.name}</div><div class="vbtn-price">${v.price}</div>`;
      b.onclick = () => {
        document.querySelectorAll('.vbtn').forEach(x => x.classList.remove('active'));
        b.classList.add('active'); activeVar = i;
        const mp = document.getElementById('m-price');
        if (mp) mp.textContent = v.price;
      };
      vg.appendChild(b);
    });
  }
  const fg = document.getElementById('m-features');
  if (fg) {
    fg.innerHTML = '';
    (p.features || []).forEach(f => {
      fg.innerHTML += `<div class="fcard"><div class="fcard-icon">${f.icon || '⭐'}</div><div class="fcard-name">${f.name || ''}</div><div class="fcard-desc">${f.desc || ''}</div></div>`;
    });
  }
  if (typeof renderProductReviewsSection === 'function') renderProductReviewsSection(idx);
  document.getElementById('prod-overlay').classList.add('open');
}

function closeProdBg(e) { if (e.target === document.getElementById('prod-overlay')) closeProd(); }
function closeProd() { document.getElementById('prod-overlay').classList.remove('open'); }

function filterTab(el, cat) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  let n = 0;
  document.querySelectorAll('.product-card').forEach(c => {
    const s = cat === 'semua' || c.dataset.cat === cat;
    c.style.display = s ? '' : 'none';
    if (s) n++;
  });
  const pc = document.getElementById('prod-count');
  if (pc) pc.textContent = `${n} Produk`;
}

