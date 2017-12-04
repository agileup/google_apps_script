function createTriggers() {
  var days = [ScriptApp.WeekDay.MONDAY, ScriptApp.WeekDay.TUESDAY, ScriptApp.WeekDay.WEDNESDAY, ScriptApp.WeekDay.THURSDAY, ScriptApp.WeekDay.FRIDAY];
  for (var i=0; i<days.length; i++) {
    ScriptApp.newTrigger("notifyWebhook").timeBased().onWeekDay(days[i]).atHour(17).nearMinute(00).create();
  }
}

function reserveMeetingRoom(date) {
  var url = "http://api.fivehouse.co.kr/api/office/room_reservation";
}

function notifyWebhook() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  
  /* constant */
  const TIMEZONE = 'GMT+9';
  const DATE_COL = 0;
  const DAY_COL = 1;
  const BD_MEMBER_COL = 2;
  const CX_MEMBER_COL = 3;
  const NOTE_COL = 4;
  const MAX_ROW = 1000;

  /* set */
  const now = new Date();
  now.setHours(0, 0, 0);
  var TODAY_ROW = 1;
  
  /* check */
  for (var i = 2; i < MAX_ROW; i++) {
    var target = new Date(sheet.getRange(i, 1).getValue());
    if (target.getMonth() == now.getMonth() && target.getDate() === now.getDate()) {
      TODAY_ROW = i;
      break;
    }
  }

  const d0 = sheet.getSheetValues(TODAY_ROW, 1, 1, 4)[0];
  const d1 = sheet.getSheetValues(TODAY_ROW+1, 1, 1, 4)[0];
  
  if (!d1[BD_MEMBER_COL] && !d1[CX_MEMBER_COL]) {
    return;
  }
  
  var next_schedule = "";
  for (var j = 2; j < 6; j++) {
    var temp = sheet.getSheetValues(TODAY_ROW+j, 1, 1, 4)[0];
    Logger.log(temp);
    if (temp[BD_MEMBER_COL]) {
      next_schedule += Utilities.formatDate(temp[DATE_COL], TIMEZONE, 'yyyy/MM/dd') + "(" + temp[DAY_COL] + ") " + temp[BD_MEMBER_COL] + ", " + temp[CX_MEMBER_COL] + "\n";
    }
  }

  /* build */
  var body = Utilities.formatDate(d1[DATE_COL], TIMEZONE, 'yyyy/MM/dd') + "(" + d1[DAY_COL] + ") 모니터링: **" + d1[BD_MEMBER_COL] + "**, 고객응대: **" + d1[CX_MEMBER_COL] + "** [시트보기](https://docs.google.com/a/tosslab.com/spreadsheets/d/1U42QqA2zx2uMJe8WYa-Hu3W3B8UeerrKgWbZfnK5l4c/edit?usp=sharing)";
  
  var url = "https://wh.jandi.com/connect-api/webhook/279/69f0ea16df540e1af658c2661f6254ff"; // JANDefender
  var payload = {
    "body": body,
    "connectColor": "#2D476F",
    "connectInfo": [{
      "title": "다음 일정",
      "description": next_schedule
    }, {
      "title": "",
      "description": ""
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
    //var params = JSON.parse(result.getContentText());
  }
}
