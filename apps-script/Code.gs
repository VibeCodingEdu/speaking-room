/**
 * Speaking Room server (Google Apps Script web app).
 * Holds the Anthropic API key, syncs progress between devices,
 * and keeps the private personal cards out of the public repo.
 *
 * Script properties (Project Settings > Script Properties):
 *   ANTHROPIC_API_KEY   sk-ant-...
 *   APP_SECRET          any passphrase; the app sends it with every call
 *   DAILY_LIMIT         optional, AI calls per day (default 300)
 */
const P = PropertiesService.getScriptProperties();
const MODELS = { quick: 'claude-haiku-5-5', smart: 'claude-sonnet-5-5' };
const CHUNK = 8000;

function doGet() { return out({ ok: true, app: 'speaking-room' }); }

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out({ ok: false, error: 'bad_json' }); }
  const secret = P.getProperty('APP_SECRET');
  if (!secret || req.secret !== secret) return out({ ok: false, error: 'unauthorized' });
  try {
    switch (req.action) {
      case 'ping': return out({ ok: true });
      case 'load': return out({ ok: true, state: readState() });
      case 'save': return out({ ok: true, state: saveState(req.state || {}) });
      case 'ai':   return out({ ok: true, text: callClaude(req) });
      default:     return out({ ok: false, error: 'unknown_action' });
    }
  } catch (err) {
    return out({ ok: false, error: String((err && err.message) || err) });
  }
}

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------- state storage, chunked across script properties ---------- */
function getBig(key, def) {
  const n = Number(P.getProperty(key + '#n') || 0);
  if (!n) return def;
  let s = '';
  for (let i = 0; i < n; i++) s += P.getProperty(key + '#' + i) || '';
  try { return JSON.parse(s); } catch (e) { return def; }
}
function putBig(key, obj) {
  const s = JSON.stringify(obj);
  const old = Number(P.getProperty(key + '#n') || 0);
  const parts = {};
  let n = 0;
  for (let i = 0; i < s.length; i += CHUNK) parts[key + '#' + (n++)] = s.slice(i, i + CHUNK);
  parts[key + '#n'] = String(n);
  P.setProperties(parts);
  for (let i = n; i < old; i++) P.deleteProperty(key + '#' + i);
}
function readState() {
  return { srs: getBig('srs', {}), days: getBig('days', {}), speech: getBig('speech', []), cards: getBig('cards', { updatedAt: '', list: [] }), level: getBig('level', null) };
}
function saveState(incoming) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const merged = mergeState(readState(), incoming);
    putBig('srs', merged.srs);
    putBig('days', merged.days);
    putBig('speech', merged.speech);
    putBig('cards', merged.cards);
    if (merged.level) putBig('level', merged.level);
    return merged;
  } finally { lock.releaseLock(); }
}

/* Same rules as mergeState in app.js */
function mergeState(a, b) {
  const res = { srs: {}, days: {}, speech: [], cards: { updatedAt: '', list: [] } };
  const sa = a.srs || {}, sb = b.srs || {};
  Object.keys(Object.assign({}, sa, sb)).forEach(function (id) {
    const x = sa[id], y = sb[id];
    res.srs[id] = !x ? y : !y ? x : ((x.last || '') >= (y.last || '') ? x : y);
  });
  const da = a.days || {}, db = b.days || {};
  Object.keys(Object.assign({}, da, db)).forEach(function (d) {
    const x = da[d] || {}, y = db[d] || {}, m = {};
    Object.keys(Object.assign({}, x, y)).forEach(function (dev) {
      const p = x[dev] || {}, q = y[dev] || {}, r = {};
      if (typeof p !== 'object' || typeof q !== 'object') return;
      Object.keys(Object.assign({}, p, q)).forEach(function (k) { r[k] = Math.max(Number(p[k]) || 0, Number(q[k]) || 0); });
      m[dev] = r;
    });
    res.days[d] = m;
  });
  const seen = {};
  (a.speech || []).concat(b.speech || []).forEach(function (r) {
    if (!r || !r.at) return;
    const p = seen[r.at];
    if (!p || (r.feedback && !p.feedback)) seen[r.at] = r;
  });
  res.speech = Object.keys(seen).map(function (k) { return seen[k]; })
    .sort(function (p, q) { return q.at < p.at ? -1 : q.at > p.at ? 1 : 0; }).slice(0, 60);
  const ca = a.cards || {}, cb = b.cards || {};
  res.cards = (ca.updatedAt || '') >= (cb.updatedAt || '') ? (ca.list ? ca : { updatedAt: '', list: [] }) : cb;
  const la = a.level, lb = b.level;
  res.level = !la ? (lb || null) : !lb ? la : ((la.updatedAt || '') >= (lb.updatedAt || '') ? la : lb);
  return res;
}

/* ---------- Claude ---------- */
function callClaude(req) {
  const key = P.getProperty('ANTHROPIC_API_KEY');
  if (!key) throw new Error('no_api_key');
  const day = Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyy-MM-dd');
  const countKey = 'ai_count_' + day;
  const limit = Number(P.getProperty('DAILY_LIMIT') || 300);
  const used = Number(P.getProperty(countKey) || 0);
  if (used >= limit) throw new Error('daily_limit');
  P.setProperty(countKey, String(used + 1));

  const messages = (req.messages || []).filter(function (m) {
    return m && (m.role === 'user' || m.role === 'assistant') && String(m.content || '').trim();
  }).map(function (m) { return { role: m.role, content: String(m.content).slice(0, 6000) }; });
  if (!messages.length || messages[messages.length - 1].role !== 'user') throw new Error('bad_messages');

  const body = {
    model: MODELS[req.model] || MODELS.quick,
    max_tokens: Math.min(Number(req.max_tokens) || 700, 2000),
    system: String(req.system || '').slice(0, 6000),
    messages: messages
  };
  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
  const code = res.getResponseCode();
  const j = JSON.parse(res.getContentText() || '{}');
  if (code !== 200) throw new Error('api_' + code + ': ' + ((j.error && j.error.message) || ''));
  return (j.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('');
}

/* Run once from the editor to check the key works (View > Logs). */
function testClaude() {
  Logger.log(callClaude({ model: 'quick', system: 'Reply in five words.', messages: [{ role: 'user', content: 'Say hello to Mendy.' }] }));
}

/* Optional: clean old daily counters. */
function cleanupCounters() {
  const today = Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyy-MM-dd');
  Object.keys(P.getProperties()).forEach(function (k) { if (k.indexOf('ai_count_') === 0 && k !== 'ai_count_' + today) P.deleteProperty(k); });
}
