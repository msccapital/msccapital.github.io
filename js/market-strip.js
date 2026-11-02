/* Dải chỉ số thị trường dưới header (widget miễn phí của TradingView).
   CÁCH DÙNG: trong trang muốn hiện dải này (index.html, thi-truong.html), ngay dưới <div id="site-header"></div> thêm:
       <div id="market-strip"></div>
       <script src="js/market-strip.js"></script>
   ĐỔI CHỈ SỐ / HÀNG HÓA: sửa hai danh sách INDICES và COMMODITIES bên dưới.
   LƯU Ý: nếu một mã không được TradingView hỗ trợ, thẻ đó có thể hiện cổ phiếu Apple hoặc báo lỗi: xóa hoặc đổi mã đó.
   Dữ liệu từ TradingView, có thể chậm so với thị trường. */
(function () {
  var host = document.getElementById('market-strip');
  if (!host || host.getAttribute('data-ready')) return;
  host.setAttribute('data-ready', '1');

  var INDICES = [
    { symbol: 'HOSE:VNINDEX' },
    { symbol: 'HOSE:VN30' },
    { symbol: 'HNX:HNXINDEX' },
    { symbol: 'HNX:HNX30' },
    { symbol: 'HNX:UPCOMINDEX' }
  ];
  var COMMODITIES = [
    { proName: 'TVC:USOIL',  title: 'Dầu WTI' },
    { proName: 'TVC:UKOIL',  title: 'Dầu Brent' },
    { proName: 'TVC:GOLD',   title: 'Vàng' },
    { proName: 'TVC:SILVER', title: 'Bạc' },
    { proName: 'COMEX:HG1!', title: 'Đồng' },
    { proName: 'CBOT:ZR1!',  title: 'Gạo' }
  ];
  var CDN = 'https://s3.tradingview.com/external-embedding/';

  var css = document.createElement('style');
  css.textContent =
    '#market-strip{ background:var(--panel-solid,#0e1510); border-bottom:1px solid var(--line,#1d2a21); padding:12px 0 8px; }' +
    '#market-strip .ms-grid{ display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px; }' +
    '#market-strip .ms-card{ height:150px; border:1px solid var(--line,#1d2a21); background:var(--black,#090d0a); overflow:hidden; min-width:0; }' +
    '#market-strip .ms-com{ margin-top:10px; border:1px solid var(--line,#1d2a21); background:var(--black,#090d0a); height:78px; overflow:hidden; }' +
    '#market-strip .tradingview-widget-container, #market-strip .tradingview-widget-container__widget{ height:100%; width:100%; }' +
    '#market-strip .ms-note{ font-size:12px; color:var(--text-faint,#7d8a80); margin:6px 0 0; max-width:none; }' +
    '@media (max-width:1100px){ #market-strip .ms-grid{ grid-template-columns:repeat(3,minmax(0,1fr)); } }' +
    '@media (max-width:640px){ #market-strip .ms-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); } #market-strip .ms-com{ height:110px; } }';
  document.head.appendChild(css);

  function widget(parent, file, config) {
    var box = document.createElement('div');
    box.className = 'tradingview-widget-container';
    var inner = document.createElement('div');
    inner.className = 'tradingview-widget-container__widget';
    box.appendChild(inner);
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = CDN + file;
    s.text = JSON.stringify(config);      // TradingView đọc cấu hình từ nội dung thẻ script
    box.appendChild(s);
    parent.appendChild(box);
  }

  var wrap = document.createElement('div');
  wrap.className = 'wrap';

  var grid = document.createElement('div');
  grid.className = 'ms-grid';
  INDICES.forEach(function (ix) {
    var card = document.createElement('div');
    card.className = 'ms-card';
    widget(card, 'embed-widget-mini-symbol-overview.js', {
      symbol: ix.symbol, width: '100%', height: '100%', autosize: true, locale: 'vi_VN',
      dateRange: '1D', colorTheme: 'dark', isTransparent: true, largeChartUrl: '', noTimeScale: true
    });
    grid.appendChild(card);
  });
  wrap.appendChild(grid);

  var com = document.createElement('div');
  com.className = 'ms-com';
  widget(com, 'embed-widget-tickers.js', {
    symbols: COMMODITIES, colorTheme: 'dark', isTransparent: true, showSymbolLogo: false, locale: 'vi_VN'
  });
  wrap.appendChild(com);

  var note = document.createElement('p');
  note.className = 'ms-note';
  note.textContent = 'Dữ liệu do TradingView cung cấp, có thể chậm so với thị trường, không phải khuyến nghị đầu tư.';
  wrap.appendChild(note);

  host.appendChild(wrap);
})();
