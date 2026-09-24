/**
 * 婚礼 RSVP 后端 · Google Apps Script
 * ---------------------------------------------------------------------------
 * 作用：接收请帖网页送来的出席回覆，逐笔写进 Google Sheet。
 * 部署方式见 SETUP.md。
 */

// ↓↓↓ 换成你的 Google Sheet 网址中间那一长串 ID ↓↓↓
// 例：docs.google.com/spreadsheets/d/【这一段就是 ID】/edit
var SHEET_ID   = '1cdZSNvnpnCzIxJBafqx0xtAZ-R_Juz_bVaf_FUWjBrA';
var SHEET_NAME = 'RSVP';

var HEADERS = ['提交时间', '姓名', '出席', '人数', '忌口', '联络号码', '留言'];


function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // 机器人会填这个隐藏栏位，真人不会
    if (data.trap) {
      return json({ ok: true, skipped: true });
    }

    if (!data.name || !data.attending) {
      return json({ ok: false, error: '缺少姓名或出席状态' });
    }

    var sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      String(data.name).slice(0, 100),
      String(data.attending).slice(0, 20),
      String(data.guests  || '-').slice(0, 20),
      String(data.diet    || '-').slice(0, 50),
      String(data.phone   || '').slice(0, 40),
      String(data.message || '').slice(0, 1000)
    ]);

    return json({ ok: true });

  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}


/** 用浏览器直接打开 /exec 时会看到这句，方便确认部署成功 */
function doGet() {
  return json({ ok: true, service: 'wedding-rsvp' });
}


function getSheet_() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}


function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * 在 Apps Script 编辑器里直接执行这个函式，可以测试写入是否正常。
 * 跑完去 Sheet 看有没有多出一行「测试」。
 */
function testWrite() {
  getSheet_().appendRow([new Date(), '测试', '出席', '2', '无', '000-0000000', '这是一笔测试资料，可以删掉']);
}
