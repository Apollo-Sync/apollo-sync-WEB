/* ApolloSYNC — chọn ngôn ngữ + dịch tự động bằng API + nhận diện ngôn ngữ theo IP
 *
 * Gắn vào MỌI trang, ngay sau network.js / main.js:   <script src="js/lang.js"></script>
 * Không cần thư mục hay trang riêng cho từng ngôn ngữ: chữ trên trang được quét, gửi tới /api/translate
 * (Cloudflare Worker, xem worker.js) rồi thay tại chỗ. Tiếng Anh gốc luôn được giữ lại để đổi ngược / đổi sang ngôn ngữ khác.
 *
 *  • Ngôn ngữ ban đầu: lựa chọn đã lưu của khách → quốc gia theo IP (/api/lang, rồi các nguồn dự phòng) → ngôn ngữ trình duyệt → English.
 *  • Bản dịch được lưu trong localStorage (lần sau không gọi API nữa) và cache ở edge Cloudflare (người sau cũng không tốn phí).
 *  • Chữ do network.js tự vẽ (nhãn nhóm, ghi chú, bảng thông tin dự án) dịch qua window.apTr(); network.js đăng ký chuỗi qua window.apStrings.
 *  • Không muốn dịch một đoạn: thêm translate="no" (hoặc class="notranslate") vào thẻ đó.
 */
(() => {
  'use strict';

  const API_TRANSLATE = '/api/translate', API_LANG = '/api/lang';
  // [mã, tên hiển thị] — "ng" = Hausa (Nigeria); đổi tên ở đây và mã đích trong worker.js nếu muốn ngôn ngữ khác
  const LANGS = [
    ['en', 'English'], ['vi', 'Tiếng Việt'], ['zh', '中文'], ['ko', '한국어'], ['ru', 'Русский'], ['uk', 'Українська'],
    ['id', 'Bahasa Indonesia'], ['fil', 'Filipino'], ['hi', 'हिन्दी'], ['bn', 'বাংলা'], ['ng', 'Hausa (Nigeria)']
  ];
  const BY_COUNTRY = {   // quốc gia (ISO 2 ký tự) → ngôn ngữ
    VN: 'vi', CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh', SG: 'zh', KR: 'ko', KP: 'ko',
    RU: 'ru', BY: 'ru', KZ: 'ru', UA: 'uk', ID: 'id', PH: 'fil', IN: 'hi', BD: 'bn', NG: 'ng'
  };
  const HTML_LANG = { ng: 'ha' };
  const PROTECT = ['ApolloSYNC'];                  // tên riêng giữ nguyên, không dịch
  const FALLBACK = 'en', KEY = 'apollosync_lang', CC = 'apollosync_cc', CACHE = 'ap_tr_v1_';
  const MAX_ONE = 1200;

  const CODES = LANGS.map(l => l[0]), NAME = Object.fromEntries(LANGS);
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} },
    sget: k => { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
    sset: (k, v) => { try { sessionStorage.setItem(k, v); } catch (_) {} }
  };
  const timeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);

  // ───────── nhận diện quốc gia theo IP ─────────
  async function getCountry() {
    const cached = store.sget(CC);
    if (cached) return cached;
    const sources = [
      async () => (await (await fetch(API_LANG, { cache: 'no-store' })).json()).country,        // Worker của site (cf.country)
      async () => ((await (await fetch('/cdn-cgi/trace', { cache: 'no-store' })).text()).match(/^loc=([A-Z]{2})/m) || [])[1],
      async () => (await (await fetch('https://get.geojs.io/v1/ip/country.json')).json()).country,
      async () => (await (await fetch('https://ipapi.co/country/')).text()).trim()
    ];
    for (const f of sources) {
      try {
        const v = await timeout(f(), 2500);
        if (/^[A-Z]{2}$/.test(v)) { store.sset(CC, v); return v; }
      } catch (_) {}
    }
    return null;
  }
  function browserLang() {
    const map = { tl: 'fil' };
    for (const l of navigator.languages || [navigator.language]) {
      let k = (l || '').toLowerCase().split('-')[0];
      k = map[k] || k;
      if (CODES.includes(k)) return k;
    }
    return null;
  }

  // ───────── bộ dịch ─────────
  // Đơn vị dịch = cả câu/khối chữ (không dịch từng mảnh): vd <h1><em>secure</em> the<br>network</h1> → 1 câu,
  // thẻ bên trong được thay bằng <x0>…</x0>, <x1/> để máy dịch giữ đúng vị trí; dựng lại từ chính các thẻ gốc nên an toàn (không chèn HTML từ máy dịch).
  const SKIP = '[translate=no],.notranslate,.ap-lang,.nd-info,#note,script,style,noscript,textarea,code,pre,svg,canvas,iframe,select';
  const INLINE = new Set(['EM', 'STRONG', 'B', 'I', 'A', 'SPAN', 'BR', 'SMALL', 'U', 'MARK', 'SUB', 'SUP', 'ABBR', 'TIME', 'S', 'WBR', 'BDI']);
  const VOID = new Set(['BR', 'WBR']);
  const ATTRS = ['title', 'aria-label', 'placeholder'];
  const HAS_LETTER = /\p{L}/u;
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const unent = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const units = [], attrs = [], tseen = new WeakSet(), attrSeen = new WeakMap();
  const meta = { title: null, desc: null };
  let cur = 'en', dict = new Map(), token = 0, obs = null;
  // dict: chuỗi gốc (dạng gửi đi) → bản dịch (văn bản thường, có thể kèm <xN>)
  window.apTr = s => (cur === 'en' || !s ? s : (dict.get(esc(norm(s))) || s));
  window.apLang = () => cur;

  // "có chữ cần dịch": bỏ tên riêng (ApolloSYNC…) trước khi kiểm tra → đoạn chỉ có tên thương hiệu thì không gửi đi dịch
  const hasTx = s => HAS_LETTER.test(PROTECT.reduce((a, t) => a.split(t).join(''), s));
  const lettered = el => hasTx(el.textContent);
  const hasDirectText = el => [...el.childNodes].some(c => c.nodeType === 3 && hasTx(c.nodeValue));
  // khối "dịch nguyên câu" được nếu mọi phần tử con có chữ đều là thẻ inline (phần tử con không có chữ — số, icon, ảnh — được giữ nguyên)
  const unitOK = el => [...el.children].every(c => !lettered(c) || (INLINE.has(c.tagName) && !c.matches(SKIP) && unitOK(c)));
  function ser(el, toks) {
    let s = '';
    for (const c of el.childNodes) {
      if (c.nodeType === 3) s += esc(c.nodeValue);
      else if (c.nodeType === 1) {
        const i = toks.length;
        if (!lettered(c)) { toks.push({ el: c, deep: true }); s += '<x' + i + '/>'; }
        else { toks.push({ el: c }); s += VOID.has(c.tagName) ? '<x' + i + '/>' : '<x' + i + '>' + ser(c, toks) + '</x' + i + '>'; }
      }
    }
    return s;
  }
  function rebuild(str, toks) {                          // chuỗi đã dịch (có <xN>) → DocumentFragment từ các thẻ gốc
    const frag = document.createDocumentFragment(), stack = [frag], top = () => stack[stack.length - 1];
    const re = /<x(\d+)\s*(\/?)>|<\/x(\d+)\s*>/g; let last = 0, m;
    while ((m = re.exec(str))) {
      if (m.index > last) top().appendChild(document.createTextNode(str.slice(last, m.index)));
      last = re.lastIndex;
      if (m[3] !== undefined) { if (stack.length > 1 && top()._i === +m[3]) stack.pop(); continue; }
      const t = toks[+m[1]]; if (!t) continue;
      if (t.deep) top().appendChild(t.el);
      else if (m[2] || VOID.has(t.el.tagName)) top().appendChild(t.el.cloneNode(false));
      else { const el = t.el.cloneNode(false); el._i = +m[1]; top().appendChild(el); stack.push(el); }
    }
    if (last < str.length) top().appendChild(document.createTextNode(str.slice(last)));
    return frag;
  }
  function scan(el) {
    if (el.nodeType !== 1 || el.matches(SKIP) || el.hasAttribute('data-ap')) return;
    if (hasDirectText(el) && unitOK(el)) {
      const toks = [];
      units.push({ k: 'e', el, kids: [...el.childNodes], toks, src: norm(ser(el, toks)), lang: 'en' });
      el.setAttribute('data-ap', ''); return;
    }
    for (const c of el.childNodes) {
      if (c.nodeType === 1) scan(c);
      else if (c.nodeType === 3 && !tseen.has(c) && hasTx(c.nodeValue) && !el.closest('[data-ap]')) {
        tseen.add(c);
        const t = c.nodeValue, m = t.match(/^(\s*)([\s\S]*?)(\s*)$/);
        units.push({ k: 't', n: c, orig: t, lead: m[1], trail: m[3], raw: norm(m[2]), src: esc(norm(m[2])), lang: 'en' });
      }
    }
  }
  function scanAttrs(root) {
    const els = [root, ...root.querySelectorAll('[title],[aria-label],[placeholder]')];
    for (const el of els) {
      if (el.nodeType !== 1 || el.closest(SKIP)) continue;
      const done = attrSeen.get(el) || new Set(); attrSeen.set(el, done);
      for (const a of ATTRS) {
        const v = el.getAttribute(a);
        if (v && !done.has(a) && hasTx(v)) { done.add(a); attrs.push({ el, a, raw: norm(v), src: esc(norm(v)), orig: v, lang: 'en' }); }
      }
    }
  }
  function collect() {
    for (let i = units.length - 1; i >= 0; i--) if (!(units[i].el || units[i].n).isConnected) units.splice(i, 1);   // bỏ phần đã bị xoá khỏi trang
    for (let i = attrs.length - 1; i >= 0; i--) if (!attrs[i].el.isConnected) attrs.splice(i, 1);
    scan(document.body); scanAttrs(document.body);
    if (meta.title === null) meta.title = document.title;
    const d = document.querySelector('meta[name="description"]');
    if (d && meta.desc === null) meta.desc = d.getAttribute('content') || '';
  }

  const protect = s => PROTECT.reduce((a, t, i) => a.split(t).join('⟦' + i + '⟧'), s);
  const unprotect = s => s.replace(/⟦\s*(\d+)\s*⟧/g, (_, i) => PROTECT[+i] || '');
  // Kiểm tra bản dịch: phải còn đủ tên riêng và đủ thẻ <xN>; không đạt → dùng lại English (không bao giờ hiển thị bản dịch hỏng)
  const validated = (src, out) => {
    const fallback = unent(src);
    if (typeof out !== 'string' || !out.trim()) return fallback;
    const p = protect(src);
    for (let i = 0; i < PROTECT.length; i++) if (p.includes('⟦' + i + '⟧') && !new RegExp('⟦\\s*' + i + '\\s*⟧').test(out)) return fallback;
    const toks = src.match(/<x\d+\s*\/?>/g) || [];
    for (const tk of toks) { const i = tk.match(/\d+/)[0]; if (!new RegExp('<x' + i + '\\s*/?>').test(out)) return fallback; }
    return unprotect(out);
  };

  async function requestTranslations(lang, list) {
    const chunks = []; let part = [], len = 0, start = 0;
    list.forEach((s, i) => {
      if (part.length && (part.length >= 60 || len + s.length > 4500)) { chunks.push([start, part]); part = []; len = 0; start = i; }
      part.push(s); len += s.length;
    });
    if (part.length) chunks.push([start, part]);
    const out = new Array(list.length); let k = 0;
    await Promise.all(Array.from({ length: Math.min(3, chunks.length) }, async () => {
      while (k < chunks.length) {
        const [st, arr] = chunks[k++];
        const r = await timeout(fetch(API_TRANSLATE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target: lang, strings: arr }) }), 30000);
        if (!r.ok) throw new Error('translate ' + r.status);
        const j = await r.json();
        arr.forEach((_, i) => { out[st + i] = j.translations[i]; });
      }
    }));
    return out;
  }
  const loadCache = l => { try { return JSON.parse(localStorage.getItem(CACHE + l)) || {}; } catch (_) { return {}; } };
  const saveCache = (l, o) => { try { localStorage.setItem(CACHE + l, JSON.stringify(o)); } catch (_) {} };

  function put(u, lang) {                              // đặt bản dịch (hoặc English khi lang='en') cho 1 đơn vị
    const out = lang === 'en' ? null : dict.get(u.src);
    if (u.k === 't') u.n.nodeValue = out != null ? u.lead + out + u.trail : u.orig;
    else if (out != null) u.el.replaceChildren(rebuild(out, u.toks));
    else u.el.replaceChildren(...u.kids);
    u.lang = lang;
  }
  function render(force) {
    for (const u of units) if (force || u.lang !== cur) put(u, cur);
    for (const a of attrs) if (force || a.lang !== cur) { a.el.setAttribute(a.a, cur === 'en' ? a.orig : (dict.get(a.src) ?? a.raw)); a.lang = cur; }
    const d = document.querySelector('meta[name="description"]');
    document.title = cur === 'en' ? meta.title : (dict.get(esc(norm(meta.title))) || meta.title);
    if (d && meta.desc) d.setAttribute('content', cur === 'en' ? meta.desc : (dict.get(esc(norm(meta.desc))) || meta.desc));
    if (obs) obs.takeRecords();                        // bỏ qua các thay đổi DOM do chính mình gây ra
  }

  async function apply(lang, announce) {
    const my = ++token;
    collect();
    if (lang === 'en') { cur = 'en'; dict = new Map(); render(true); done(lang, announce); return; }
    const cache = loadCache(lang), want = new Set();
    units.forEach(u => want.add(u.src)); attrs.forEach(a => want.add(a.src));
    (window.apStrings || []).forEach(s => s && want.add(esc(norm(s))));
    if (meta.title) want.add(esc(norm(meta.title))); if (meta.desc) want.add(esc(norm(meta.desc)));
    const need = [...want].filter(s => s.length <= MAX_ONE && !(s in cache));
    try {
      if (need.length) {
        busy(true);
        const res = await requestTranslations(lang, need.map(protect));
        if (my !== token) return;
        need.forEach((s, i) => { cache[s] = validated(s, res[i]); });
        saveCache(lang, cache);
      }
      if (my !== token) return;
      const same = cur === lang;
      cur = lang; dict = new Map(Object.entries(cache));
      render(!same);
      done(lang, announce);
    } catch (e) {
      if (my !== token) return;
      console.warn('[lang] dịch không thành công, giữ nguyên English:', e);
      cur = 'en'; dict = new Map(); render(true); show('en'); done('en', announce);
    }
  }
  function done(lang, announce) {
    busy(false);
    document.documentElement.lang = HTML_LANG[lang] || lang;
    if (announce) window.dispatchEvent(new CustomEvent('ap:lang', { detail: { lang } }));   // network.js vẽ lại chữ của nó
  }

  // ───────── giao diện nút chọn ngôn ngữ ─────────
  let btn, menu, label;
  const css = `
.ap-lang{position:relative;display:inline-block;font:inherit;z-index:100}
.ap-lang-fixed{position:fixed;top:18px;right:24px}
.ap-lang-b{display:flex;align-items:center;gap:8px;padding:7px 13px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(255,255,255,.04);color:#e6f3ff;font:600 14px/1 inherit;font-family:inherit;cursor:pointer;transition:border-color .15s,background .15s}
.ap-lang-b:hover,.ap-lang-b[aria-expanded=true]{border-color:#22d3ee;background:rgba(34,211,238,.08)}
.ap-lang-b svg{width:15px;height:15px;opacity:.85}
.ap-lang-b .c{letter-spacing:.06em}
.ap-lang-b .v{width:9px;height:9px;transition:transform .15s}
.ap-lang-b[aria-expanded=true] .v{transform:rotate(180deg)}
.ap-lang-b.busy .g{animation:apSpin .9s linear infinite;color:#22d3ee;opacity:1}
.ap-lang-m{position:absolute;right:0;top:calc(100% + 8px);min-width:210px;max-height:70vh;overflow:auto;padding:6px;margin:0;list-style:none;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:#08111f;box-shadow:0 18px 50px rgba(0,0,0,.6),0 0 0 1px rgba(34,211,238,.06);display:none}
.ap-lang-m.on{display:block;animation:apIn .14s ease-out}
.ap-lang-m li{margin:0;list-style:none}
.ap-lang-m button{display:flex;align-items:center;gap:12px;width:100%;padding:9px 11px;border:0;border-radius:9px;background:transparent;color:#d6e6f5;font:500 14px/1.2 inherit;font-family:inherit;text-align:left;cursor:pointer}
.ap-lang-m button:hover,.ap-lang-m button:focus-visible{background:rgba(34,211,238,.12);outline:0;color:#fff}
.ap-lang-m button .k{flex:none;width:30px;text-align:center;padding:2px 0;border:1px solid rgba(255,255,255,.18);border-radius:6px;font-size:11px;letter-spacing:.08em;color:#8fb3d1;text-transform:uppercase}
.ap-lang-m button[aria-selected=true]{color:#22d3ee}
.ap-lang-m button[aria-selected=true] .k{border-color:#22d3ee;color:#22d3ee}
.ap-lang-m button[aria-selected=true]::after{content:"✓";margin-left:auto}
@keyframes apIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@keyframes apSpin{to{transform:rotate(360deg)}}`;

  function findHost() {
    const slot = document.getElementById('lang-switch');
    if (slot) return { slot };
    const link = document.querySelector('header a[href*="roject" i], nav a[href*="roject" i]');
    // chèn vào cuối cụm link (repo: <div class="nav-links">Home · Projects</div>) → giữ nguyên bố cục menu cũ
    if (link && link.parentElement) return { append: link.parentElement };
    return {};
  }
  function build() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const wrap = document.createElement('div'); wrap.className = 'ap-lang'; wrap.setAttribute('translate', 'no');
    wrap.innerHTML = `<button type="button" class="ap-lang-b" aria-haspopup="listbox" aria-expanded="false" title="Language">
<svg class="g" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>
<span class="c"></span><svg class="v" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1 3l4 4 4-4"/></svg></button>
<ul class="ap-lang-m" role="listbox">${LANGS.map(([c, n]) => `<li><button type="button" role="option" data-c="${c}"><span class="k">${c}</span>${n}</button></li>`).join('')}</ul>`;
    const h = findHost();
    if (h.slot) h.slot.appendChild(wrap);
    else if (h.append) { wrap.style.marginLeft = '24px'; wrap.style.verticalAlign = 'middle'; h.append.appendChild(wrap); }
    else wrap.classList.add('ap-lang-fixed'), document.body.appendChild(wrap);
    btn = wrap.querySelector('.ap-lang-b'); menu = wrap.querySelector('.ap-lang-m'); label = btn.querySelector('.c');
    const close = () => { menu.classList.remove('on'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', () => {
      const open = !menu.classList.contains('on');
      menu.classList.toggle('on', open); btn.setAttribute('aria-expanded', String(open));
      if (open) (menu.querySelector('[aria-selected=true]') || menu.querySelector('button')).focus();
    });
    menu.addEventListener('click', e => {
      const b = e.target.closest('button[data-c]'); if (!b) return;
      const code = b.dataset.c; store.set(KEY, code); close(); setLang(code, true);   // người dùng chọn tay → luôn được ưu tiên về sau
    });
    document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
    document.addEventListener('keydown', e => {
      if (!menu.classList.contains('on')) return;
      if (e.key === 'Escape') { close(); btn.focus(); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const items = [...menu.querySelectorAll('button')], i = items.indexOf(document.activeElement);
        items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
      }
    });
  }
  function show(code) {
    label.textContent = code.toUpperCase();
    btn.title = NAME[code];
    menu.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.c === code)));
  }
  const busy = on => btn && btn.classList.toggle('busy', on);
  const setLang = (code, announce) => { show(code); return apply(code, announce); };

  async function boot() {
    build();
    const saved = CODES.includes(store.get(KEY)) ? store.get(KEY) : null;
    show(saved || browserLang() || FALLBACK);           // hiển thị tạm trong lúc dò IP
    const code = saved || (BY_COUNTRY[await getCountry()] || browserLang() || FALLBACK);
    await setLang(code, code !== 'en');
    // nội dung được thêm sau khi tải (vd. ticker "block … signed" trên trang Projects) cũng được dịch
    let tm;
    obs = new MutationObserver(ms => {
      if (!ms.some(m => m.addedNodes.length && !(m.target.closest && m.target.closest('[data-ap],' + SKIP)))) return;
      clearTimeout(tm); tm = setTimeout(() => apply(cur, false), 300);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
