// 구글 시트(Apps Script 웹앱) 연동 — 클라이언트에서 바로 시트에 행을 추가하는 최소 유틸리티.
// 실제 구글 인증 없이도 Apps Script를 "웹 앱"으로 배포하면 POST 요청을 받아 시트에 기록할 수 있다.
// 웹 앱은 보통 CORS 응답 헤더를 주지 않으므로 no-cors로 보내고 응답은 읽지 않는다(전송 성공 여부만 best-effort로 확인).

export const SHEETS_APPS_SCRIPT_CODE = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(data.sheet) || ss.insertSheet(data.sheet);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(Object.keys(data.row));
  }
  sheet.appendRow(Object.values(data.row));
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export async function pushRowToSheet(webhookUrl: string, sheet: string, row: Record<string, string | number>): Promise<boolean> {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ sheet, row }),
    });
    // no-cors 응답은 opaque라 성공 여부를 알 수 없지만, 예외 없이 끝나면 전송 자체는 시도된 것으로 간주한다.
    return true;
  } catch {
    return false;
  }
}
