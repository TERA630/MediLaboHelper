(function (global) {
  'use strict';

  var AGE_RANGES = [
    { min: 0, max: 65, label: 'UNDER_65', points: 0 },
    { min: 65, max: 75, label: 'AGE_65_TO_74', points: 1 },
    { min: 75, max: null, label: 'AGE_75_OR_OLDER', points: 2 }
  ];

  function calculateCha2ds2Vasc(input) {
    input = input || {};
    var utils = global.MedcalcDomain.cardioScoreUtils;
    var ageRange = utils.classifyByRange(input.age, AGE_RANGES);
    var genderKnown = input.gender === 'male' || input.gender === 'female';
    var components = [
      utils.createComponent('CONGESTIVE_HEART_FAILURE', '心不全 / 左室収縮機能障害', 1, input.congestiveHeartFailure),
      utils.createComponent('HYPERTENSION', '高血圧', 1, input.hypertension),
      utils.createComponent('AGE_75_OR_OLDER', '年齢 ≥75歳', 2, ageRange && ageRange.label === 'AGE_75_OR_OLDER', true),
      utils.createComponent('DIABETES_MELLITUS', '糖尿病', 1, input.diabetesMellitus),
      utils.createComponent('STROKE_TIA_TE', '脳梗塞 / TIA / 全身性塞栓症の既往', 2, input.strokeTiaThromboembolism),
      utils.createComponent('VASCULAR_DISEASE', '血管疾患', 1, input.vascularDisease),
      utils.createComponent('AGE_65_TO_74', '年齢 65–74歳', 1, ageRange && ageRange.label === 'AGE_65_TO_74', true),
      utils.createComponent('FEMALE_SEX', '女性', 1, input.gender === 'female', true)
    ];
    var missingItems = [];
    if (!ageRange) missingItems.push('年齢');
    if (!genderKnown) missingItems.push('性別');

    return {
      scoreName: 'CHA₂DS₂-VASc',
      score: utils.totalActivePoints(components),
      components: components,
      interpretation: null,
      missingItems: missingItems,
      hasAnyInput: !!ageRange || genderKnown || components.some(function (component) {
        return component.active && !component.automatic;
      }),
      context: {
        age: ageRange ? input.age : null,
        gender: genderKnown ? input.gender : ''
      }
    };
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.calculateCha2ds2Vasc = calculateCha2ds2Vasc;
})(window);
