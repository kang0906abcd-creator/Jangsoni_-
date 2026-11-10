/**
 * 장손이 나가기 설문 수신용 Google Apps Script.
 * 설정 방법은 docs/exit-survey.md를 참고하세요.
 *
 * 이 스크립트를 '응답 시트'에 연결된 Apps Script 편집기에 붙여 넣고
 * 웹 앱(실행: 나, 액세스: 모든 사용자)으로 배포하면,
 * 사이트에서 보낸 응답이 '설문응답' 시트에 한 줄씩 쌓입니다.
 */
const SHEET_NAME = '설문응답';
const HEADERS = ['받은 시각', '제출 시각', '별점', '개선 제안', '화면', '계기', '기기', '화면 크기', '처리 상태'];
const SCREEN_NAMES = {
  intro: '시작 화면', menu: '메뉴', yakgwan: '약관', fss: '분쟁조정', koicd: 'KCD',
  pubmed: 'PubMed', cardnews: '카드뉴스', law: '법령', soon: '준비 중',
};
const TRIGGER_NAMES = {
  'exit-intent': '창 닫기 직전', back: '뒤로 가기', returned: '다른 앱에서 복귀', manual: '직접 열기',
};

function sheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#fdebdd');
    sheet.setColumnWidth(4, 420);
  }
  return sheet;
}

function clean_(value, max) {
  // 수식으로 해석되지 않도록 =,+,-,@로 시작하는 값 앞에 '를 붙인다.
  const text = String(value == null ? '' : value).slice(0, max);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const rating = Math.round(Number(data.rating));
    if (!(rating >= 1 && rating <= 5)) throw new Error('invalid rating');
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      sheet_().appendRow([
        new Date(),
        clean_(data.submittedAt, 40),
        '★'.repeat(rating) + '☆'.repeat(5 - rating) + ' (' + rating + ')',
        clean_(data.comment, 1000),
        SCREEN_NAMES[data.screen] || clean_(data.screen, 30),
        TRIGGER_NAMES[data.trigger] || clean_(data.trigger, 30),
        clean_(data.device, 20),
        clean_(data.viewport, 20),
        '미확인',
      ]);
    } finally {
      lock.releaseLock();
    }
    return ContentService.createTextOutput('ok');
  } catch (error) {
    return ContentService.createTextOutput('error');
  }
}

/** 편집기에서 한 번 실행하면 시트와 머리글을 만들고 권한을 승인받습니다. */
function setup() {
  sheet_();
}
