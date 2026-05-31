(function (global) {
  'use strict';

  function readPatientContext() {
    var dom = global.MedcalcDom;

    return {
      age: dom.getNum('age'),
      gender: dom.getSelectValue('gender'),
      height: dom.getNum('height'),
      weight: dom.getNum('weight')
    };
  }

  global.MedcalcInputReaders = global.MedcalcInputReaders || {};
  global.MedcalcInputReaders.readPatientContext = readPatientContext;
})(window);
