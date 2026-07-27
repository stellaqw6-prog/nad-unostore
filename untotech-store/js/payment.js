let selectedPayMethod = null;
let pendingOrderMsg = '';
let pendingIsScript = false;
let proofImgFile = null;
let proofImgUrl = '';

function getFormatFor(cat) {
  return orderFormat[cat] || orderFormat['bot-wa'] || { fields: [], template: '🛒 *ORDER {produk}*\n{durasi} — {harga}\n_Order via {store_name}_' };
}

function openOrderForm() {
  if (activeIdx === null) return;
  const p = products[activeIdx];
  const v = (p.varians && p.varians[activeVar]) || { name: 'Default', price: p.price || 'Rp0' };
  const ofSub = document.getElementById('of-sub');
  const ofName = document.getElementById('of-name');
  const ofVar = document.getElementById('of-var');
  const ofPrice = document.getElementById('of-price');
  if (ofSub) ofSub.textContent = p.title + ' — ' + v.name;
  if (ofName) ofName.textContent = p.title;
  if (ofVar) ofVar.textContent = v.name;
  if (ofPrice) ofPrice.textContent = v.price;
  const fmt = getFormatFor(p.cat);
  const dyn = document.getElementById('f-dynamic');
  if (!dyn) return;
  dyn.innerHTML = `<div class="fsec">Data ${escapeHtml(p.title)}</div>` +
    fmt.fields.map(f => {
      const req = f.required ? ' <span style="color:var(--red)">*</span>' : '';
      if (f.type === 'textarea') {
        return `<div class="fg"><label class="fl">${escapeHtml(f.label)}${req}</label><textarea class="fi fta" id="of-f-${f.key}" placeholder="${escapeHtml(f.placeholder || '')}" rows="2"></textarea></div>`;
      }
      return `<div class="fg"><label class="fl">${escapeHtml(f.label)}${req}</label><input class="fi" id="of-f-${f.key}" placeholder="${escapeHtml(f.placeholder || '')}" type="${f.type || 'text'}"></div>`;
    }).join('');
  const cs2 = document.getElementById('cstep-2');
  const cs3 = document.getElementById('cstep-3');
  const cl2 = document.getElementById('csline-2');
  if (cs2) { cs2.classList.remove('done'); cs2.classList.add('active'); const circ = cs2.querySelector('.cs-step-circle'); if (circ) circ.textContent = '2'; }
  if (cs3) { cs3.classList.remove('active', 'done'); }
  if (cl2) cl2.classList.remove('done');
  closeProd();
  document.getElementById('order-overlay').classList.add('open');
}

function closeOrderBg(e) { if (e.target === document.getElementById('order-overlay')) closeOrder(); }
function closeOrder() { document.getElementById('order-overlay').classList.remove('open'); }

function goToPayment() {
  if (activeIdx === null) return;
  const p = products[activeIdx];
  const v = (p.varians && p.varians[activeVar]) || { name: 'Default', price: p.price || 'Rp0' };
  const fmt = getFormatFor(p.cat);
  const values = {};
  for (const f of fmt.fields) {
    const el = document.getElementById('of-f-' + f.key);
    const val = (el ? el.value : '').trim();
    if (f.required && !val) { showToast(`⚠️ ${f.label} wajib diisi!`); return; }
    values[f.key] = val;
  }
  const vars = {
    produk: p.title, durasi: v.name, harga: v.price,
    grup_buyer: GRUP_BUYER, store_name: STORE_NAME, ...values,
  };
  const msg = fmt.template.replace(/\{(\w+)\}/g, (m, key) => (key in vars) ? vars[key] : '');
  pendingOrderMsg = msg;
  pendingIsScript = (p.cat === 'source-code');
  const cs2 = document.getElementById('cstep-2');
  const cs3 = document.getElementById('cstep-3');
  const cl2 = document.getElementById('csline-2');
  if (cs2) { cs2.classList.remove('active'); cs2.classList.add('done'); const circ = cs2.querySelector('.cs-step-circle'); if (circ) circ.textContent = '✓'; }
  if (cl2) cl2.classList.add('done');
  if (cs3) cs3.classList.add('active');
  closeOrder();
  setTimeout(() => openPayOverlay(p.title, v.name, v.price), 250);
}

function openPayOverlay(prodTitle, varName, price) {
  selectedPayMethod = null;
  document.getElementById('pay-sum-text').textContent = `${prodTitle} — ${varName}`;
  document.getElementById('pay-sum-price').textContent = price;
  const confirmBtn = document.getElementById('btn-pay-confirm');
  if (pendingIsScript) {
    confirmBtn.innerHTML = '📲 Sudah Bayar — Lanjut Verifikasi & Download';
    confirmBtn.style.background = 'linear-gradient(135deg,#1e40af,#7c3aed)';
  } else {
    confirmBtn.innerHTML = '📲 Sudah Bayar — Kirim ke Admin WA';
    confirmBtn.style.background = 'linear-gradient(135deg,#7c3aed,#d946ef)';
  }
  const list = document.getElementById('pay-methods-list');
  list.innerHTML = '';
  const methods = [];
  const pc = PAYMENT_CFG;
  if (pc.dana?.active !== false) methods.push({ id: 'dana', icon: '💙', bg: 'linear-gradient(135deg,#118EEA,#0066CC)', name: 'DANA', no: pc.dana?.no || '628132988940', ownerName: pc.dana?.name || '' });
  if (pc.gopay?.active !== false) methods.push({ id: 'gopay', icon: '💚', bg: 'linear-gradient(135deg,#00AED6,#00875A)', name: 'GoPay', no: pc.gopay?.no || '628132988940', ownerName: pc.gopay?.name || '' });
  if (pc.ovo?.active !== false) methods.push({ id: 'ovo', icon: '💜', bg: 'linear-gradient(135deg,#4B2D8E,#7B4FCC)', name: 'OVO', no: pc.ovo?.no || '628132988940', ownerName: pc.ovo?.name || '' });
  if (pc.qris?.active !== false) methods.push({ id: 'qris', icon: '⬛', bg: 'linear-gradient(135deg,#E44034,#C0392B)', name: 'QRIS (Semua Bank)', no: 'Scan QR Code', isQris: true, qrisUrl: pc.qris?.url || '', ownerName: pc.qris?.name || '' });
  if (pc.bank?.active === true) methods.push({ id: 'bank', icon: '🏦', bg: 'linear-gradient(135deg,#F39C12,#D35400)', name: pc.bank?.bankName || 'Transfer Bank', no: pc.bank?.no || '', ownerName: pc.bank?.name || '' });
  if (!methods.length) {
    list.innerHTML = '<div style="text-align:center;padding:16px;color:#8892a4;font-size:12px">Tidak ada metode pembayaran aktif.<br>Hubungi admin.</div>';
  } else {
    methods.forEach(m => {
      const btn = document.createElement('div');
      btn.className = 'pay-method-btn';
      btn.dataset.id = m.id;
      btn.innerHTML = `<div class="pay-method-icon" style="background:${m.bg}">${m.icon}</div><div class="pay-method-info"><div class="pay-method-name">${m.name}</div><div class="pay-method-no">${m.isQris ? 'Scan QR Code' : m.no}${m.ownerName ? ' · ' + m.ownerName : ''}</div></div><div class="pay-radio"></div>`;
      btn.onclick = () => selectPayMethod(m, btn);
      list.appendChild(btn);
    });
    if (methods.length) selectPayMethod(methods[0], list.children[0]);
  }
  const afterEl = document.getElementById('pay-after-msg-el');
  if (pc.afterMsg) { afterEl.textContent = '✅ ' + pc.afterMsg; afterEl.classList.add('show'); } else afterEl.classList.remove('show');
  resetProofState();
  document.getElementById('pay-overlay').classList.add('open');
}

function selectPayMethod(method, btnEl) {
  selectedPayMethod = method;
  document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('selected'));
  btnEl.classList.add('selected');
  renderPayInstruct(method);
}

function renderPayInstruct(m) {
  const box = document.getElementById('pay-instruct');
  let html = `<div class="pay-instruct-title">📋 Cara Bayar via ${m.name}</div>`;
  if (m.isQris) {
    html += `<div class="pay-step"><div class="pay-step-num">1</div><div class="pay-step-text">Screenshot atau download QR Code di bawah ini</div></div>
    <div class="qris-wrap">
      <img class="qris-img" id="qris-img-el" src="${m.qrisUrl}" alt="QRIS" onerror="this.style.background='#333'" onclick="openQrisFullscreen('${m.qrisUrl}')">
      <div class="qris-label">QRIS · ${m.ownerName || STORE_NAME}</div>
      <div class="qris-hint">💡 Ketuk gambar untuk perbesar · Atau download untuk scan</div>
      <button class="qris-download-btn" onclick="downloadQris('${m.qrisUrl}')">⬇️ Download QRIS untuk Scan</button>
    </div>
    <div class="pay-step" style="margin-top:12px"><div class="pay-step-num">2</div><div class="pay-step-text">Buka aplikasi e-wallet/m-banking, pilih <strong>Bayar via QRIS</strong></div></div>
    <div class="pay-step"><div class="pay-step-num">3</div><div class="pay-step-text">Scan QR Code, masukkan nominal sesuai harga produk</div></div>
    <div class="pay-step"><div class="pay-step-num">4</div><div class="pay-step-text">Klik <strong>"Sudah Bayar"</strong> lalu kirim bukti ke admin WA</div></div>`;
  } else {
    html += `<div class="pay-step"><div class="pay-step-num">1</div><div class="pay-step-text">Buka aplikasi <strong>${m.name}</strong> di HP kamu</div></div>
    <div class="pay-step"><div class="pay-step-num">2</div><div class="pay-step-text">Transfer ke nomor: <div class="pay-copy-box"><span class="pay-copy-val" id="copy-no-${m.id}">${m.no}</span><button class="pay-copy-btn" onclick="copyPayNo('${m.no}','copy-no-${m.id}')">Salin</button></div>${m.ownerName ? `<div style="font-size:11px;color:#8892a4;margin-top:4px">a/n <strong style="color:#e2e8f0">${m.ownerName}</strong></div>` : ''}</div></div>
    <div class="pay-step"><div class="pay-step-num">3</div><div class="pay-step-text">Masukkan nominal sesuai harga produk</div></div>
    <div class="pay-step"><div class="pay-step-num">4</div><div class="pay-step-text">Klik <strong>"Sudah Bayar"</strong> lalu kirim bukti ke admin WA</div></div>`;
  }
  box.innerHTML = html;
  box.classList.add('show');
}

function copyPayNo(text, elId) {
  navigator.clipboard.writeText(text).catch(() => { });
  const el = document.getElementById(elId);
  const btn = el?.nextElementSibling;
  if (btn) { btn.textContent = '✅ Disalin'; setTimeout(() => { btn.textContent = 'Salin'; }, 2000); }
}

function resetProofState() {
  proofImgFile = null; proofImgUrl = '';
  const input = document.getElementById('pay-proof-input');
  if (input) input.value = '';
  const img = document.getElementById('pay-proof-img');
  if (img) img.src = '';
  const dzContent = document.getElementById('pay-proof-dz-content');
  if (dzContent) dzContent.style.display = 'flex';
  const preview = document.getElementById('pay-proof-preview');
  if (preview) preview.style.display = 'none';
  const dropzone = document.getElementById('pay-proof-dropzone');
  if (dropzone) dropzone.classList.remove('has-img');
  hideProofStatus();
}

function closePayOverlay() {
  document.getElementById('pay-overlay').classList.remove('open');
  resetProofState();
}

function downloadQris(url) {
  if (!url) { showToast('⚠️ URL QRIS tidak ditemukan!'); return; }
  fetch(url).then(r => r.blob()).then(blob => {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl; a.download = 'QRIS-UnoTech.jpg';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(blobUrl);
    showToast('✅ QRIS berhasil didownload!');
  }).catch(() => { window.open(url, '_blank'); showToast('💡 QRIS dibuka di tab baru, tekan & tahan untuk simpan.'); });
}

function openQrisFullscreen(url) {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;';
  ov.innerHTML = `<img src="${url}" style="width:min(90vw,380px);height:min(90vw,380px);border-radius:16px;object-fit:contain;background:#fff;padding:10px;box-shadow:0 0 40px rgba(124,58,237,.4)">
    <div style="font-size:12px;color:#8892a4">Ketuk di luar untuk tutup</div>
    <button onclick="downloadQris('${url}')" style="padding:10px 24px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#d946ef);color:#fff;border:none;font-size:13px;font-weight:600;cursor:pointer;font-family:Sora,sans-serif">⬇️ Download QRIS</button>`;
  ov.onclick = e => { if (e.target === ov) document.body.removeChild(ov); };
  document.body.appendChild(ov);
}

function initProofDropzone() {
  const dz = document.getElementById('pay-proof-dropzone');
  if (!dz) return;
  dz.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); dz.classList.add('dragover'); });
  dz.addEventListener('dragleave', e => { e.preventDefault(); e.stopPropagation(); dz.classList.remove('dragover'); });
  dz.addEventListener('drop', e => {
    e.preventDefault(); e.stopPropagation(); dz.classList.remove('dragover');
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) { showProofErr('⚠️ Hanya file gambar yang diizinkan!'); return; }
      if (file.size > 10 * 1024 * 1024) { showProofErr('⚠️ Ukuran file maksimal 10MB!'); return; }
      proofImgFile = file; proofImgUrl = '';
      const reader = new FileReader();
      reader.onload = ev => {
        document.getElementById('pay-proof-img').src = ev.target.result;
        document.getElementById('pay-proof-dz-content').style.display = 'none';
        document.getElementById('pay-proof-preview').style.display = 'block';
        dz.classList.add('has-img');
        hideProofStatus();
      };
      reader.readAsDataURL(file);
    }
  });
}

function handleProofFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showProofErr('⚠️ Hanya file gambar yang diizinkan!'); return; }
  if (file.size > 10 * 1024 * 1024) { showProofErr('⚠️ Ukuran file maksimal 10MB!'); return; }
  proofImgFile = file; proofImgUrl = '';
  const reader = new FileReader();
  reader.onload = ev => {
    document.getElementById('pay-proof-img').src = ev.target.result;
    document.getElementById('pay-proof-dz-content').style.display = 'none';
    document.getElementById('pay-proof-preview').style.display = 'block';
    document.getElementById('pay-proof-dropzone').classList.add('has-img');
    hideProofStatus();
  };
  reader.readAsDataURL(file);
}

function removeProofImg() { resetProofState(); }

function hideProofStatus() {
  document.getElementById('pay-proof-uploading').style.display = 'none';
  document.getElementById('pay-proof-success').style.display = 'none';
  document.getElementById('pay-proof-err').style.display = 'none';
}

function showProofErr(msg) {
  hideProofStatus();
  const el = document.getElementById('pay-proof-err');
  el.textContent = msg; el.style.display = 'block';
}

async function uploadProofToImgbb(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!data.success) throw new Error(data?.error?.message || 'Upload gagal');
  return data.data.url;
}

async function confirmPayAndSendWA() {
  if (!pendingOrderMsg) { showToast('⚠️ Data order tidak ditemukan!'); return; }
  if (!proofImgFile && !proofImgUrl) {
    showProofErr('⚠️ Wajib upload foto bukti pembayaran terlebih dahulu!');
    document.getElementById('pay-proof-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const btn = document.getElementById('btn-pay-confirm');
  btn.disabled = true;
  btn.innerHTML = '⏳ Memproses...';
  if (proofImgFile && !proofImgUrl) {
    hideProofStatus();
    document.getElementById('pay-proof-uploading').style.display = 'flex';
    try {
      proofImgUrl = await uploadProofToImgbb(proofImgFile);
      document.getElementById('pay-proof-uploading').style.display = 'none';
      document.getElementById('pay-proof-success').style.display = 'block';
    } catch (err) {
      showProofErr('❌ Gagal upload foto: ' + err.message + '. Coba lagi!');
      btn.disabled = false;
      btn.innerHTML = pendingIsScript ? '📲 Sudah Bayar — Lanjut Verifikasi & Download' : '📲 Sudah Bayar — Kirim ke Admin WA';
      return;
    }
  }
  const m = selectedPayMethod;
  let payInfo = '';
  if (m) {
    if (m.isQris) payInfo = `\n\n💳 *METODE BAYAR:* QRIS`;
    else payInfo = `\n\n💳 *METODE BAYAR:* ${m.name}\n📱 Nomor : ${m.no}${m.ownerName ? '\na/n    : ' + m.ownerName : ''}`;
  }
  const fullMsg = pendingOrderMsg + payInfo + `\n\n📸 *BUKTI PEMBAYARAN:*\n${proofImgUrl}`;
  window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(fullMsg)}`, '_blank');
  btn.disabled = false;
  btn.innerHTML = pendingIsScript ? '📲 Sudah Bayar — Lanjut Verifikasi & Download' : '📲 Sudah Bayar — Kirim ke Admin WA';
  closePayOverlay();
  setTimeout(() => launchKonfetti(), 300);
  if (pendingIsScript) {
    await savePendingScriptOrder();
    setTimeout(() => openDlScriptModal(), 400);
  }
}

async function savePendingScriptOrder() {
  try {
    const p = products[activeIdx];
    const v = (p.varians && p.varians[activeVar]) || { name: 'Default', price: p.price || 'Rp0' };
    const now = new Date();
    const id = 'SC-' + now.getFullYear().toString().slice(-2) +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase();
    const order = {
      id, produk: 'SC Alya Ai v11.0.0', cat: 'source-code',
      harga: v.price, wa: '-', namaOwner: '-',
      tanggal: now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      waktu: now.toISOString(), status: 'menunggu', lunas: false, downloadSent: false
    };
    currentOrderId = id;
    const data = await dbGet('store-orders');
    const orders = normalizeArray(data);
    orders.push(order);
    await dbSet('store-orders', orders);
  } catch (e) { console.error('savePendingScriptOrder:', e); }
}

function openDlScriptModal() {
  document.getElementById('dl-step-wait').style.display = 'block';
  document.getElementById('dl-step-ready').style.display = 'none';
  document.getElementById('dl-status-note').textContent = '💡 Tekan "Cek Status" setelah admin konfirmasi via WA';
  document.getElementById('dl-status-note').style.color = '';
  const fnLabel = document.getElementById('dl-filename-label');
  const vLabel = document.getElementById('dl-version-label');
  if (fnLabel) fnLabel.textContent = SCRIPT_DL_FILENAME || 'file.zip';
  if (vLabel) vLabel.textContent = SCRIPT_DL_VERSION || 'v11.0.0';
  document.getElementById('dl-script-overlay').classList.add('open');
}

function closeDlScriptModal() {
  document.getElementById('dl-script-overlay').classList.remove('open');
  pendingIsScript = false;
}

async function cekStatusLunas() {
  if (!currentOrderId) { showToast('⚠️ ID order tidak ditemukan'); return; }
  const btn = document.getElementById('btn-cek-lunas');
  const note = document.getElementById('dl-status-note');
  btn.innerHTML = '<span style="font-size:18px">⏳</span> Mengecek...';
  btn.disabled = true;
  try {
    const data = await dbGet('store-orders');
    const orders = normalizeArray(data);
    const order = orders.find(o => o && o.id === currentOrderId);
    if (order && order.lunas) {
      document.getElementById('dl-step-wait').style.display = 'none';
      document.getElementById('dl-step-ready').style.display = 'block';
      showToast('✅ Pembayaran dikonfirmasi!');
    } else {
      note.textContent = '⏳ Pembayaran belum dikonfirmasi admin. Pastikan sudah kirim bukti ke WA admin ya!';
      note.style.color = 'var(--gold)';
      showToast('⏳ Belum dikonfirmasi admin');
      btn.innerHTML = '<span style="font-size:18px">🔄</span> Cek Status Pembayaran';
      btn.disabled = false;
    }
  } catch (e) {
    note.textContent = '❌ Gagal cek status, coba lagi.';
    note.style.color = 'var(--red)';
    btn.innerHTML = '<span style="font-size:18px">🔄</span> Cek Status Pembayaran';
    btn.disabled = false;
  }
}

function doDownloadScript() {
  window.open(SCRIPT_DL_URL, '_blank');
  showToast('⬇️ Membuka link download...');
  setTimeout(() => closeDlScriptModal(), 1800);
}

