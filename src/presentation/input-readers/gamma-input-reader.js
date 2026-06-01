(function (global) {
  'use strict';

  function syncGammaWeightPlaceholders(commonWeight) {
    var dom = global.MedcalcDom;

    ['g_weight_a', 'g_weight_b'].forEach(function (id) {
      var el = dom.$(id);
      if (el && el.value === '' && commonWeight !== null) {
        el.placeholder = String(commonWeight) + ' kg（共通フォームより）';
      } else if (el && el.value === '' && commonWeight === null) {
        el.placeholder = '共通フォームから自動';
      }
    });
  }

  function readGammaInput() {
    var dom = global.MedcalcDom;
    var commonWeight = dom.getNum('weight');

    syncGammaWeightPlaceholders(commonWeight);

    return {
      commonWeight: commonWeight,
      concA: dom.getNum('g_conc_a'),
      rateA: dom.getNum('g_rate_a'),
      weightA: dom.getNum('g_weight_a'),
      targetG: dom.getNum('g_target_gamma'),
      concB: dom.getNum('g_conc_b'),
      weightB: dom.getNum('g_weight_b'),
      selectedDrug: dom.getSelectValue('g_drug_select')
    };
  }

  global.MedcalcInputReaders = global.MedcalcInputReaders || {};
  global.MedcalcInputReaders.readGammaInput = readGammaInput;
})(window);
