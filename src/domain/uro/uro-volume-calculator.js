(function (global) {
  'use strict';

  var ORGAN_RULES = {
    prostate: {
      format: function (volume) {
        var note =
          volume >= 50 ? "高度肥大で重症です｡" :
          volume >= 20 ? "肥大ありで中等症です｡" :
          "正常";
        return "前立腺容積：" + volume.toFixed(1) + " ⇒ " + note;
      }
    },
    bladder: {
      format: function (volume) {
        var note =
          volume >= 700 ? "高度拡張" :
          volume >= 300 ? "拡張" :
          "正常";
        return "膀胱容量推定: " + volume.toFixed(1) + " mL ⇒ " + note;
      }
    },
    resualVol: {
      format: function (volume) {
        var note =
          volume >= 100 ? "過多：前立腺肥大があれば重症" :
          volume >= 50 ? "境界域：前立腺肥大あれば中等症" :
          "正常";
        return "残尿量推定: " + volume.toFixed(1) + " mL ⇒ " + note;
      }
    }
  };

  function calculateUroDomain(input) {
    var longAxis = input.longAxis;
    var shortAxis = input.shortAxis;
    var apAxis = input.apAxis;
    var organValue = input.organValue || 'prostate';
    var messages = [];

    if (longAxis && shortAxis && apAxis) {
      var volume = longAxis * shortAxis * apAxis * 0.52;
      var rule = ORGAN_RULES[organValue];

      if (rule) {
        messages.push(rule.format(volume));
      }
    }

    return { messages: messages };
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.calculateUro = calculateUroDomain;
})(window);
