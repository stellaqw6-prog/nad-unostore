async function dbGet(key) {
  try {
    const url = `${FIREBASE_URL}/store/${key}.json${FIREBASE_TOKEN ? '?auth=' + FIREBASE_TOKEN : ''}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const d = await r.json();
    return d !== null && d !== undefined ? d : null;
  } catch { return null; }
}

async function dbSet(key, value) {
  try {
    const url = `${FIREBASE_URL}/store/${key}.json${FIREBASE_TOKEN ? '?auth=' + FIREBASE_TOKEN : ''}`;
    const r = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value)
    });
    return r.ok;
  } catch (e) { console.error('dbSet error:', e); return false; }
}

function normalizeArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') return Object.values(data);
  return [];
}

