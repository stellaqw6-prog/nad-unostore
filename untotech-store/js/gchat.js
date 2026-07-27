const GCHAT_KEY = 'store-gchat';
const GCHAT_NICK_KEY = 'gchat-nickname';
let gchatNick = '';
let gchatPolling = null;
let gchatOpen = false;
let gchatLastCount = 0;

function openGchat() {
  gchatOpen = true;
  document.getElementById('gchat-overlay').classList.add('open');
  document.getElementById('gchat-badge').style.display = 'none';
  const nick = localStorage.getItem(GCHAT_NICK_KEY);
  if (!nick) {
    document.getElementById('gchat-nick-modal').classList.add('open');
    setTimeout(() => document.getElementById('gchat-nick-input').focus(), 100);
  } else {
    gchatNick = nick;
    loadGchatMessages();
    startGchatPolling();
  }
}

function closeGchat() {
  gchatOpen = false;
  document.getElementById('gchat-overlay').classList.remove('open');
  if (gchatPolling) { clearInterval(gchatPolling); gchatPolling = null; }
  bnSwitch('store');
}

function saveGchatNick() {
  const nick = document.getElementById('gchat-nick-input').value.trim();
  if (!nick || nick.length < 2) { showToast('⚠️ Nama minimal 2 karakter!'); return; }
  gchatNick = nick;
  localStorage.setItem(GCHAT_NICK_KEY, nick);
  document.getElementById('gchat-nick-modal').classList.remove('open');
  gchatSendSystem(gchatNick + ' bergabung ke chat 👋');
  loadGchatMessages();
  startGchatPolling();
}

function startGchatPolling() {
  if (gchatPolling) clearInterval(gchatPolling);
  gchatPolling = setInterval(loadGchatMessages, 3000);
}

async function loadGchatMessages() {
  try {
    const data = await dbGet(GCHAT_KEY);
    if (!data) return;
    const msgs = normalizeArray(data);
    if (msgs.length === gchatLastCount && gchatLastCount > 0) return;
    if (!gchatOpen && msgs.length > gchatLastCount && gchatLastCount > 0) {
      const badge = document.getElementById('gchat-badge');
      if (badge) badge.style.display = 'flex';
    }
    gchatLastCount = msgs.length;
    renderGchatMessages(msgs);
  } catch { }
}

function renderGchatMessages(msgs) {
  const container = document.getElementById('gchat-messages');
  if (!msgs || !msgs.length) {
    container.innerHTML = '<div class="gchat-empty"><div class="ei">💬</div><div>Jadilah yang pertama chat!</div></div>';
    return;
  }
  container.innerHTML = msgs.slice(-80).map(m => {
    if (m.type === 'system') return `<div class="gchat-system">${escapeHtml(m.text || '')}</div>`;
    const isMe = m.nick === gchatNick;
    const t = m.time ? new Date(m.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
    return `<div class="gchat-msg ${isMe ? 'me' : 'other'}">
      <div class="gchat-msg-name">${escapeHtml(m.nick || 'User')}</div>
      <div class="gchat-bubble">${escapeHtml(m.text || '')}</div>
      <div class="gchat-msg-time">${t}</div>
    </div>`;
  }).join('');
  container.scrollTop = container.scrollHeight;
  const onlineEl = document.getElementById('gchat-online-badge');
  if (onlineEl) {
    const unique = new Set(msgs.slice(-50).filter(m => m.nick).map(m => m.nick)).size;
    onlineEl.textContent = unique + ' Online';
  }
}

async function gchatSend() {
  if (!gchatNick) { document.getElementById('gchat-nick-modal').classList.add('open'); return; }
  const inp = document.getElementById('gchat-input');
  const text = inp.value.trim();
  if (!text) return;
  inp.value = ''; inp.style.height = 'auto';
  const msg = { nick: gchatNick, text, time: new Date().toISOString(), type: 'msg' };
  await appendGchatMsg(msg);
  loadGchatMessages();
}

async function gchatSendSystem(text) {
  const msg = { type: 'system', text, time: new Date().toISOString() };
  await appendGchatMsg(msg);
}

async function appendGchatMsg(msg) {
  try {
    const data = await dbGet(GCHAT_KEY);
    const msgs = normalizeArray(data);
    if (msgs.length >= 200) msgs.splice(0, msgs.length - 199);
    msgs.push(msg);
    await dbSet(GCHAT_KEY, msgs);
  } catch { }
}

function gchatKeydown(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); gchatSend(); } }
function autoResizeGchat(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 80) + 'px'; }

