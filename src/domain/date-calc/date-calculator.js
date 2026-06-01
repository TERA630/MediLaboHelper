(function (global) {
  'use strict';

  function parseDateLocal(yyyy_mm_dd) {
    var parts = yyyy_mm_dd.split('-');
    var y = Number(parts[0]);
    var m = Number(parts[1]);
    var d = Number(parts[2]);
    return new Date(y, m - 1, d);
  }

  function fmtYMD(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1);
    if (m.length < 2) m = '0' + m;
    var d = String(date.getDate());
    if (d.length < 2) d = '0' + d;
    return y + '-' + m + '-' + d;
  }

  function weekdayJP(date) {
    return ['日','月','火','水','木','金','土'][date.getDay()];
  }

  function addDays(date, days) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function diffDays(a, b) {
    var msPerDay = 24 * 60 * 60 * 1000;
    var aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    var bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((bb - aa) / msPerDay);
  }

  function calculateDateCalcDomain(input) {
    var base = input.base;
    var dateA = input.dateA;
    var dateB = input.dateB;
    var daysOffset = input.daysOffset;
    var weeksOffset = input.weeksOffset;
    var messages = [];

    if (base) {
      var baseDate = parseDateLocal(base);
      var totalDays = daysOffset + weeksOffset * 7;
      var result = addDays(baseDate, totalDays);

      messages.push('基準日: ' + fmtYMD(baseDate) + '（' + weekdayJP(baseDate) + '）');
      messages.push('加算: 日 ' + daysOffset + ' / 週 ' + weeksOffset + '（合計 ' + totalDays + ' 日）');
      messages.push('結果日: <b>' + fmtYMD(result) + '（' + weekdayJP(result) + '）</b>');
    } else {
      messages.push('基準日を入力すると、加算結果を表示します。');
    }

    if (dateA && dateB) {
      var a = parseDateLocal(dateA);
      var b = parseDateLocal(dateB);
      var diff = diffDays(a, b);

      var sign = diff >= 0 ? '' : '－';
      messages.push('---');
      messages.push('日付A: ' + fmtYMD(a) + '（' + weekdayJP(a) + '）');
      messages.push('日付B: ' + fmtYMD(b) + '（' + weekdayJP(b) + '）');
      messages.push('差（A→B）: <b>' + sign + Math.abs(diff) + ' 日</b>');
    }

    return { messages: messages };
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.calculateDateCalc = calculateDateCalcDomain;
})(window);
