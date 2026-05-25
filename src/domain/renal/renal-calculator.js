(function (global) {
  'use strict';

  function calculateRenalDomain(input) {
    var age = input.age;
    var weight = input.weight;
    var height = input.height;
    var scr = input.scr;
    var bun = input.bun;
    var cys = input.cys;
    var na = input.na;
    var k = input.k;
    var ua = input.ua;
    var ucr = input.ucr;
    var una = input.una;
    var uk = input.uk;
    var uua = input.uua;
    var uun = input.uun;
    var gender = input.gender;

    var messages = [];

    var bsa = (height && weight)
      ? 0.007184 * Math.pow(height, 0.725) * Math.pow(weight, 0.425)
      : null;

    if (age && scr && gender) {
      var sexFactor = (gender === 'female') ? 0.739 : 1;
      var egfrcr = 194 * Math.pow(scr, -1.094) * Math.pow(age, -0.287) * sexFactor;

      var gStage =
        egfrcr >= 90 ? 'G1: 正常または高値' :
        egfrcr >= 60 ? 'G2: 軽度低下' :
        egfrcr >= 45 ? 'G3a: 軽度〜中等度低下' :
        egfrcr >= 30 ? 'G3b: 中等度〜高度低下' :
        egfrcr >= 15 ? 'G4: 高度低下' :
        'G5: 末期腎不全';

      messages.push('標準化eGFRcr: ' + egfrcr.toFixed(1) + ' mL/min/1.73m² ⇒ ' + gStage);

      if (bsa) {
        var egfrInd = egfrcr * (bsa / 1.73);
        messages.push('個別化eGFRcr: ' + egfrInd.toFixed(1) + ' mL/min');
      }

      if (weight) {
        var eccr = ((140 - age) * weight * ((gender === 'female') ? 0.85 : 1)) / (72 * scr);
        messages.push('eCCr: ' + eccr.toFixed(1) + ' mL/min');

        if (bsa) {
          var eccrBsa = eccr * (1.73 / bsa);
          messages.push('体表面積補正eCCr: ' + eccrBsa.toFixed(1) + ' mL/min/1.73m²');
        }
      }
    }

    if (age && cys && gender) {
      var sexFactor2 = (gender === 'female') ? 0.82 : 1;
      var egfrcys = 104 * Math.pow(cys / sexFactor2, -1.019) * Math.pow(age, -0.996);
      messages.push('eGFRcys: ' + egfrcys.toFixed(1) + ' mL/min/1.73m²');

      if (bsa) {
        var egfrInd2 = egfrcys * (bsa / 1.73);
        messages.push('個別化eGFRcys: ' + egfrInd2.toFixed(1) + ' mL/min');
      }
    }

    if (bun && scr && ucr && uun) {
      var feun = (uun * scr) / (bun * ucr) * 100;
      messages.push('FEUN: ' + feun.toFixed(2) + ' %');
      if (scr > 1.2) {
        var noteFeun =
          feun > 50 ? '尿素再吸収破綻、腎性：急性尿細管壊死' :
          feun < 35 ? '抗利尿状態、腎前性を示唆' :
          '';
        if (noteFeun) messages.push('⇒ ' + noteFeun);
      }
    }

    if (na && scr && ucr && una) {
      var fena = (una * scr) / (na * ucr) * 100;
      messages.push('FENa: ' + fena.toFixed(2) + ' %');
      if (scr > 1.2) {
        var noteFena =
          fena > 2 ? '腎性：急性尿細管壊死' :
          fena < 1 ? '腎前性を示唆' :
          '';
        if (noteFena) messages.push('⇒ ' + noteFena);
      }
    }

    if (k && scr && ucr && uk) {
      var fek = (uk * scr) / (k * ucr) * 100;
      messages.push('FEK: ' + fek.toFixed(2) + ' %');
    }

    if (ua && scr && ucr && uua) {
      var feua = (uua * scr) / (ua * ucr) * 100;
      var noteFeua =
        feua < 10 ? '尿酸排泄低下。あるいは腎前性' :
        feua <= 15 ? '境界領域' :
        '尿酸産生過剰型';
      messages.push('FEUa: ' + feua.toFixed(2) + ' % ⇒ ' + noteFeua);
    }

    if (una && uk) {
      var ratio = una / uk;
      var status = ratio < 2 ? '理想的' : ratio < 4 ? '目標内' : '目標未達成';
      messages.push('尿中Na/K比: ' + ratio.toFixed(2) + '（' + status + '）');
    }

    if (una && ucr) {
      var naExcretion = 21.98 * Math.pow(una / ucr, 0.392);
      var saltG = naExcretion * 58.5 / 1000;
      messages.push('推定食塩摂取量: ' + saltG.toFixed(1) + ' g/day（田中法）');
    }

    if (uk && ucr) {
      var kExcretion = 10.15 * Math.pow(uk / ucr, 0.517);
      messages.push('推定K摂取量: ' + kExcretion.toFixed(1) + ' mEq/day（田中法）');
    }

    return { messages: messages };
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.calculateRenal = calculateRenalDomain;
})(window);
