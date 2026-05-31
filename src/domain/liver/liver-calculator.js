(function (global) {
  'use strict';

  function calculateLiverDomain(input) {
    var weight = input.weight;
    var height = input.height;
    var ast = input.ast;
    var alt = input.alt;
    var plt = input.plt;
    var tg = input.tg;
    var ggt = input.ggt;
    var gender = input.gender;
    var age = input.age;

    var messages = [];

    var bmi = (weight && height) ? weight / Math.pow(height / 100, 2) : null;
    if (bmi) messages.push("BMI: " + bmi.toFixed(2));

    if (ast && alt) {
      var ratio = ast / alt;
      if (ast > 38 || alt > 43) messages.push("AST/ALT比: " + ratio.toFixed(2));
    }

    if (age && ast && plt && alt) {
      var fib4 = (age * ast) / ((plt * 10) * Math.sqrt(alt)); // plt(×10^4/μL) 想定
      var note =
        fib4 < 1.3 ? '線維化リスク低' :
        fib4 < 2.67 ? '中等度の線維化リスク' :
        '高度線維化リスク';
      messages.push("Fib-4 index: " + fib4.toFixed(2) + " ⇒ " + note);
    }

    if (age && bmi && ast && alt && plt && gender) {
      var sexFactor = (gender === 'male') ? 1 : 0;
      var ratio2 = ast / alt;
      var masld = 0.053 * age + 0.074 * bmi + 1.23 * ratio2 - 0.63 * plt - 1.32 * sexFactor;
      var note2 =
        masld < -1.455 ? '線維化低リスク､経過監察' :
        masld <= 0.676 ? '線維化否定できず｡追加の非侵襲検査適応' :
        '高度線維化の可能性が高く、肝生検の適応検討';
      messages.push("MASLD Fibrosis Score: " + masld.toFixed(2) + " ⇒ " + note2);
    }

    if (bmi && tg && ggt && gender && tg > 0 && ggt > 0) {
      var sexFactor2 = (gender === 'male') ? 1 : 0;
      var logit = 0.953 * Math.log(tg) + 0.139 * bmi + 0.718 * Math.log(ggt) + 0.053 * sexFactor2 - 15.745;
      var fli = 100 / (1 + Math.exp(-logit));
      messages.push("Fatty Liver Index: " + fli.toFixed(1) + "（0〜100）");
    }

    return { messages: messages };
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.calculateLiver = calculateLiverDomain;
})(window);
