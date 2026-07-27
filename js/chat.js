let chatHistory = [];
let chatOpen = false;
let chatInit = false;
let chatTypingTimeout = null;

function toggleChat() {
  chatOpen = !chatOpen;
  document.getElementById('chat-window').classList.toggle('open', chatOpen);
  if (chatOpen) {
    document.getElementById('chat-notif').style.display = 'none';
    if (!chatInit) initChat();
  }
}

function initChat() {
  chatInit = true;
  chatHistory = [];
  const msgs = document.getElementById('chat-messages');
  msgs.innerHTML = '';
  addTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    const greet = `Halo kak! 👋 Aku ${CS_AI_NAME}, CS dari UnoTech Store. Ada yang bisa aku bantu hari ini? Mau tanya produk, harga, atau cara order?`;
    addChatMsg('admin', greet, CS_AI_NAME);
    chatHistory.push({ role: 'assistant', content: greet });
  }, 900);
}

function addChatMsg(from, text, senderName = '') {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-msg ${from}`;
  const formatted = escapeHtml(text)
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  div.innerHTML = formatted + `<div class="chat-msg-time">${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function addTypingIndicator() {
  removeTypingIndicator();
  const msgs = document.getElementById('chat-messages');
  const t = document.createElement('div');
  t.className = 'chat-typing';
  t.id = 'chat-typing';
  t.innerHTML = '<span></span><span></span><span></span>';
  msgs.appendChild(t);
  msgs.scrollTop = msgs.scrollHeight;
}

function removeTypingIndicator() {
  const t = document.getElementById('chat-typing');
  if (t) t.remove();
  if (chatTypingTimeout) { clearTimeout(chatTypingTimeout); chatTypingTimeout = null; }
}

async function sendChatMsg() {
  const inp = document.getElementById('chat-input');
  const txt = inp.value.trim();
  if (!txt) return;
  addChatMsg('user', txt);
  inp.value = '';
  inp.style.height = 'auto';
  chatHistory.push({ role: 'user', content: txt });
  if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
  addTypingIndicator();
  try {
    const reply = CS_AI_ACTIVE ? await askLocalCS(txt) : getFallbackReply(txt.toLowerCase());
    removeTypingIndicator();
    addChatMsg('admin', reply, CS_AI_NAME);
    chatHistory.push({ role: 'assistant', content: reply });
    if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
  } catch (err) {
    removeTypingIndicator();
    const fallback = getFallbackReply(txt.toLowerCase());
    addChatMsg('admin', fallback, CS_AI_NAME);
    console.warn('AI CS error, using fallback:', err);
  }
}

function parsePromptContext() {
  const ctx = { name: CS_AI_NAME, products: [], payment: [], cara_order: '', aktivasi: '', support: '' };
  const lines = CS_SYSTEM_PROMPT.split('\n');
  let section = '';
  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    if (/produk.*dijual|product/i.test(l)) section = 'produk';
    else if (/cara order|langkah/i.test(l)) { section = 'order'; ctx.cara_order = l.replace(/cara order.*?:/i, '').trim(); }
    else if (/metode.*bayar|pembayaran|bayar/i.test(l)) { section = 'bayar'; ctx.payment.push(l); }
    else if (/aktivasi/i.test(l)) { section = 'aktivasi'; ctx.aktivasi = l; }
    else if (/support/i.test(l)) { section = 'support'; ctx.support = l; }
    else if (section === 'produk' && /^\d+\./.test(l)) {
      const m = l.match(/^\d+\.\s*(.+)/);
      if (m) ctx.products.push(m[1]);
    }
  }
  return ctx;
}

async function askLocalCS(userMessage) {
  await new Promise(r => setTimeout(r, 300 + Math.random() * 500));
  const lower = userMessage.toLowerCase();
  const ctx = parsePromptContext();
  const nm = ctx.name || CS_AI_NAME;
  if (/^(halo|hai|hi|hey|hello|p+|assalam|wkwk|hola)\b/i.test(lower))
    return `Halo kak! 👋 Aku ${nm}, CS dari UnoTech Store. Ada yang bisa aku bantu hari ini? Mau tanya produk, harga, atau cara order? 😊`;
  if (/terima kasih|makasih|thanks|thx|tq/i.test(lower))
    return `Sama-sama kak! 😊 Kalau ada yang perlu ditanyain lagi, ${nm} siap bantu ya~`;
  if (/produk.*apa|jual.*apa|ada.*apa|list.*produk|apa.*yang.*dijual/i.test(lower)) {
    const prods = ctx.products.length ? ctx.products.map((p, i) => `${i + 1}. ${p}`).join('\n') : '• Sewa Bot WA\n• Panel Pterodactyl\n• Source Code Bot';
    return `Produk kita ada:\n${prods}\n\nMau info lebih lanjut yang mana kak? 😊`;
  }
  if (/harga|berapa|price|tarif|biaya|murah|mahal/i.test(lower)) {
    if (/bot|sewa/i.test(lower))
      return extractSection('bot') || `Harga Sewa Bot kak:\n• 1 hari: Rp500\n• 3 hari: Rp2.000\n• 7 hari: Rp4.000\n• 1 bulan: Rp7.000\n• 1 tahun: Rp40.000\n\nMurah kan? 😄`;
    if (/panel|pterodactyl|ptero/i.test(lower))
      return extractSection('panel') || `Harga Panel Pterodactyl kak:\n• 1 minggu: Rp2.000\n• 1 bulan: Rp7.000\n• Permanen: Rp50.000\n\nVPS legal, uptime 99.9%! 🖥️`;
    if (/sc|source.*code|script/i.test(lower))
      return extractSection('sc') || `SC Alya AI: Rp75.000 kak 📦\nBeli sekali, update gratis selamanya! Tanpa enkripsi, 1800+ fitur langsung pakai.`;
    return `Harga produk kita kak:\n• 🤖 Sewa Bot: mulai Rp500/hari\n• 🖥️ Panel: mulai Rp2.000/minggu\n• 📦 Source Code: Rp75.000\n\nMau info produk yang mana? 😊`;
  }
  if (/bot|sewa.*bot|bot.*wa|whatsapp.*bot/i.test(lower))
    return `Sewa Bot kita punya 1800+ fitur kak 🤖\nGame, sticker, info, moderasi grup — lengkap banget!\nHarga mulai Rp500/hari aja, langsung aktif setelah bayar ke grup kamu 🔥\n\nMau sewa berapa lama kak?`;
  if (/panel|pterodactyl|ptero|vps/i.test(lower))
    return `Panel Pterodactyl Premium kita kak 🖥️\nVPS legal, uptime 99.9%, RAM 2GB-Unlimited.\nMulai Rp2.000/minggu, cocok buat host bot WA kamu sendiri!\n\nMau coba berapa lama?`;
  if (/sc|source.*code|script|source/i.test(lower))
    return `SC Alya AI — Rp75.000 kak 📦\nFull source code tanpa enkripsi, 1800+ fitur, update gratis selamanya.\nPas banget buat yang mau develop bot sendiri!`;
  if (/cara.*order|gimana.*order|cara.*beli|order.*gimana|langkah|step/i.test(lower))
    return `Cara order gampang kak 🛒\n1. Klik produk yang kamu mau\n2. Pilih varian/durasi\n3. Klik "Beli Sekarang"\n4. Isi data (nama, no WA, grup)\n5. Pilih metode bayar & bayar\n6. Upload bukti pembayaran\n✅ Aktivasi < 30 menit setelah bukti dikonfirmasi!`;
  if (/bayar|transfer|payment|metode.*bayar|qris|gopay|dana|ovo/i.test(lower))
    return `Metode pembayaran kita kak 💳\n• DANA\n• GoPay\n• OVO\n• QRIS (semua bank)\n\nSetelah bayar, upload bukti di web ya, aktivasi < 30 menit! ⚡`;
  if (/kapan.*aktif|berapa.*lama.*aktif|lama.*aktivasi|aktivasi.*berapa/i.test(lower))
    return `Aktivasi < 30 menit ya kak ⚡ Setelah bukti bayar kamu upload dan dikonfirmasi admin, langsung aktif!`;
  if (/contact|kontak|admin|cs.*lain|hubungi|wa.*admin|whatsapp/i.test(lower))
    return `Bisa hubungi admin langsung kak 📲\nKlik tombol "Lanjut Chat via WhatsApp" di bawah ya, ${nm} sambungkan ke admin! 😊`;
  if (/fitur|feature|command|cmd|1800|lengkap/i.test(lower))
    return `Bot kita punya 1800+ command aktif kak 🔥\nAda: game RPG, sticker maker, download media, info cuaca, moderasi grup, dan masih banyak lagi!\n\nMau sewa atau tanya lebih detail?`;
  return `Hmm, ${nm} kurang ngerti maksud kakak nih 😅\nCoba tanya tentang:\n• Produk & harga\n• Cara order\n• Metode pembayaran\n• Aktivasi\n\nAtau langsung chat admin via WhatsApp ya kak! 📲`;
}

function extractSection(keyword) {
  const lines = CS_SYSTEM_PROMPT.split('\n');
  const kw = { bot: 'sewa bot|bot wa', panel: 'panel|pterodactyl', sc: 'source code|sc evernight' }[keyword] || keyword;
  const re = new RegExp(kw, 'i');
  let found = false, result = [];
  for (const line of lines) {
    if (re.test(line)) { found = true; result = [line.trim()]; continue; }
    if (found) {
      if (/^\d+\.\s/.test(line.trim()) && result.length > 1) break;
      if (line.trim()) result.push(line.trim());
      if (result.length >= 6) break;
    }
  }
  return found && result.length > 1 ? result.join('\n') : null;
}

function getFallbackReply(lower) {
  if (lower.includes('harga') || lower.includes('berapa'))
    return `Harga produk kita mulai dari Rp500 kak 😊\n• Sewa Bot: Rp500/hari\n• Panel: Rp2.000/minggu\n• SC Alya: Rp75.000\n\nMau yang mana?`;
  if (lower.includes('bot') || lower.includes('sewa'))
    return `Sewa Bot kita ada 1800+ fitur kak 🤖 Mulai Rp500/hari aja, langsung aktif setelah bayar!`;
  if (lower.includes('panel'))
    return `Panel Pterodactyl premium VPS legal kak 🖥️ Mulai Rp2.000/minggu, uptime 99.9%!`;
  if (lower.includes('bayar') || lower.includes('transfer'))
    return `Bisa bayar via DANA, GoPay, OVO, atau QRIS kak 💳 Setelah bayar upload bukti di web ya!`;
  if (lower.includes('halo') || lower.includes('hai') || lower.includes('hi'))
    return `Halo kak! 👋 Ada yang bisa ${CS_AI_NAME} bantu?`;
  return `Maaf kak, ${CS_AI_NAME} lagi ada gangguan koneksi 😅 Coba tanya lagi atau langsung WA admin ya biar lebih cepat!`;
}

function chatKeydown(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMsg(); } }
function autoResizeChat(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 65) + 'px'; }
function lanjutWhatsApp() {
  window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent('Halo Admin UnoTech Store, saya mau tanya tentang produk 🙏')}`, '_blank');
}
function contactAdmin() {
  window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent('Halo Admin UnoTech Store, saya ingin bertanya / memesan produk 🙏')}`, '_blank');
}
function openChannelWa() {
  window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent('Halo Admin UnoTech Store!')}`);
}

window.openAuthModal = function () {
  const modal = document.getElementById('_auth-modal');
  if (modal) modal.style.display = 'flex';
};

