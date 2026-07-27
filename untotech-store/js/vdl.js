let vdlPlatform = 'tiktok';
const VDL_HIST_KEY = 'vdl-history';

function openVdl() { document.getElementById('vdl-overlay').classList.add('open'); loadVdlHistory(); }
function closeVdl() { document.getElementById('vdl-overlay').classList.remove('open'); bnSwitch('store'); }

function vdlSetPlatform(p) {
  vdlPlatform = p;
  document.querySelectorAll('.vdl-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('vdl-tab-' + p).classList.add('active');
  document.getElementById('vdl-url-input').value = '';
  document.getElementById('vdl-result').classList.remove('show');
  document.getElementById('vdl-err').classList.remove('show');
  const placeholders = { tiktok: 'Paste link TikTok...', instagram: 'Paste link Instagram...', youtube: 'Paste link YouTube...' };
  document.getElementById('vdl-url-input').placeholder = placeholders[p] || 'Paste link video...';
}

async function vdlProcess() {
  const url = document.getElementById('vdl-url-input').value.trim();
  if (!url) { showToast('⚠️ Paste link video dulu!'); return; }
  const result = document.getElementById('vdl-result');
  const loading = document.getElementById('vdl-loading');
  const errEl = document.getElementById('vdl-err');
  const loadTxt = document.getElementById('vdl-loading-txt');
  result.classList.remove('show');
  errEl.classList.remove('show');
  loading.classList.add('show');
  if (loadTxt) loadTxt.textContent = 'Mencari server terbaik...';
  const loadMsgTimer = setTimeout(() => {
    if (loadTxt) loadTxt.textContent = 'Sedang mengambil video, harap tunggu...';
  }, 2000);
  try {
    let data;
    if (vdlPlatform === 'tiktok') { data = await fetchTiktok(url); }
    else if (vdlPlatform === 'instagram') { if (loadTxt) loadTxt.textContent = 'Menghubungi Cobalt API...'; data = await fetchInstagram(url); }
    else { if (loadTxt) loadTxt.textContent = 'Menghubungi Cobalt API...'; data = await fetchYoutube(url); }
    clearTimeout(loadMsgTimer);
    loading.classList.remove('show');
    if (!data || data.error) {
      const msg = data?.error || 'Gagal mengambil video. Pastikan link valid.';
      errEl.innerHTML = '❌ ' + msg + (vdlPlatform === 'instagram' ? '<br><small style="opacity:.7">💡 Pastikan akun IG tidak private & link dibuka dari browser, bukan app IG langsung.</small>' : '');
      errEl.classList.add('show');
      return;
    }
    renderVdlResult(data);
    saveVdlHistory(data);
  } catch (e) {
    clearTimeout(loadMsgTimer);
    loading.classList.remove('show');
    errEl.textContent = '❌ Gagal: ' + e.message;
    errEl.classList.add('show');
  }
}

async function fetchTiktok(url) {
  try {
    const res = await fetch('https://www.tikwm.com/api/?url=' + encodeURIComponent(url) + '&hd=1');
    const d = await res.json();
    if (!d || d.code !== 0 || !d.data) return { error: 'Link TikTok tidak valid atau video private.' };
    const v = d.data;
    return {
      platform: 'tiktok', title: v.title || 'TikTok Video',
      author: '@' + (v.author?.unique_id || v.author?.nickname || 'user'),
      thumb: v.cover || v.origin_cover || '',
      links: [v.play ? { label: '🎬 Video HD (No Watermark)', url: v.play, quality: 'HD' } : null,
      v.wmplay ? { label: '🎬 Video (Watermark)', url: v.wmplay, quality: 'SD' } : null,
      v.music ? { label: '🎵 Audio MP3', url: v.music, quality: 'MP3' } : null].filter(Boolean)
    };
  } catch (e) { return { error: 'Gagal: ' + e.message }; }
}

function _cleanIgUrl(raw) {
  try {
    const u = new URL(raw);
    if (!u.hostname.includes('instagram.com')) return raw;
    return 'https://www.instagram.com' + u.pathname.replace(/\/+$/, '').replace(/\/+/g, '/');
  } catch (e) { return raw; }
}

async function _cobaltRequest(instance, mediaUrl) {
  const res = await fetch(instance, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ url: mediaUrl, videoQuality: '1080', filenameStyle: 'basic', downloadMode: 'auto' }),
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) return null;
  return await res.json();
}

function _cobaltResponseToLinks(d, platform) {
  if (!d) return null;
  const st = d.status;
  if (st === 'tunnel' || st === 'redirect') {
    const label = platform === 'instagram' ? '📸 Download Media (HD)' : platform === 'youtube' ? '🎬 Download Video (HD)' : '⬇️ Download';
    return [{ label, url: d.url, quality: 'HD' }];
  }
  if (st === 'picker' && Array.isArray(d.picker) && d.picker.length) {
    return d.picker.map((item, i) => ({
      label: item.type === 'video' ? `🎬 Video ${i + 1}` : `📸 Foto ${i + 1}`,
      url: item.url, quality: 'HD'
    }));
  }
  return null;
}

async function _cobaltFetch(mediaUrl, platform) {
  for (const base of COBALT_INSTANCES) {
    try {
      const d = await _cobaltRequest(base, mediaUrl);
      const links = _cobaltResponseToLinks(d, platform);
      if (links && links.length) return { _ok: true, links };
    } catch (e) { }
  }
  return { _ok: false };
}

async function fetchInstagram(rawUrl) {
  try {
    const cleanUrl = _cleanIgUrl(rawUrl);
    const cobalt = await _cobaltFetch(cleanUrl, 'instagram');
    if (cobalt._ok) {
      return { platform: 'instagram', title: 'Instagram Post', author: '@instagram', thumb: '', links: cobalt.links };
    }
    return {
      platform: 'instagram', title: 'Instagram Post', author: '', thumb: '',
      links: [{ label: '🌐 Download via SaveFrom', url: 'https://savefrom.net/#url=' + encodeURIComponent(cleanUrl), quality: 'Web' },
      { label: '🌐 Download via SnapSave', url: 'https://snapsave.app/result?lang=id&url=' + encodeURIComponent(cleanUrl), quality: 'Web' }]
    };
  } catch (e) { return { error: 'Gagal: ' + e.message }; }
}

async function fetchYoutube(url) {
  try {
    const videoId = extractYtId(url);
    const cleanUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
    if (!videoId && !url.includes('youtu')) return { error: 'Link YouTube tidak valid.' };
    const cobalt = await _cobaltFetch(cleanUrl, 'youtube');
    if (cobalt._ok) {
      return {
        platform: 'youtube', title: 'YouTube Video', author: '',
        thumb: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '',
        links: cobalt.links
      };
    }
    return {
      platform: 'youtube', title: 'YouTube Video', author: '',
      thumb: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '',
      links: [{ label: '🌐 Download via Y2Mate', url: 'https://www.y2mate.com/youtube/' + videoId, quality: 'Web' },
      { label: '🌐 Download via SaveFrom', url: 'https://savefrom.net/#url=' + encodeURIComponent(cleanUrl), quality: 'Web' }]
    };
  } catch (e) { return { error: 'Gagal: ' + e.message }; }
}

function extractYtId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
  return m ? m[1] : null;
}

function renderVdlResult(data) {
  const result = document.getElementById('vdl-result');
  const preview = document.getElementById('vdl-preview');
  const title = document.getElementById('vdl-info-title');
  const meta = document.getElementById('vdl-info-meta');
  const btns = document.getElementById('vdl-dl-btns');
  if (data.thumb) {
    preview.innerHTML = `<img src="${data.thumb}" alt="thumbnail" onerror="this.parentElement.innerHTML='<div class=vdl-preview-icon>🎬</div>'">`;
  } else {
    const icons = { tiktok: '🎵', instagram: '📸', youtube: '▶️' };
    preview.innerHTML = `<div class="vdl-preview-icon">${icons[data.platform] || '🎬'}</div>`;
  }
  title.textContent = data.title || 'Video';
  meta.textContent = data.author || data.platform;
  btns.innerHTML = '';
  (data.links || []).forEach(l => {
    if (!l.url) return;
    const btn = document.createElement('button');
    btn.className = 'vdl-dl-btn' + (l.quality === 'Web' ? ' vdl-dl-web' : '');
    btn.dataset.url = l.url;
    btn.innerHTML = `<span>${l.label || 'Download'}</span><span class="dl-quality">${l.quality || ''}</span>`;
    btn.onclick = () => vdlDownload(btn.dataset.url);
    btns.appendChild(btn);
  });
  result.classList.add('show');
}

function vdlDownload(url) {
  if (!url) { showToast('⚠️ URL tidak tersedia'); return; }
  const a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  showToast('⬇️ Membuka link download...');
}

function saveVdlHistory(data) {
  try {
    const hist = JSON.parse(localStorage.getItem(VDL_HIST_KEY) || '[]');
    hist.unshift({ ...data, savedAt: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) });
    if (hist.length > 10) hist.pop();
    localStorage.setItem(VDL_HIST_KEY, JSON.stringify(hist));
    loadVdlHistory();
  } catch { }
}

function loadVdlHistory() {
  try {
    const hist = JSON.parse(localStorage.getItem(VDL_HIST_KEY) || '[]');
    const section = document.getElementById('vdl-history');
    const list = document.getElementById('vdl-hist-list');
    if (!hist.length) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    const icons = { tiktok: '🎵', instagram: '📸', youtube: '▶️' };
    list.innerHTML = '';
    hist.forEach((h) => {
      const item = document.createElement('div');
      item.className = 'vdl-hist-item';
      const firstUrl = h.links?.[0]?.url || '';
      item.innerHTML = `
        <div class="vdl-hist-icon">${icons[h.platform] || '🎬'}</div>
        <div class="vdl-hist-info">
          <div class="vdl-hist-title">${escapeHtml(h.title || 'Video')}</div>
          <div class="vdl-hist-meta">${escapeHtml(h.platform || '')} · ${escapeHtml(h.savedAt || '')}</div>
        </div>`;
      if (firstUrl) {
        const dlBtn = document.createElement('button');
        dlBtn.className = 'vdl-hist-dl';
        dlBtn.textContent = '↓';
        dlBtn.dataset.url = firstUrl;
        dlBtn.onclick = () => vdlDownload(dlBtn.dataset.url);
        item.appendChild(dlBtn);
      }
      list.appendChild(item);
    });
  } catch { }
}

function vdlClearHistory() {
  localStorage.removeItem(VDL_HIST_KEY);
  document.getElementById('vdl-history').style.display = 'none';
  showToast('🗑 Riwayat download dihapus!');
}

