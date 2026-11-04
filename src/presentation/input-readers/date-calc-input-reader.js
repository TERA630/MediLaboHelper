(function (global) {
  'use strict';

  function readDateCalcInput() {
    var dom = global.MedcalcDom;
    var baseEl = dom.$('baseDate');
    var base2El = dom.$('baseDate2');
    var daysOffset = dom.getNum('daysOffset');
    var weeksOffset = dom.getNum('weeksOffset');

    return {
      base: baseEl ? baseEl.value : '',
      base2: base2El ? base2El.value : '',
      daysOffset: daysOffset === null ? 0 : daysOffset,
      weeksOffset: weeksOffset === null ? 0 : weeksOffset
    };
  }

  global.MedcalcInputReaders = global.MedcalcInputReaders || {};
  global.MedcalcInputReaders.readDateCalcInput = readDateCalcInput;
})(window);
