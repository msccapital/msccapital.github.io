/* Reads data/posts.json and renders post cards.
   To publish a new post: open data/posts.json and add a new object at the top
   of the array (slug, title, excerpt, date, author, tag, cover, video, content[]).
   "date" có thể kèm giờ: "2026-10-28T14:30" (giờ Việt Nam), không bắt buộc.
   Leave "video" empty ("") for a text-only post, or paste a YouTube embed URL
   (https://www.youtube.com/embed/VIDEO_ID) to attach a clip, the way 24hmoney
   or Bò và Gấu do. */

function formatDateVN(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* Ngày giờ đăng bài.
   "date" có thể là "2026-10-28" (bài cũ, chỉ có ngày) hoặc "2026-10-28T14:30" (bài mới, có giờ Việt Nam).
   Vẫn hỗ trợ ô "time" riêng (dạng 14:30) nếu có. Bài có giờ hiện "14:30 · 28/10/2026" và được xếp theo giờ. */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const pad2 = (n) => String(n).padStart(2, '0');
function postWhen(p) {
  const raw = String(p.date || '').trim();
  // có múi giờ (ví dụ ...Z hoặc +07:00): đổi sang giờ Việt Nam
  if (/T\d{2}:\d{2}.*(Z|[+-]\d{2}:?\d{2})$/i.test(raw)) {
    const d = new Date(raw);
    if (!isNaN(d)) {
      const f = {};
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
        .formatToParts(d).forEach(x => { f[x.type] = x.value; });
      const hh = f.hour === '24' ? '00' : f.hour;
      return { y: +f.year, mo: +f.month, d: +f.day, hh, mm: f.minute, hasTime: true };
    }
  }
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return null;
  let hh = m[4], mm = m[5];
  if (hh == null && TIME_RE.test(String(p.time || '').trim())) [hh, mm] = String(p.time).trim().split(':');
  return { y: +m[1], mo: +m[2], d: +m[3], hh: hh == null ? '' : pad2(hh), mm: hh == null ? '' : pad2(mm), hasTime: hh != null };
}
function formatPostDate(p) {
  const w = postWhen(p);
  if (!w) return formatDateVN(p.date);
  const d = pad2(w.d) + '/' + pad2(w.mo) + '/' + w.y;
  return w.hasTime ? `${w.hh}:${w.mm} · ${d}` : d;
}
function postSortKey(p) {
  const w = postWhen(p);
  if (!w) return new Date(p.date).getTime() || 0;
  return Date.UTC(w.y, w.mo - 1, w.d, w.hasTime ? +w.hh : 0, w.hasTime ? +w.mm : 0);
}

function postThumbHTML(post) {
  if (post.video) {
    const id = post.video.split('/embed/')[1];
    const imgSrc = id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
    return `<div class="post-thumb">
      ${imgSrc ? `<img src="${imgSrc}" alt="${escHtml(post.title)}" loading="lazy">` : ''}
      <div class="play">
        <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="#edf3ee" stroke-width="1.4"/><path d="M10 8l6 4-6 4V8z" fill="#edf3ee"/></svg>
      </div>
    </div>`;
  }
  return `<div class="post-thumb">${post.cover ? `<img src="${post.cover}" alt="${escHtml(post.title)}" loading="lazy">` : ''}</div>`;
}

function slugifyVN(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function toEmbedUrl(url) {
  if (!url || url.includes('/embed/')) return url || '';
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

/* ===== Hiển thị nội dung viết bằng trình soạn thảo (Markdown) =====
   Hỗ trợ: tiêu đề, in đậm, in nghiêng, liên kết, ảnh, danh sách, trích dẫn, đường kẻ, khối mã.
   Nội dung được "escape" HTML trước nên không chạy được mã lạ. */
function escHtml(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function mdUrl(u) {
  u = String(u).trim();
  if (/^(javascript|data|vbscript):/i.test(u)) return '#';
  return /^\/(?!\/)/.test(u) ? u.replace(/^\/+/, '') : u;      // "/assets/img/x.jpg" -> "assets/img/x.jpg"
}
function mdInline(text) {
  const stash = [];
  const keep = (html) => '\u0000' + (stash.push(html) - 1) + '\u0000';
  let t = escHtml(text);
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g,
        (m, alt, url) => keep(`<img src="${mdUrl(url)}" alt="${alt}" loading="lazy">`));
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g,
        (m, txt, url) => keep(`<a href="${mdUrl(url)}" target="_blank" rel="noopener">${txt}</a>`));
  t = t.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
       .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
       .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
       .replace(/(^|[^*])\*([^*\s][^*\n]*?)\*(?!\*)/g, '$1<em>$2</em>')
       .replace(/(^|[^\w_])_([^_\s][^_\n]*?)_(?![\w_])/g, '$1<em>$2</em>');
  return t.replace(/\u0000(\d+)\u0000/g, (m, i) => stash[+i]);
}
function renderMarkdown(src) {
  const lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  const blank = (l) => !l.trim();
  const startsBlock = (l) => /^(#{1,6}\s|>|\s*[-*+]\s+|\s*\d+[.)]\s+|```|(-{3,}|\*{3,}|_{3,})\s*$)/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (blank(line)) { i++; continue; }
    let m;
    if (/^```/.test(line)) {                                    // khối mã
      const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${escHtml(buf.join('\n'))}</code></pre>`);
    } else if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {         // tiêu đề: # và ## -> h2, ### -> h3, #### trở đi -> h4
      const lvl = Math.min(Math.max(m[1].length, 2), 4);
      out.push(`<h${lvl}>${mdInline(m[2])}</h${lvl}>`); i++;
    } else if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push('<hr>'); i++;
    } else if (/^>/.test(line)) {                               // trích dẫn
      const buf = [];
      while (i < lines.length && /^>/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${mdInline(buf.join('\n')).replace(/\n/g, '<br>')}</blockquote>`);
    } else if (/^\s*[-*+]\s+/.test(line)) {                     // danh sách dấu chấm
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*+]\s+/, ''));
      out.push('<ul>' + items.map(x => `<li>${mdInline(x)}</li>`).join('') + '</ul>');
    } else if (/^\s*\d+[.)]\s+/.test(line)) {                   // danh sách đánh số
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
      out.push('<ol>' + items.map(x => `<li>${mdInline(x)}</li>`).join('') + '</ol>');
    } else {                                                    // đoạn văn
      const buf = [];
      while (i < lines.length && !blank(lines[i]) && (buf.length === 0 || !startsBlock(lines[i]))) buf.push(lines[i++]);
      out.push(`<p>${mdInline(buf.join('\n')).replace(/\n/g, '<br>')}</p>`);
    }
  }
  return out.join('\n');
}

/* ===== Làm sạch nội dung HTML từ trình soạn thảo (soan-bai.html) =====
   Chỉ giữ các thẻ và kiểu định dạng an toàn: đậm/nghiêng/gạch chân, tiêu đề, danh sách, trích dẫn, liên kết, ảnh,
   video YouTube, cỡ chữ, màu chữ, màu nền, căn lề. Mọi thứ khác (script, sự kiện onclick...) bị loại bỏ. */
const SAN_TAGS = new Set(['P','BR','H1','H2','H3','H4','STRONG','B','EM','I','U','S','DEL','SUB','SUP','UL','OL','LI','BLOCKQUOTE','A','IMG','SPAN','DIV','HR','IFRAME','PRE','CODE']);
const SAN_DROP = new Set(['SCRIPT','STYLE','OBJECT','EMBED','FORM','INPUT','BUTTON','TEXTAREA','SELECT','LINK','META','SVG','MATH','NOSCRIPT','TEMPLATE']);
const SAN_COLOR = /^(#[0-9a-f]{3,8}|rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(,\s*[\d.]+%?\s*)?\)|[a-z]{3,20})$/i;
function sanStyle(css) {
  const out = [];
  String(css || '').split(';').forEach(decl => {
    const i = decl.indexOf(':');
    if (i < 0) return;
    const k = decl.slice(0, i).trim().toLowerCase(), v = decl.slice(i + 1).trim();
    if ((k === 'color' || k === 'background-color') && SAN_COLOR.test(v)) out.push(`${k}: ${v}`);
    else if (k === 'font-size' && /^\d+(\.\d+)?(px|pt|em|rem|%)$/i.test(v)) out.push(`font-size: ${v}`);
    else if (k === 'text-align' && /^(left|right|center|justify)$/i.test(v)) out.push(`text-align: ${v.toLowerCase()}`);
    else if (k === 'font-weight' && /^(normal|bold|[1-9]00)$/i.test(v)) out.push(`font-weight: ${v}`);
    else if (k === 'font-style' && /^(normal|italic)$/i.test(v)) out.push(`font-style: ${v}`);
    else if (k === 'text-decoration' && /^(none|underline|line-through|underline line-through)$/i.test(v)) out.push(`text-decoration: ${v}`);
  });
  return out.join('; ');
}
function sanUrl(u, allowRelative) {
  u = String(u || '').trim();
  if (/^(https?:|mailto:|tel:|#)/i.test(u)) return u;
  if (allowRelative && /^[\w./%~-][^:]*$/.test(u) && !u.includes('..')) return u.replace(/^\/+/, '');
  return '';
}
function sanNode(node, doc) {
  if (node.nodeType === 3) return doc.createTextNode(node.nodeValue);
  if (node.nodeType !== 1) return null;
  const tag = node.tagName;
  const frag = doc.createDocumentFragment();
  const kids = () => { node.childNodes.forEach(c => { const r = sanNode(c, doc); if (r) frag.appendChild(r); }); return frag; };
  if (SAN_DROP.has(tag)) return null;
  if (!SAN_TAGS.has(tag)) return kids();                      // thẻ lạ: bỏ thẻ, giữ chữ bên trong
  const el = doc.createElement(tag.toLowerCase());
  const style = sanStyle(node.getAttribute('style'));
  if (style && tag !== 'IFRAME' && tag !== 'IMG') el.setAttribute('style', style);
  const cls = (node.getAttribute('class') || '').split(/\s+/).filter(c => /^ql-indent-[1-8]$/.test(c) || c === 'ql-video');
  if (cls.length && tag !== 'IFRAME') el.setAttribute('class', cls.filter(c => c !== 'ql-video').join(' '));
  if (tag === 'A') {
    const h = sanUrl(node.getAttribute('href'), false);
    if (!h) return kids();
    el.setAttribute('href', h); el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer');
  }
  if (tag === 'IMG') {
    const src = sanUrl(node.getAttribute('src'), true);
    if (!src || /^(mailto:|tel:|#)/i.test(src)) return null;
    el.setAttribute('src', src); el.setAttribute('alt', node.getAttribute('alt') || ''); el.setAttribute('loading', 'lazy');
    const st = sanStyle(node.getAttribute('style')); if (st) el.setAttribute('style', st);
    return el;
  }
  if (tag === 'IFRAME') {
    const src = String(node.getAttribute('src') || '').trim();
    if (!/^https:\/\/(www\.)?youtube(-nocookie)?\.com\/embed\/[\w-]+(\?[\w=&%.-]*)?$/i.test(src)) return null;
    el.setAttribute('src', src); el.setAttribute('class', 'ql-video'); el.setAttribute('allowfullscreen', 'true');
    el.setAttribute('loading', 'lazy'); el.setAttribute('title', 'Video'); el.setAttribute('frameborder', '0');
    return el;
  }
  el.appendChild(kids());
  return el;
}
function sanitizeHtml(html) {
  const doc = new DOMParser().parseFromString('<body>' + String(html || '') + '</body>', 'text/html');
  const out = doc.createElement('div');
  doc.body.childNodes.forEach(c => { const r = sanNode(c, doc); if (r) out.appendChild(r); });
  return out.innerHTML;
}

const POST_CSS = `
.post-content{ max-width:72ch; }
.post-content p{ max-width:72ch; font-size:16.5px; color:var(--text); line-height:1.8; }
.post-content h2{ font-size:26px; margin:38px 0 14px; }
.post-content h3{ font-size:21px; margin:30px 0 12px; }
.post-content h4{ font-size:18px; margin:26px 0 10px; }
.post-content strong{ color:#fff; font-weight:700; }
.post-content a{ color:var(--green-400); text-decoration:underline; }
.post-content ul, .post-content ol{ max-width:72ch; margin:0 0 1.2em; padding-left:24px; }
.post-content ul{ list-style:disc; } .post-content ol{ list-style:decimal; }
.post-content li{ margin-bottom:8px; font-size:16.5px; color:var(--text); line-height:1.7; }
.post-content blockquote{ margin:24px 0; padding:6px 0 6px 18px; border-left:3px solid var(--orange); color:var(--text-muted); font-size:16.5px; }
.post-content img{ max-width:100%; height:auto; margin:24px 0; border:1px solid var(--line); }
.post-content hr{ border:0; border-top:1px solid var(--line); margin:32px 0; }
.post-content iframe.ql-video{ display:block; width:100%; aspect-ratio:16/9; height:auto; border:1px solid var(--line); margin:24px 0; }
.post-content li.ql-indent-1{ margin-left:1.6em; } .post-content li.ql-indent-2{ margin-left:3.2em; } .post-content li.ql-indent-3{ margin-left:4.8em; } .post-content li.ql-indent-4{ margin-left:6.4em; }
.post-content li.ql-indent-5{ margin-left:8em; } .post-content li.ql-indent-6{ margin-left:9.6em; } .post-content li.ql-indent-7{ margin-left:11.2em; } .post-content li.ql-indent-8{ margin-left:12.8em; }
.post-content p, .post-content li, .post-content blockquote, .post-content h2, .post-content h3, .post-content h4{ max-width:none; }
.post-content u{ text-underline-offset:3px; }
.post-content pre{ overflow-x:auto; background:var(--panel-solid); border:1px solid var(--line); padding:14px; font-size:14px; }
`;

async function fetchPosts() {
  const res = await fetch('data/posts.json');
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.posts || []);
  return list.map(p => ({
    ...p,
    time: TIME_RE.test(String(p.time || '').trim()) ? String(p.time).trim() : '',
    slug: p.slug || slugifyVN(p.title || ''),
    video: toEmbedUrl(p.video || ''),
    cover: (p.cover || '').replace(/^\/+/, ''),
    images: (p.images || []).map(src => String(src).replace(/^\/+/, '')),
    contentHtml: (typeof p.contentHtml === 'string' && p.contentHtml.trim())
      ? sanitizeHtml(p.contentHtml)
      : Array.isArray(p.content)
      ? p.content.map(x => `<p>${x}</p>`).join('')
      : renderMarkdown(p.content),
  })).sort((a, b) => postSortKey(b) - postSortKey(a));
}

async function loadBlog(containerId, limit) {
  const el = document.getElementById(containerId);
  if (!el) return;
  try {
    const posts = await fetchPosts();
    const slice = limit ? posts.slice(0, limit) : posts;
    el.innerHTML = slice.map(p => `
      <a class="post-card" href="bai-viet.html?slug=${p.slug}">
        ${postThumbHTML(p)}
        <div class="post-body">
          <span class="post-tag">${escHtml(p.tag)}</span>
          <h3>${escHtml(p.title)}</h3>
          <p>${escHtml(p.excerpt)}</p>
          <div class="post-meta"><span>${formatPostDate(p)}</span><span>${escHtml(p.author)}</span></div>
        </div>
      </a>
    `).join('');
  } catch (err) {
    el.innerHTML = `<p class="news-empty">Không tải được bài viết. Kiểm tra lại data/posts.json.</p>`;
    console.error(err);
  }
}

async function loadSinglePost() {
  const el = document.getElementById('post-detail');
  if (!el) return;
  const slug = new URLSearchParams(location.search).get('slug');
  const posts = await fetchPosts();
  const post = posts.find(p => p.slug === slug) || posts[0];
  if (!post) { el.innerHTML = '<p>Không tìm thấy bài viết.</p>'; return; }

  document.title = `${post.title} — Blog MSC Capital`;

  if (!document.getElementById('post-md-style')) {
    const st = document.createElement('style');
    st.id = 'post-md-style';
    st.textContent = POST_CSS;
    document.head.appendChild(st);
  }

  el.innerHTML = `
    <span class="post-tag">${escHtml(post.tag)}</span>
    <h1 style="margin-top:14px;">${escHtml(post.title)}</h1>
    <div class="post-meta" style="margin-bottom:28px;"><span>${formatPostDate(post)}</span><span>${escHtml(post.author)}</span></div>
    ${post.video ? `<div style="aspect-ratio:16/9; border:1px solid var(--line); margin-bottom:28px;">
        <iframe width="100%" height="100%" src="${post.video}" title="${escHtml(post.title)}" frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>` : (post.cover ? `<img src="${post.cover}" alt="${escHtml(post.title)}" style="margin-bottom:28px; border:1px solid var(--line);">` : '')}
    <div class="post-content">
      ${post.contentHtml}
      ${(post.images || []).map(src => `<img src="${src}" alt="" loading="lazy" style="margin:22px 0; border:1px solid var(--line);">`).join('')}
    </div>
  `;

  // related posts
  const relEl = document.getElementById('related-posts');
  if (relEl) {
    const others = posts.filter(p => p.slug !== post.slug).slice(0, 3);
    relEl.innerHTML = others.map(p => `
      <a class="post-card" href="bai-viet.html?slug=${p.slug}">
        ${postThumbHTML(p)}
        <div class="post-body">
          <span class="post-tag">${escHtml(p.tag)}</span>
          <h3>${escHtml(p.title)}</h3>
          <div class="post-meta"><span>${formatPostDate(p)}</span></div>
        </div>
      </a>
    `).join('');
  }
}
