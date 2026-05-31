(function (global) {
  'use strict';

  function calculateGlucoseDomain(input) {
    var cp = input.cp;
    var glu = input.glu;
    var ins = input.ins;

    var messages = [];

    if (cp && glu) {
      var cpi = (cp * 100) / glu;
      var note =
        cpi >= 1.8 ? 'インスリン分泌能は十分に保たれています。' :
        cpi >= 1.0 ? '中等度に保たれていますが、将来的な低下に注意が必要です。' :
        cpi >= 0.8 ? 'やや低下しています。治療方針の見直しを検討してください。' :
        '著しく低下しています。インスリン適応判断が必要です。';
      messages.push("CPI（Cペプチドインデックス）: " + cpi.toFixed(2) + " ⇒ " + note);
    }

    if (ins && glu) {
      var homa = (ins * glu) / 405;
      var note2 =
        homa < 1.6 ? 'インスリン抵抗性は認められません。' :
        homa < 2.5 ? '軽度のインスリン抵抗性が疑われます｡' :
        'インスリン抵抗性が明らかです。';
      messages.push("HOMA-IR（インスリン抵抗性）: " + homa.toFixed(2) + " ⇒ " + note2);
    }

    return { messages: messages };
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.calculateGlucose = calculateGlucoseDomain;
})(window);
