const FIREBASE_URL = 'https://store-minzy-default-rtdb.asia-southeast1.firebasedatabase.app';
const FIREBASE_TOKEN = '';
window.FIREBASE_URL = FIREBASE_URL;
window.FIREBASE_TOKEN = FIREBASE_TOKEN;

const IMGBB_API_KEY = '6faadb795960be644410c4211ebb0558';

let ADMIN_WA = '628132988940';
let GRUP_BUYER = 'https://chat.whatsapp.com/FSYs8eRrhtTC3INZ9gnv4D?mode=gi_t';
let STORE_NAME = 'UnoTech Store';
let currentOrderId = '';

let SCRIPT_DL_URL = 'https://www.mediafire.com/file/vwxnqvnfwbemx7h/alip_ai_MD_v11.0.0.zip/file';
let SCRIPT_DL_FILENAME = 'alip_ai_MD_v11.0.0.zip';
let SCRIPT_DL_VERSION = 'v11.0.0';

const COBALT_INSTANCES = [
  'https://cobalt.api.timelessnesses.me',
  'https://cob.froth.zone',
  'https://cobalt.aldi.wtf',
  'https://cobalt.seelen.lol',
  'https://cobalt.drgn.gay',
  'https://cobalt.fossgaming.net',
  'https://cobalt.akaaki.lol',
  'https://dl.cgr.wtf',
];

let PAYMENT_CFG = {
  dana: { active: true, no: '628132988940', name: '' },
  gopay: { active: true, no: '628132988940', name: '' },
  ovo: { active: true, no: '628132988940', name: '' },
  qris: { active: true, url: 'https://img2.pixhost.to/images/7311/716701404_alip-1776667419907.jpg', name: '' },
  bank: { active: false, bankName: '', no: '', name: '' },
  'wa-confirm': true, 'show-all': true, afterMsg: '',
};

const DEFAULT_ORDER_FORMAT = {
  'bot-wa': {
    fields: [
      { key: 'link_grup', label: 'Link Grup WhatsApp Kamu', type: 'url', placeholder: 'https://chat.whatsapp.com/...', required: true },
      { key: 'nama', label: 'Nama Kamu', type: 'text', placeholder: 'Nama lengkap kamu', required: true },
      { key: 'wa', label: 'Nomor WA Kamu', type: 'tel', placeholder: '628xxxxxxxxxx', required: true },
    ],
    template: `🤖 *ORDER SEWA BOT ALYA AI*\n━━━━━━━━━━━━━━━━━━\n📦 Produk  : {produk}\n⏱️ Durasi  : {durasi}\n💰 Harga   : {harga}\n\n📋 *DATA PEMBELIAN:*\nLink grup WA  : {link_grup}\nNama pembeli  : {nama}\nNomer pembeli : {wa}\n\n🔗 Link grup buyer :\n{grup_buyer}\n━━━━━━━━━━━━━━━━━━\n🛒 _Order via {store_name}_`,
  },
  'panel': {
    fields: [
      { key: 'nama_panel', label: 'Nama Panel', type: 'text', placeholder: 'Contoh: BotKu Panel', required: true },
      { key: 'wa', label: 'Nomor WA Pembeli', type: 'tel', placeholder: '628xxxxxxxxxx', required: true },
    ],
    template: `🖥️ *ORDER PANEL BOT WA*\n━━━━━━━━━━━━━━━━━━\n📦 Produk  : {produk}\n⏱️ Durasi  : {durasi}\n💰 Harga   : {harga}\n\n📋 *DATA PANEL:*\nNama panel       : {nama_panel}\nNomor WA pembeli : {wa}\n━━━━━━━━━━━━━━━━━━\n🛒 _Order via {store_name}_`,
  },
  'source-code': {
    fields: [
      { key: 'owner', label: 'global.owner (Nomor WA)', type: 'tel', placeholder: '628xxxxxxxxxx', required: true },
      { key: 'namaowner', label: 'global.namaOwner', type: 'text', placeholder: 'Nama kamu', required: true },
      { key: 'packname', label: 'global.packname', type: 'text', placeholder: 'Nama pack stiker', required: false },
      { key: 'author', label: 'global.author', type: 'text', placeholder: 'Nama author stiker', required: false },
      { key: 'botname', label: 'global.botname', type: 'text', placeholder: 'Nama bot utama', required: true },
      { key: 'botname2', label: 'global.botname2', type: 'text', placeholder: 'Nama bot alternatif', required: false },
      { key: 'nomerbot', label: 'Nomor Bot (WA)', type: 'tel', placeholder: '628xxxxxxxxxx', required: true },
    ],
    template: `📦 *ORDER SC ALYA AI*\n━━━━━━━━━━━━━━━━━━\n📦 Produk : {produk}\n💰 Harga  : {harga}\n\n📋 *KONFIGURASI SCRIPT:*\nglobal.owner = '{owner}'\nglobal.namaOwner = "{namaowner}"\nglobal.packname = '{packname}'\nglobal.author = '{author}'\nglobal.botname = '{botname}'\nglobal.botname2 = "{botname2}"\n\nNomer bot : {nomerbot}\n━━━━━━━━━━━━━━━━━━\n🛒 _Order via {store_name}_`,
  },
};
let orderFormat = JSON.parse(JSON.stringify(DEFAULT_ORDER_FORMAT));

let CS_SYSTEM_PROMPT = `Kamu adalah CS (Customer Service) dari UnoTech Store bernama "Una" 🤖

IDENTITAS:
- Nama: Una
- Toko: UnoTech Store
- Karakter: Ramah, cepat respons, gaul tapi tetap profesional, suka pakai emoji
- Bahasa: Indonesia kasual (kak, nih, dong, sih, aja, dll)

PRODUK YANG DIJUAL:
1. 🤖 Sewa Bot WhatsApp (Alya AI Multidevice)
   - 1 hari: Rp500 | 3 hari: Rp2.000 | 5 hari: Rp3.500 | 7 hari: Rp4.000
   - 14 hari: Rp6.000 | 1 bulan: Rp7.000 | 3 bulan: Rp26.000 | 1 tahun: Rp40.000
   - Fitur: 1800+ command, game, sticker, info, moderasi grup
   - Aktivasi otomatis masuk grup setelah bayar

2. 🖥️ Panel Bot WA (Pterodactyl Premium)
   - 1 minggu: Rp2.000 | 2 minggu: Rp4.000 | 1 bulan: Rp7.000
   - 2 bulan: Rp12.000 | Permanen: Rp50.000
   - VPS legal, uptime 99.9%, RAM 2GB - Unlimited

3. 📦 SC Alya AI (Source Code)
   - Harga: Rp75.000 (beli sekali, update gratis selamanya)
   - Full source code tanpa enkripsi, 1800+ fitur

CARA ORDER: Klik produk → Pilih varian → Beli Sekarang → Isi data → Bayar → Upload bukti
METODE BAYAR: DANA, GoPay, OVO, QRIS semua bank
AKTIVASI: < 30 menit setelah bukti bayar dikonfirmasi
SUPPORT: 24/7 via WhatsApp

ATURAN MENJAWAB:
- Jawab singkat dan natural, maksimal 3-4 kalimat
- Selalu pakai "kak" saat menyapa
- Gunakan emoji yang relevan (max 2-3 per pesan)
- Kalau tidak tahu atau perlu konfirmasi, arahkan ke WA admin
- Jangan buat janji harga/promo yang tidak tercantum di atas`;

let CS_AI_NAME = 'Una';
let CS_AI_ACTIVE = true;

let FAKE_BUYERS = [
  { name: 'Reza', city: 'Jakarta', product: 'Sewa Bot 1 bulan', avatar: 'R' },
  { name: 'Fajar', city: 'Surabaya', product: 'Panel Bot WA 2 minggu', avatar: 'F' },
  { name: 'Dinda', city: 'Bandung', product: 'SC Alya Ai', avatar: 'D' },
  { name: 'Aldi', city: 'Medan', product: 'Sewa Bot 7 hari', avatar: 'A' },
  { name: 'Sinta', city: 'Yogyakarta', product: 'Panel Bot WA 1 bulan', avatar: 'S' },
  { name: 'Bagas', city: 'Semarang', product: 'Sewa Bot 14 hari', avatar: 'B' },
  { name: 'Nadia', city: 'Makassar', product: 'SC Alya Ai', avatar: 'N' },
  { name: 'Rizki', city: 'Palembang', product: 'Sewa Bot 3 bulan', avatar: 'R' },
  { name: 'Ayu', city: 'Denpasar', product: 'Panel Bot WA Permanen', avatar: 'A' },
  { name: 'Hendra', city: 'Malang', product: 'Sewa Bot 1 tahun', avatar: 'H' },
];

