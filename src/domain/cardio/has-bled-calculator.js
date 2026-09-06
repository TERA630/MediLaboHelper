(function (global) {
  'use strict';

  function calculateHasBled(input) {
    input = input || {};
    var utils = global.MedcalcDomain.cardioScoreUtils;
    var hasAge = utils.isNumber(input.age) && input.age >= 0;
    var hasSystolicBloodPressure = utils.isNumber(input.systolicBloodPressure) && input.systolicBloodPressure >= 0;
    var components = [
      utils.createComponent('HYPERTENSION', '収縮期血圧 >160 mmHg', 1,
        hasSystolicBloodPressure && input.systolicBloodPressure > 160, true),
      utils.createComponent('ABNORMAL_RENAL_FUNCTION', '腎機能異常', 1, input.abnormalRenalFunction),
      utils.createComponent('ABNORMAL_LIVER_FUNCTION', '肝機能異常', 1, input.abnormalLiverFunction),
      utils.createComponent('STROKE', '脳卒中の既往', 1, input.stroke),
      utils.createComponent('BLEEDING_HISTORY', '出血歴 / 出血素因', 1, input.bleedingHistoryOrPredisposition),
      utils.createComponent('LABILE_INR', '不安定なINR', 1, input.labileInr),
      utils.createComponent('AGE_OVER_65', '年齢 >65歳', 1, hasAge && input.age > 65, true),
      utils.createComponent('DRUGS', '出血リスクを高める薬剤', 1, input.drugs),
      utils.createComponent('ALCOHOL', '過量飲酒', 1, input.alcohol)
    ];
    var score = utils.totalActivePoints(components);
    var missingItems = [];
    if (!hasAge) missingItems.push('年齢');
    if (!hasSystolicBloodPressure) missingItems.push('収縮期血圧');

    return {
      scoreName: 'HAS-BLED',
      score: score,
      components: components,
      interpretation: score >= 3
        ? '出血リスク因子の確認・是正と慎重なフォローを要します。'
        : null,
      missingItems: missingItems,
      hasAnyInput: hasAge || hasSystolicBloodPressure || components.some(function (component) {
        return component.active && !component.automatic;
      }),
      context: {
        age: hasAge ? input.age : null,
        systolicBloodPressure: hasSystolicBloodPressure ? input.systolicBloodPressure : null
      }
    };
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.calculateHasBled = calculateHasBled;
})(window);
