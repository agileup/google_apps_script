function createTriggers() {
  var days = [ScriptApp.WeekDay.MONDAY, ScriptApp.WeekDay.TUESDAY, ScriptApp.WeekDay.WEDNESDAY, ScriptApp.WeekDay.THURSDAY, ScriptApp.WeekDay.FRIDAY];
  for (var i=0; i<days.length; i++) {
    ScriptApp.newTrigger("backendDailyMeetingBooking").timeBased().onWeekDay(days[i]).atHour(01).nearMinute(00).create();
  }
}

function reserveMeetingRoom(date, start, end, room, user) {
  const url = "http://api.fivehouse.co.kr/api/office/room_reservation";
  const payload = {
    'office_id': 'ac8bb1f048534b7682f08562b16f5094',
    'user_id': user,
    'room_id': room,
    'reservation_date': date,
    'reservation_start_time': start,
    'reservation_end_time': end
  };
  const options = {
    "method": "POST",
    "contentType" : "application/x-www-form-urlencoded; charset=utf-8",
    "headers": {
      "User-Agent": "FastFive/2.3.1 (com.fastfive.FastFive; build:4; iOS 10.3.2) Alamofire/4.4.0"
    },
    "payload": payload,
    "followRedirects": true,
    "muteHttpExceptions": true
  };

  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response);
  if (response.getResponseCode() === 200) {
    return result;
  } else {
    return { code: 5000, message: 'Request failed' };
  }
}

function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function backendDailyMeetingBooking() {
  /* setup */
  const now = new Date();
  now.setHours(0, 0, 0);
  const TIMEZONE = 'GMT+9';
  const bd_members = [
    { id: '01087244624', name: 'Aiden' },
//    { id: '01051973117', name: 'Alex' },
    { id: '01032447883', name: 'Ali' },
//    { id: '01084091979', name: 'Hugo' },
    { id: '01054534125', name: 'John' },
//    { id: '01073505507', name: 'MK' },
    { id: '01046459874', name: 'Nate' },
  ];
  var rand = getRandomInteger(0, bd_members.length - 1);
  
  const booking_date = Utilities.formatDate(new Date(now.getTime() + 14 * (24 * 60 * 60 * 1000)), TIMEZONE, 'yyyy-MM-dd');
  const start_time = '10:30';
  const end_time = '11:00';
  const room_id = 'f718ab9eba23442c87105563505bb6c5'; // 모비딕
  const user = bd_members[rand];
  
  /* request book */
  const booking_result = reserveMeetingRoom(booking_date, start_time, end_time, room_id, user.id);
  Logger.log(booking_result);
  const booking_desc = (booking_result.code === 0) ? "성공(by " + user.name + ")" : "실패(" + booking_result.message + ")";
  
  var url = "https://wh.jandi.com/connect-api/webhook/279/29591536a01702e3f95363597d5a7faf" // [BE] Notification
  //var url = "https://wh.jandi.com/connect-api/webhook/279/d1070e1ebb313419eaa727dbbf162bf8" // MK TEST
  var payload = {
    "body": "모비딕 " + booking_date + " " + start_time + "~" + end_time + " 예약 " + booking_desc
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
};

function jandiMonitorAlarm() {
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
  var body = Utilities.formatDate(d1[DATE_COL], TIMEZONE, 'yyyy/MM/dd') + "(" + d1[DAY_COL] + ") 모니터링: **" + d1[BD_MEMBER_COL] + "**, 고객응대: **" + d1[CX_MEMBER_COL] + "** [일정 확인](https://docs.google.com/a/tosslab.com/spreadsheets/d/1U42QqA2zx2uMJe8WYa-Hu3W3B8UeerrKgWbZfnK5l4c/edit?usp=sharing)";
  
  var url = "https://wh.jandi.com/connect-api/webhook/279/69f0ea16df540e1af658c2661f6254ff"; // JANDefender
  //var url = "https://wh.jandi.com/connect-api/webhook/279/d1070e1ebb313419eaa727dbbf162bf8" // MK TEST
  var payload = {
    "body": body,
    "connectColor": "#2D476F",
    "connectInfo": [{
      "title": "다음 일정",
      "description": next_schedule
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
