// ApolloSYNC — Cloudflare Worker (chạy cùng site tĩnh, xem wrangler.jsonc)
//   GET  /api/lang       → { country } theo IP người truy cập (Cloudflare tự biết, không gọi dịch vụ ngoài)
//   GET  /api/health     → { ok, provider } để kiểm tra nhanh (mở trên trình duyệt)
//   POST /api/translate  → { target, strings:[…] } ⇒ { translations:[…] }  (dịch từ English)
//        strings = văn bản đã escape (&amp; &lt; &gt;) có thể kèm thẻ đánh dấu <x0>…</x0>, <x1/>; translations = văn bản thường, vẫn giữ các thẻ <xN> đó
//
// Nhà cung cấp dịch (khóa API nằm ở máy chủ, KHÔNG lộ ra trình duyệt):
//   1) Google Cloud Translation — nếu đã đặt secret GOOGLE_TRANSLATE_KEY   (chất lượng tốt nhất, khuyến nghị)
//        npx wrangler secret put GOOGLE_TRANSLATE_KEY
//   2) Cloudflare Workers AI (m2m100) — dùng khi không có khóa Google, không cần khóa (binding "AI" trong wrangler.jsonc)
// Kết quả được cache ở edge Cloudflare (30 ngày) nên cùng một trang chỉ tốn phí dịch 1 lần cho mỗi ngôn ngữ.

// mã ngôn ngữ của site → [mã Google, mã m2m100]
const LANGS = {
  bn: ['bn', 'bn'], fil: ['fil', 'tl'], hi: ['hi', 'hi'], id: ['id', 'id'], ko: ['ko', 'ko'],
  ng: ['ha', 'ha'],            // "ng" = Hausa (Nigeria). Đổi thành 'yo' (Yoruba) hoặc 'ig' (Igbo) nếu muốn
  ru: ['ru', 'ru'], uk: ['uk', 'uk'], vi: ['vi', 'vi'], zh: ['zh-CN', 'zh']
};
const NAMES = { bn: 'bengali', tl: 'tagalog', hi: 'hindi', id: 'indonesian', ko: 'korean', ha: 'hausa', ru: 'russian', uk: 'ukrainian', vi: 'vietnamese', zh: 'chinese' };
// Lưu ý: gói Workers miễn phí chỉ cho 50 lệnh con / lượt; mỗi câu qua Workers AI là 1 lệnh → trình duyệt gửi tối đa 20 câu / lượt
const MAX_STRINGS = 80, MAX_TOTAL = 7000, MAX_ONE = 1200;   // giới hạn mỗi yêu cầu (chống lạm dụng quota)

const json = (o, status = 200, h = {}) => new Response(JSON.stringify(o), {
  status, headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store', ...h }
});
const unent = s => s.replace(/&#39;|&quot;|&amp;|&lt;|&gt;/g, m => ({ '&#39;': "'", '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>' }[m]));
const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');

export default {
  async fetch(req, env, ctx) {
    const u = new URL(req.url);
    if (u.pathname === '/api/lang') return json({ country: (req.cf && req.cf.country) || null });
    // /api/health: mở trên trình duyệt để kiểm tra Worker đã chạy chưa và đang dùng nhà cung cấp dịch nào
    if (u.pathname === '/api/health') return json({ ok: true, provider: env.GOOGLE_TRANSLATE_KEY ? 'google' : env.AI ? 'workers-ai' : null });
    if (u.pathname === '/api/translate') return translate(req, env, ctx, u);
    return env.ASSETS.fetch(req);
  }
};

async function translate(req, env, ctx, u) {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405, { Allow: 'POST' });
  const origin = req.headers.get('Origin');
  if (origin && new URL(origin).host !== u.host) return json({ error: 'forbidden origin' }, 403);   // chỉ nhận từ chính site này
  let b; try { b = await req.json(); } catch (_) { return json({ error: 'bad json' }, 400); }
  const lang = b && LANGS[b.target], S = b && b.strings;
  if (!lang || !Array.isArray(S) || !S.length || S.some(s => typeof s !== 'string')) return json({ error: 'bad request' }, 400);
  if (S.length > MAX_STRINGS || S.some(s => s.length > MAX_ONE) || S.reduce((a, s) => a + s.length, 0) > MAX_TOTAL) return json({ error: 'too large' }, 413);

  const cache = caches.default, key = new Request('https://translate.cache.local/' + b.target + '/' + await sha(JSON.stringify(S)));
  const hit = await cache.match(key);
  if (hit) return new Response(hit.body, { headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store', 'X-Cache': 'HIT' } });

  let out;
  try {
    out = env.GOOGLE_TRANSLATE_KEY ? await viaGoogle(S, lang[0], env.GOOGLE_TRANSLATE_KEY)
      : env.AI ? await viaWorkersAI(S, lang[1], env.AI) : null;
  } catch (e) { return json({ error: 'provider failed', detail: String(e && e.message || e).slice(0, 200) }, 502); }
  if (!out) return json({ error: 'no translation provider configured' }, 501);

  const body = JSON.stringify({ translations: out });
  ctx.waitUntil(cache.put(key, new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=2592000' } })));
  return new Response(body, { headers: { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store', 'X-Cache': 'MISS' } });
}

async function viaGoogle(S, target, apiKey) {
  const r = await fetch('https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(apiKey), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: S, source: 'en', target, format: 'html' })   // html: giữ nguyên các thẻ <xN> đánh dấu định dạng
  });
  if (!r.ok) throw new Error('google ' + r.status);
  const j = await r.json();
  return j.data.translations.map(t => unent(t.translatedText));
}

async function viaWorkersAI(S, target, AI) {
  const run = async s => {
    let r;
    s = unent(s);                                              // Workers AI nhận văn bản thường (bỏ escape &amp; &lt; &gt;)
    try { r = await AI.run('@cf/meta/m2m100-1.2b', { text: s, source_lang: 'en', target_lang: target }); }
    catch (_) { r = await AI.run('@cf/meta/m2m100-1.2b', { text: s, source_lang: 'english', target_lang: NAMES[target] }); }
    if (!r || typeof r.translated_text !== 'string') throw new Error('ai empty');
    return r.translated_text;
  };
  const out = new Array(S.length); let k = 0;
  await Promise.all(Array.from({ length: Math.min(6, S.length) }, async () => { while (k < S.length) { const i = k++; out[i] = await run(S[i]); } }));
  return out;
}
