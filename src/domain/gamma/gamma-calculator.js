(function (global) {
  'use strict';

  function calculateCurrentGamma(input) {
    var concA = input.concA;
    var rateA = input.rateA;
    var weightA = input.weightA === null ? input.commonWeight : input.weightA;
    var selectedDrug = input.selectedDrug;
    var msgsA = [];

    if (concA !== null && rateA !== null && weightA !== null && weightA > 0) {
      var gammaVal = (concA * rateA * 1000) / (60 * weightA);
      msgsA.push('<span class="result-highlight">' + gammaVal.toFixed(3) + ' γ</span>');
      msgsA.push('<span class="result-note">（μg/kg/min）</span>');
      msgsA.push('体重 ' + weightA.toFixed(1) + ' kg　|　濃度 ' + concA + ' mg/mL　|　速度 ' + rateA + ' mL/h');

      var info = global.MedcalcDomain.getGammaDrugInfo(selectedDrug);
      if (info) {
        var inRange = false;
        var rangeNote = '';
        info.ranges.forEach(function (r) {
          if (gammaVal >= r.min && gammaVal <= r.max) {
            inRange = true;
            rangeNote = r.label + '：' + r.note;
          }
        });
        if (inRange) {
          msgsA.push('<b class="ok">✔ ' + info.label + ' ' + rangeNote + '</b>');
        } else {
          var allMin = info.ranges[0].min;
          var allMax = info.ranges[info.ranges.length - 1].max;
          if (gammaVal < allMin) {
            msgsA.push('<b class="warn">▼ ' + info.label + ' 推奨範囲（' + allMin + '～' + allMax + ' γ）を下回っています</b>');
          } else {
            msgsA.push('<b class="warn">▲ ' + info.label + ' 推奨範囲（' + allMin + '～' + allMax + ' γ）を超えています</b>');
          }
        }
      }
    } else {
      msgsA.push('薬剤濃度・投与速度・体重を入力してください。');
    }

    return msgsA;
  }

  function calculateTargetRate(input) {
    var targetG = input.targetG;
    var concB = input.concB;
    var weightB = input.weightB === null ? input.commonWeight : input.weightB;
    var msgsB = [];

    if (targetG !== null && concB !== null && weightB !== null && weightB > 0 && concB > 0) {
      var rateResult = (targetG * weightB * 60) / (concB * 1000);
      msgsB.push('<span class="result-highlight">' + rateResult.toFixed(2) + ' mL/h</span>');
      msgsB.push('<span class="result-note">（投与速度）</span>');
      msgsB.push('目標 ' + targetG + ' γ　|　体重 ' + weightB.toFixed(1) + ' kg　|　濃度 ' + concB + ' mg/mL');
    } else {
      msgsB.push('目標γ・薬剤濃度・体重を入力してください。');
    }

    return msgsB;
  }

  function buildDrugMessages(selectedDrug) {
    var msgsDrug = [];
    var info = global.MedcalcDomain.getGammaDrugInfo(selectedDrug);

    if (info) {
      msgsDrug.push('<b>' + info.label + '</b>');
      if (info.conc_label) {
        msgsDrug.push('💊 当院採用濃度：<b>' + info.conc_label + '</b>　→ 濃度フィールドに自動入力しました');
      }
      info.ranges.forEach(function (r) {
        msgsDrug.push(
          r.label + '：<b>' + r.min + (r.min === r.max ? '' : '～' + r.max) + ' γ</b>　' + r.note
        );
      });
    } else {
      msgsDrug.push('薬剤を選択すると詳細が表示されます。');
    }

    return msgsDrug;
  }

  function calculateGammaDomain(input) {
    return {
      messagesA: calculateCurrentGamma(input),
      messagesB: calculateTargetRate(input),
      messagesDrug: buildDrugMessages(input.selectedDrug),
      selectedDrug: input.selectedDrug,
      drugs: global.MedcalcDomain.listGammaDrugs()
    };
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.calculateGamma = calculateGammaDomain;
})(window);
