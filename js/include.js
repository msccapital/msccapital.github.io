/* Loads the shared header/footer into every page and wires up small nav behaviours.
   Requires the page to be served over http(s) — e.g. GitHub Pages, or locally via
   `python3 -m http.server` — fetch() of local files does not work from file:// */

async function includePartial(selector, url) {
  const host = document.querySelector(selector);
  if (!host) return;
  try {
    const res = await fetch(url);
    host.innerHTML = await res.text();
  } catch (err) {
    console.error('Không tải được thành phần dùng chung:', url, err);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await includePartial('#site-header', 'components/header.html');
  initTicker();
  initLanguage();
  await includePartial('#site-footer', 'components/footer.html');

  // highlight current nav link
  const page = document.body.dataset.page;
  if (page) {
    const link = document.querySelector(`[data-nav="${page}"]`);
    if (link) link.classList.add('active');
  }

  // mobile menu toggle
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });
    links.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => links.classList.remove('open'))
    );
  }

  // footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  document.dispatchEvent(new CustomEvent('partials:ready'));
});


/* Bảng giá chạy ngang: widget Ticker Tape miễn phí của TradingView.
   Script phải được tạo bằng JS (không chạy được nếu chèn qua innerHTML).
   Muốn đổi/thêm mã: sửa mảng symbols bên dưới theo dạng "SÀN:MÃ" (vd HOSE:VNM). */
function initTicker() {
  const host = document.getElementById('tv-ticker');
  if (!host) return;
  host.innerHTML = '<div class="tradingview-widget-container"><div class="tradingview-widget-container__widget"></div></div>';
  const s = document.createElement('script');
  s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
  s.async = true;
  s.text = JSON.stringify({
    symbols: [
      { proName: 'HOSE:VNINDEX', title: 'VN-Index' },
      { proName: 'HOSE:VN30', title: 'VN30' },
      { proName: 'HNX:HNXINDEX', title: 'HNX-Index' },
      { proName: 'HOSE:VCB', title: 'VCB' },
      { proName: 'HOSE:FPT', title: 'FPT' },
      { proName: 'HOSE:HPG', title: 'HPG' },
      { proName: 'HOSE:VNM', title: 'VNM' },
      { proName: 'HOSE:SSI', title: 'SSI' }
    ],
    showSymbolLogo: false,
    colorTheme: 'dark',
    isTransparent: true,
    displayMode: 'adaptive',
    locale: 'vi_VN'
  });
  host.querySelector('.tradingview-widget-container').appendChild(s);
}


/* ===== Chọn ngôn ngữ (dịch tự động bằng Google Dịch) =====
   Trang gốc là tiếng Việt. Chọn "EN" sẽ đặt cookie googtrans rồi tải lại trang;
   script của Google chỉ được tải khi khách chọn ngôn ngữ khác tiếng Việt.
   Danh sách ngôn ngữ nằm ở mảng LANGUAGES bên dưới. */
function getLangCookie() {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!m) return 'vi';
  const parts = decodeURIComponent(m[1]).split('/');   // "/vi/en" -> ["", "vi", "en"]
  return parts[2] || 'vi';
}

function setLangCookie(lang) {
  const host = location.hostname;
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
  if (lang === 'vi') {
    document.cookie = 'googtrans=; ' + expired;
    document.cookie = 'googtrans=; ' + expired + '; domain=' + host;
  } else {
    document.cookie = 'googtrans=/vi/' + lang + '; path=/';
    document.cookie = 'googtrans=/vi/' + lang + '; path=/; domain=' + host;
  }
}

function loadGoogleTranslate() {
  const box = document.createElement('div');
  box.id = 'google_translate_element';
  box.style.cssText = 'position:absolute; left:-9999px; top:0; width:1px; height:1px; overflow:hidden;';
  document.body.appendChild(box);
  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement({ pageLanguage: 'vi', autoDisplay: false }, 'google_translate_element');
  };
  const s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.async = true;
  document.head.appendChild(s);
}

/* Danh sách ngôn ngữ (mã theo Google Dịch). Tiếng Việt và English ở đầu, sau đó là các ngôn ngữ phổ biến, rồi đến phần còn lại. */
const LANGUAGES = [
  ['vi','Tiếng Việt'],['en','English'],['zh-CN','中文 (简体)'],['zh-TW','中文 (繁體)'],['ja','日本語'],['ko','한국어'],['th','ไทย'],
  ['id','Bahasa Indonesia'],['ms','Bahasa Melayu'],['tl','Filipino'],['km','ខ្មែរ'],['lo','ລາວ'],['my','မြန်မာ'],
  ['fr','Français'],['de','Deutsch'],['es','Español'],['pt','Português'],['it','Italiano'],['ru','Русский'],['ar','العربية'],
  ['hi','हिन्दी'],['tr','Türkçe'],['nl','Nederlands'],['pl','Polski'],['uk','Українська'],
  ['af','Afrikaans'],['sq','Shqip'],['am','አማርኛ'],['hy','Հայերեն'],['az','Azərbaycan'],['eu','Euskara'],['be','Беларуская'],
  ['bn','বাংলা'],['bs','Bosanski'],['bg','Български'],['ca','Català'],['ceb','Cebuano'],['ny','Chichewa'],['co','Corsu'],
  ['hr','Hrvatski'],['cs','Čeština'],['da','Dansk'],['eo','Esperanto'],['et','Eesti'],['fi','Suomi'],['fy','Frysk'],
  ['gl','Galego'],['ka','ქართული'],['el','Ελληνικά'],['gu','ગુજરાતી'],['ht','Kreyòl ayisyen'],['ha','Hausa'],['haw','ʻŌlelo Hawaiʻi'],
  ['iw','עברית'],['hmn','Hmong'],['hu','Magyar'],['is','Íslenska'],['ig','Igbo'],['ga','Gaeilge'],['jw','Basa Jawa'],
  ['kn','ಕನ್ನಡ'],['kk','Қазақша'],['ku','Kurdî'],['ky','Кыргызча'],['la','Latina'],['lv','Latviešu'],['lt','Lietuvių'],
  ['lb','Lëtzebuergesch'],['mk','Македонски'],['mg','Malagasy'],['ml','മലയാളം'],['mt','Malti'],['mi','Māori'],['mr','मराठी'],
  ['mn','Монгол'],['ne','नेपाली'],['no','Norsk'],['ps','پښتو'],['fa','فارسی'],['pa','ਪੰਜਾਬੀ'],['ro','Română'],['sm','Gagana Samoa'],
  ['gd','Gàidhlig'],['sr','Српски'],['st','Sesotho'],['sn','Shona'],['sd','سنڌي'],['si','සිංහල'],['sk','Slovenčina'],
  ['sl','Slovenščina'],['so','Soomaali'],['su','Basa Sunda'],['sw','Kiswahili'],['sv','Svenska'],['tg','Тоҷикӣ'],['ta','தமிழ்'],
  ['te','తెలుగు'],['ur','اردو'],['uz','Oʻzbek'],['cy','Cymraeg'],['xh','isiXhosa'],['yi','ייִדיש'],['yo','Yorùbá'],['zu','isiZulu']
];

/* Tên tiếng Anh (và tiếng Việt với các ngôn ngữ phổ biến) dùng cho ô tìm kiếm, để gõ "japanese" hoặc "nhật" đều tìm ra. */
const LANG_SEARCH = {
  vi:'Vietnamese tiếng việt', en:'English tiếng anh', 'zh-CN':'Chinese Simplified tiếng trung giản thể', 'zh-TW':'Chinese Traditional tiếng trung phồn thể đài loan',
  ja:'Japanese tiếng nhật', ko:'Korean tiếng hàn', th:'Thai tiếng thái', id:'Indonesian tiếng indonesia', ms:'Malay tiếng mã lai malaysia', tl:'Filipino tagalog tiếng philippines',
  km:'Khmer tiếng campuchia', lo:'Lao tiếng lào', my:'Burmese myanmar tiếng miến điện', fr:'French tiếng pháp', de:'German tiếng đức', es:'Spanish tiếng tây ban nha',
  pt:'Portuguese tiếng bồ đào nha', it:'Italian tiếng ý', ru:'Russian tiếng nga', ar:'Arabic tiếng ả rập', hi:'Hindi tiếng ấn độ', tr:'Turkish tiếng thổ nhĩ kỳ',
  nl:'Dutch tiếng hà lan', pl:'Polish tiếng ba lan', uk:'Ukrainian tiếng ukraina', af:'Afrikaans', sq:'Albanian', am:'Amharic', hy:'Armenian', az:'Azerbaijani', eu:'Basque',
  be:'Belarusian', bn:'Bengali', bs:'Bosnian', bg:'Bulgarian', ca:'Catalan', ceb:'Cebuano', ny:'Chichewa', co:'Corsican', hr:'Croatian', cs:'Czech', da:'Danish',
  eo:'Esperanto', et:'Estonian', fi:'Finnish', fy:'Frisian', gl:'Galician', ka:'Georgian', el:'Greek', gu:'Gujarati', ht:'Haitian Creole', ha:'Hausa', haw:'Hawaiian',
  iw:'Hebrew', hmn:'Hmong', hu:'Hungarian', is:'Icelandic', ig:'Igbo', ga:'Irish', jw:'Javanese', kn:'Kannada', kk:'Kazakh', ku:'Kurdish', ky:'Kyrgyz', la:'Latin',
  lv:'Latvian', lt:'Lithuanian', lb:'Luxembourgish', mk:'Macedonian', mg:'Malagasy', ml:'Malayalam', mt:'Maltese', mi:'Maori', mr:'Marathi', mn:'Mongolian', ne:'Nepali',
  no:'Norwegian', ps:'Pashto', fa:'Persian Farsi', pa:'Punjabi', ro:'Romanian', sm:'Samoan', gd:'Scots Gaelic', sr:'Serbian', st:'Sesotho', sn:'Shona', sd:'Sindhi',
  si:'Sinhala', sk:'Slovak', sl:'Slovenian', so:'Somali', su:'Sundanese', sw:'Swahili', sv:'Swedish', tg:'Tajik', ta:'Tamil', te:'Telugu', ur:'Urdu', uz:'Uzbek',
  cy:'Welsh', xh:'Xhosa', yi:'Yiddish', yo:'Yoruba', zu:'Zulu'
};

function initLanguage() {
  const btn = document.getElementById('langBtn');
  const menu = document.getElementById('langMenu');
  if (!btn || !menu) return;
  const current = getLangCookie();

  menu.innerHTML =
    '<input type="search" class="lang-search" placeholder="Tìm ngôn ngữ…" aria-label="Tìm ngôn ngữ" autocomplete="off">' +
    '<div class="lang-list">' +
    LANGUAGES.map(([code, name]) => `<button type="button" data-lang="${code}" data-search="${(name + ' ' + (LANG_SEARCH[code] || '')).replace(/"/g, '')}"${code === current ? ' class="on"' : ''}>${name}</button>`).join('') +
    '</div>';

  const setOpen = (open) => { menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
  const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  btn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(menu.hidden); if (!menu.hidden) menu.querySelector('.lang-search').focus(); });
  menu.addEventListener('click', (e) => {
    e.stopPropagation();
    const b = e.target.closest('[data-lang]');
    if (!b) return;
    setLangCookie(b.dataset.lang);
    location.reload();
  });
  menu.querySelector('.lang-search').addEventListener('input', (e) => {
    const q = norm(e.target.value.trim());
    menu.querySelectorAll('[data-lang]').forEach(b => { b.style.display = !q || norm(b.dataset.search).includes(q) || b.dataset.lang.toLowerCase() === q ? '' : 'none'; });
  });
  document.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });

  if (current !== 'vi') loadGoogleTranslate();
}
