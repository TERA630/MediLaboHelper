(function (global) {
  'use strict';

  function calculateWellsPe(input) {
    input = input || {};
    var utils = global.MedcalcDomain.cardioScoreUtils;
    var hasHeartRate = utils.isNumber(input.heartRate) && input.heartRate >= 0;
    var components = [
      utils.createComponent('DVT_SIGNS', 'DVTの臨床徴候', 3, input.dvtSigns),
      utils.createComponent('PE_MOST_LIKELY', 'PEが他の診断より考えやすい', 3, input.peMostLikely),
      utils.createComponent('HEART_RATE_OVER_100', '心拍数 >100/分', 1.5, hasHeartRate && input.heartRate > 100, true),
      utils.createComponent('IMMOBILIZATION_OR_SURGERY', '3日以上の不動または4週間以内の手術', 1.5, input.immobilizationOrSurgery),
      utils.createComponent('PREVIOUS_DVT_OR_PE', 'DVT/PEの既往', 1.5, input.previousDvtOrPe),
      utils.createComponent('HEMOPTYSIS', '喀血', 1, input.hemoptysis),
      utils.createComponent('ACTIVE_MALIGNANCY', '活動性悪性腫瘍', 1, input.activeMalignancy)
    ];
    var score = utils.totalActivePoints(components);
    var hasAnyInput = hasHeartRate || components.some(function (component) {
      return component.active && component.code !== 'HEART_RATE_OVER_100';
    });

    return {
      scoreName: 'Wells PE Score',
      score: score,
      components: components,
      interpretation: hasAnyInput ? {
        twoTier: score > 4 ? 'PE likely' : 'PE unlikely',
        threeTier: score < 2 ? 'Low' : (score <= 6 ? 'Intermediate' : 'High')
      } : null,
      missingItems: hasHeartRate ? [] : ['心拍数'],
      hasAnyInput: hasAnyInput,
      context: {
        heartRate: hasHeartRate ? input.heartRate : null
      }
    };
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.calculateWellsPe = calculateWellsPe;
})(window);
