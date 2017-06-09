function getBackgroundColor(rangeSpecification) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  return sheet.getRange(rangeSpecification).getBackgroundColor();  
}

function countCellsWithBackgroundColor(color, rangeSpecification) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var range = sheet.getRange(rangeSpecification);
  
  var count = 0;
  for (var i = 1; i <= range.getNumRows(); i++) {
    for (var j = 1; j <= range.getNumColumns(); j++) {
      var cell = range.getCell(i, j);
      if (cell.getBackgroundColor() == color)
        count++;
    }
  }
  
  return count;
}

function createTriggers() {
  var days = [ScriptApp.WeekDay.MONDAY, ScriptApp.WeekDay.TUESDAY, ScriptApp.WeekDay.WEDNESDAY, ScriptApp.WeekDay.THURSDAY, ScriptApp.WeekDay.FRIDAY];
  for (var i=0; i<days.length; i++) {
    ScriptApp.newTrigger("notifyWebhook").timeBased().onWeekDay(days[i]).atHour(11).nearMinute(30).create();
  }
}

function notifyWebhook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  
  /* constant */
  const MENU = 3;
  const MAX_MEMBER = 15;
  const BASE_ROW = 7;
  
  /* variable */
  var BASE_COL = 0;
  
  var today = new Date();
  switch (today.getDay()) {
    case 1:
      BASE_COL = 1; break;
    case 2:
      BASE_COL = 4; break;
    case 3:
      BASE_COL = 7; break;
    case 4:
      BASE_COL = 10; break;
    case 5:
      BASE_COL = 13; break;
    case 6: break;
    case 7: break;
  }
  
  /* check */
  var pickup = sheet.getSheetValues(BASE_ROW, BASE_COL, 1, 1);
  var total = sheet.getSheetValues(BASE_ROW+2, BASE_COL, 1, 1);
  var order = "";
  for (var i = 0; i < MENU; i++) {
    order += sheet.getSheetValues(BASE_ROW+3, BASE_COL+i, 1, 1) + ": ";
    for (var j = 0; j < MAX_MEMBER; j++) {
      order += sheet.getRange(BASE_ROW+4+j, BASE_COL+i).getValue() + " ";
    }
    order += "\n";
  }
  
  /* build */
  var body = "오늘(" + today.getDate() + "일)의 픽업 담당자는 **" + pickup + "** 입니다. [시트보기](SHEET_URL)";
  var desc = "활성시트: " + sheet.getSheetName() + "";

  /* request */
  var url = "WEBHOOK_URL";
  var payload = {
    "body": body,
    "connectColor": "#E15D00",
    "connectInfo": [{
      "title": "주문 내역 (총 " + total + "개)",
      "description": order
    }]
  };
  var options = {
    "method": "POST",
    "contentType" : "application/json",
    "headers": {
      "Accept": "application/vnd.tosslab.jandi-v2+json"
    },
    "payload": JSON.stringify(payload),
    "followRedirects": true,
    "muteHttpExceptions": true
  };
  
  var result = UrlFetchApp.fetch(url, options);
  if (result.getResponseCode() == 200) {
    var params = JSON.parse(result.getContentText());
  }
}
