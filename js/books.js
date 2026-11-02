/* Tủ sách MSC — danh sách review sách và trang chi tiết từng cuốn.
   Dữ liệu: data/books.json (viết bằng trang quản trị /admin/ → mục "Tủ sách MSC").
   Dùng các hàm có sẵn trong js/blog.js (escHtml, renderMarkdown, slugifyVN, formatDateVN, parsePostDate, postMetaHTML, POST_CSS),
   nên trang phải nạp blog.js trước books.js.

   CHUYÊN MỤC: muốn thêm/đổi, sửa mảng BOOK_CATS dưới đây VÀ danh sách "options" của mục Chuyên mục trong admin/config.yml
   (mã "slug" phải giống nhau ở cả hai nơi). */

const BOOK_CATS = [
  { slug: 'hoc-dau-tu',        label: 'Sách học đầu tư' },
  { slug: 'dau-tu',            label: 'Sách đầu tư' },
  { slug: 'ban-hang',          label: 'Sách bán hàng' },
  { slug: 'tai-chinh-ke-toan', label: 'Sách về tài chính kế toán' },
];

const BOOKS_CSS = `
.bk-chips{ grid-column:1/-1; display:flex; flex-wrap:wrap; gap:8px; margin-bottom:6px; }
.bk-chips a{ border:1px solid var(--line-strong); padding:8px 16px; font-size:14px; font-family:var(--font-display); font-weight:500; color:var(--text-muted); }
.bk-chips a:hover{ border-color:var(--green-400); color:var(--text); }
.bk-chips a.on{ background:var(--orange); border-color:var(--orange); color:#fff8f3; }
.bk-chips a span{ opacity:.7; margin-left:6px; font-family:var(--font-mono); font-size:12px; }
.bk-card{ border:1px solid var(--line); display:flex; flex-direction:column; background:var(--black); transition:border-color .15s ease; min-width:0; }
.bk-card:hover{ border-color:var(--green-400); }
.bk-thumb{ aspect-ratio:16/9; background:var(--panel-solid); overflow:hidden; display:flex; align-items:center; justify-content:center; border-bottom:1px solid var(--line); }
.bk-thumb img{ width:100%; height:100%; object-fit:cover; display:block; }
.bk-ph{ font-family:var(--font-display); font-weight:800; font-size:20px; line-height:1.25; color:var(--green-200); text-align:center; padding:0 18px; }
.bk-body{ padding:24px 26px 28px; display:flex; flex-direction:column; gap:10px; flex:1; }
.bk-top{ display:flex; justify-content:space-between; align-items:baseline; gap:12px; font-size:14px; color:var(--orange-400); }
.bk-body h3{ font-size:22px; line-height:1.35; margin:2px 0 0; }
.bk-by{ font-size:14px; color:var(--text-faint); margin:0; max-width:none; }
.bk-ex{ font-size:16px; line-height:1.65; margin:2px 0 0; max-width:none; }
.bk-more{ margin-top:auto; padding-top:14px; color:var(--green-400); font-size:15px; }
.bk-stars{ font-size:15px; color:var(--orange-400); letter-spacing:1px; white-space:nowrap; }
.bk-stars .off{ color:var(--line-strong); }
.bk-stars .num{ font-family:var(--font-mono); font-size:12.5px; color:var(--text-muted); letter-spacing:0; margin-left:6px; }
.bk-detail{ display:block; max-width:860px; }
.bk-detail .bk-thumb{ border:1px solid var(--line); margin-bottom:28px; }
.bk-buy{ display:flex; flex-wrap:wrap; gap:10px; margin:22px 0; }
.bk-note{ font-size:12.5px; color:var(--text-faint); max-width:68ch; margin:0 0 26px; }
`;

/* ---------- dữ liệu ---------- */
const bkLink = (u) => (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '');
const bkCat = (slug) => BOOK_CATS.find(c => c.slug === slug);
const bkCatLabel = (slug) => (bkCat(slug) ? bkCat(slug).label : 'Sách');

async function fetchBooks() {
  const res = await fetch('data/books.json?t=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' khi đọc data/books.json');
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.books || []);
  return list.filter(b => b && b.title).map(b => ({
    ...b,
    slug: b.slug || slugifyVN(b.title),
    cover: String(b.cover || '').replace(/^\/+/, ''),
    rating: Number(b.rating) || 0,
    links: (b.links || []).map(l => ({ label: (l && l.label) || 'Mua sách', url: bkLink(l && l.url) })).filter(l => l.url),
  })).sort((a, b) => ((parsePostDate(b.date) || 0) - (parsePostDate(a.date) || 0)));
}

function bkInjectCss() {
  if (document.getElementById('bk-style')) return;
  const st = document.createElement('style');
  st.id = 'bk-style';
  st.textContent = BOOKS_CSS + (typeof POST_CSS !== 'undefined' ? POST_CSS : '');
  document.head.appendChild(st);
}

function bkStars(r) {
  const n = Math.max(0, Math.min(5, Number(r) || 0));
  if (!n) return '';
  const full = Math.round(n);
  return `<span class="bk-stars" title="${n}/5" aria-label="Đánh giá ${n} trên 5 sao">${'★'.repeat(full)}<span class="off">${'★'.repeat(5 - full)}</span><span class="num">${String(n).replace('.', ',')}/5</span></span>`;
}

function bkThumb(b) {
  return `<div class="bk-thumb">${b.cover
    ? `<img src="${escHtml(b.cover)}" alt="Bìa sách ${escHtml(b.title)}" loading="lazy" onerror="this.outerHTML='<div class=&quot;bk-ph&quot;>${escHtml(b.title).replace(/'/g, '&#39;')}</div>'">`
    : `<div class="bk-ph">${escHtml(b.title)}</div>`}</div>`;
}

function bkDate(b) {
  const w = (typeof postWhen === 'function') ? postWhen({ date: b.date }) : null;
  return w ? `${w.d}/${w.mo}/${w.y}` : '';
}

function bkCardHTML(b) {
  return `<a class="bk-card" href="sach.html?slug=${encodeURIComponent(b.slug)}">
    ${bkThumb(b)}
    <div class="bk-body">
      <div class="bk-top"><span>${escHtml(bkCatLabel(b.category))}</span><span>${escHtml(bkDate(b))}</span></div>
      <h3>${escHtml(b.title)}</h3>
      ${b.bookAuthor ? `<p class="bk-by">Tác giả: ${escHtml(b.bookAuthor)}</p>` : ''}
      ${bkStars(b.rating)}
      ${b.excerpt ? `<p class="bk-ex">${escHtml(b.excerpt)}</p>` : ''}
      <span class="bk-more">Đọc review →</span>
    </div>
  </a>`;
}

/* ---------- trang danh sách (tu-sach.html) ---------- */
function paintBookList(el) {
  const st = el._bk;
  const counts = {};
  st.items.forEach(b => { counts[b.category] = (counts[b.category] || 0) + 1; });
  const chip = (slug, label, n) => `<a href="tu-sach.html${slug === 'all' ? '' : '?muc=' + slug}" data-cat="${slug}"${st.cat === slug ? ' class="on"' : ''}>${escHtml(label)}<span>${n}</span></a>`;
  const chips = '<div class="bk-chips">' + chip('all', 'Tất cả', st.items.length) +
    BOOK_CATS.map(c => chip(c.slug, c.label, counts[c.slug] || 0)).join('') + '</div>';
  const list = st.cat === 'all' ? st.items : st.items.filter(b => b.category === st.cat);
  const body = list.length
    ? list.map(bkCardHTML).join('')
    : `<p class="news-empty" style="grid-column:1/-1;">${st.items.length ? 'Chưa có sách nào trong mục này.' : 'Tủ sách đang được cập nhật, mời bạn quay lại sau.'}</p>`;
  el.innerHTML = chips + body;
}

async function loadBookList(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  bkInjectCss();
  try {
    const items = await fetchBooks();
    const wanted = new URLSearchParams(location.search).get('muc');
    el._bk = { items, cat: bkCat(wanted) ? wanted : 'all' };
    paintBookList(el);
    el.addEventListener('click', (e) => {
      const a = e.target.closest('[data-cat]');
      if (!a) return;
      e.preventDefault();
      el._bk.cat = a.dataset.cat;
      history.replaceState(null, '', a.getAttribute('href'));
      paintBookList(el);
    });
  } catch (err) {
    console.error(err);
    el.innerHTML = '<p class="news-empty" style="grid-column:1/-1;">Không tải được danh sách sách. Vui lòng thử lại sau.</p>';
  }
}

/* ---------- trang chi tiết (sach.html?slug=...) ---------- */
async function loadBookDetail(containerId, relatedId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  bkInjectCss();
  try {
    const items = await fetchBooks();
    const slug = new URLSearchParams(location.search).get('slug');
    const b = items.find(x => x.slug === slug);
    if (!b) { el.innerHTML = '<p>Không tìm thấy cuốn sách này. <a href="tu-sach.html" style="text-decoration:underline;">Quay lại Tủ sách MSC</a></p>'; return; }
    document.title = `${b.title} — Review sách — MSC Capital`;

    const buy = b.links.length
      ? '<div class="bk-buy">' + b.links.map((l, i) =>
          `<a class="btn ${i === 0 ? 'btn-primary' : 'btn-outline'}" href="${escHtml(l.url)}" target="_blank" rel="sponsored nofollow noopener">Mua tại ${escHtml(l.label)} ↗</a>`).join('') + '</div>' +
        '<p class="bk-note">Một số liên kết mua sách có thể là liên kết tiếp thị (affiliate): MSC Capital có thể nhận một khoản hoa hồng nhỏ khi bạn mua qua đường dẫn này, không làm tăng giá bạn phải trả. Nhận xét trong bài là ý kiến cá nhân.</p>'
      : '';

    el.innerHTML = `
      <div class="bk-detail">
        ${bkThumb(b)}
        <div>
          <span class="post-tag">${escHtml(bkCatLabel(b.category))}</span>
          <h1 style="margin-top:14px;">${escHtml(b.title)}</h1>
          ${b.bookAuthor ? `<p class="bk-by" style="font-size:15px;">Tác giả: ${escHtml(b.bookAuthor)}</p>` : ''}
          <div style="margin:10px 0 4px;">${bkStars(b.rating)}</div>
          <div class="post-meta" style="margin-bottom:6px;">${postMetaHTML({ author: b.author, date: b.date })}</div>
          ${buy}
          <div class="post-content">${renderMarkdown(b.review || b.excerpt || '')}</div>
          ${b.links.length ? `<h2 style="font-size:22px; margin-top:36px;">Mua sách</h2>${buy}` : ''}
        </div>
      </div>`;

    const rel = document.getElementById(relatedId);
    if (rel) {
      const others = items.filter(x => x.slug !== b.slug && x.category === b.category).slice(0, 3);
      const more = others.length ? others : items.filter(x => x.slug !== b.slug).slice(0, 3);
      rel.innerHTML = more.map(bkCardHTML).join('');
      if (!more.length && rel.closest('section')) rel.closest('section').hidden = true;
    }
  } catch (err) {
    console.error(err);
    el.innerHTML = '<p class="news-empty">Không tải được nội dung. Vui lòng thử lại sau.</p>';
  }
}
