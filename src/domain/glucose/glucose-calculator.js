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
        cpi >= 1.0 ? '中等度に保たれています。' :
        cpi >= 0.8 ? 'インスリン分泌能やや低下' :
        'インスリン分泌低下';
      messages.push("CPI（Cペプチドインデックス）: " + cpi.toFixed(2) + " ⇒ " + note);
    }

    if (typeof cp === 'number' && isFinite(cp) && cp >= 0 && cp < 0.6) {
      messages.push('Cペプチド: ' + cp + ' ng/mL ⇒ 高度の内因性インスリン欠乏');
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
