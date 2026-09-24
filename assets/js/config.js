/* ==========================================================================
   婚礼请帖 · 设定档
   --------------------------------------------------------------------------
   这个档案放「会变动的资料」：日期、地址、电话、RSVP 端点、照片清单。
   页面上的文案（故事、心里话那些段落）直接写在 index.html 里，
   档案里有 <!-- 文案 --> 注解标示，可直接改字。
   ========================================================================== */

window.CONFIG = {

  /* --- 婚礼日期时间（倒数计时用） -------------------------------------- */
  /* 格式：YYYY-MM-DDTHH:mm:ss+08:00（+08:00 是马来西亚时区，别删） */
  weddingDateTime: '2026-12-20T11:00:00+08:00',

  /* 婚宴结束时间，用来判断「今天就是大喜之日」要显示到几点 */
  weddingEndDateTime: '2026-12-20T15:00:00+08:00',

  /* --- 地点导航 --------------------------------------------------------- */
  venue: {
    name: 'The Flemington Hotel · 湖景阁',
    address: '1, Jalan Samanea Saman, 34000 Taiping, Perak',
    /* 点「开启地图」会去的连结 */
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=' +
            encodeURIComponent('The Flemington Hotel, 1 Jalan Samanea Saman, 34000 Taiping, Perak')
  },

  /* --- 联络（WhatsApp） -------------------------------------------------- */
  /* 国际格式，不加 + 不加空格。016-590 4076 → 60165904076
     whatsapp 号码给 RSVP 送不出去时的备用按钮用。
     defaultMessage 是页尾那颗「WhatsApp 联系」的开场白 —— 页尾已经拿掉，
     现在暂时没用到；哪天把按钮加回来，这句就会跟着用上。 */
  contact: {
    name: '伟彬',
    whatsapp: '60165904076',
    defaultMessage: '嗨伟彬 👋\n关于你和美雯 12月20日的婚礼，我想问一下：'
  },

  /* --- RSVP 后端 --------------------------------------------------------- */
  rsvp: {
    /* ↓↓↓ 部署 Google Apps Script 后，把拿到的 /exec 网址贴在这里 ↓↓↓
       步骤看 SETUP.md。在贴上之前，表单会自动改用 WhatsApp 送出。   */
    endpoint: 'https://script.google.com/macros/s/AKfycbz9MDLqWTknxxzRzBTBC52o3DvQEjwCQSxl04DJDfmZu-9_a3vJVVZPtOzlMxTX63j8/exec',

    deadlineLabel: '2026年11月5日',
    deadlineISO: '2026-11-05T23:59:59+08:00'
  },

  /* --- 照片清单 ---------------------------------------------------------- */
  /* id 对应 assets/img/<id>.jpg（大图）与 <id>-t.jpg（缩图）
     ratio: 'tall' = 2:3 直式，'wide' = 3:2 横式
     alt 是给看不到图的人听的描述，请照实写
     换照片的流程：把新图丢进 photos/，跑 scripts/optimize-photos.sh，
     再回来改这份清单跟下面的 layout。                                   */
  photos: [
    { id: 'eosr5085', ratio: 'tall', alt: '白色棚内，两人各拉着一段红线放在唇上扮胡子，美雯手上抱着一团红毛线' },
    { id: 'eosr5071', ratio: 'tall', alt: '白色棚内，地上用红线摆出 LOVE 字样，美雯坐在木椅上，伟彬弯身靠在旁边' },
    { id: 'eosr5139', ratio: 'tall', alt: '美雯戴头纱、伟彬抱着家里的贵宾犬，两人手里牵着红线' },
    { id: 'eosr5284', ratio: 'tall', alt: '两人穿中式礼服相视而笑，手中白扇上写着一个红色的囍字' },
    { id: 'eosr5242', ratio: 'tall', alt: '大红背景前，两人穿秀禾服与褂各坐一张木椅，中间小几上摆着一瓶橘红色花' },
    { id: 'eosr5317', ratio: 'tall', alt: '大红背景前，两人穿中式礼服并肩而立，手拿囍字扇，笑得很开' },
    { id: 'eosr5369', ratio: 'tall', alt: '囍字剪纸前，两人穿中式礼服，伟彬怀里抱着贵宾犬' },
    { id: 'eosr5419', ratio: 'tall', alt: '两人背对背拉开长串红色囍字剪纸，衣摆飞扬' }
  ],

  /* --- 页面上直接放出来的两张（其余的从灯箱左右翻可以看到） ------------ */
  layout: {
    hero:    'eosr5317',   /* 封面大图 */
    gallery: 'eosr5419'    /* Gallery 那一张 */
  }
};
