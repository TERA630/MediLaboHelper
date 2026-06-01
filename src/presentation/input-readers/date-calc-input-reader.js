(function (global) {
  'use strict';

  function readDateCalcInput() {
    var dom = global.MedcalcDom;
    var baseEl = dom.$('baseDate');
    var dateAEl = dom.$('dateA');
    var dateBEl = dom.$('dateB');
    var daysOffset = dom.getNum('daysOffset');
    var weeksOffset = dom.getNum('weeksOffset');

    return {
      base: baseEl ? baseEl.value : '',
      dateA: dateAEl ? dateAEl.value : '',
      dateB: dateBEl ? dateBEl.value : '',
      daysOffset: daysOffset === null ? 0 : daysOffset,
      weeksOffset: weeksOffset === null ? 0 : weeksOffset
    };
  }

  global.MedcalcInputReaders = global.MedcalcInputReaders || {};
  global.MedcalcInputReaders.readDateCalcInput = readDateCalcInput;
})(window);
