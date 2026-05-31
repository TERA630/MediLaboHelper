(function (global) {
  'use strict';

  function readLiverInput() {
    var dom = global.MedcalcDom;
    var patient = global.MedcalcInputReaders.readPatientContext();

    return {
      weight: patient.weight,
      height: patient.height,
      ast: dom.getNum('ast'),
      alt: dom.getNum('alt'),
      plt: dom.getNum('plt'),
      tg: dom.getNum('tg'),
      ggt: dom.getNum('ggt'),
      gender: patient.gender,
      age: patient.age
    };
  }

  global.MedcalcInputReaders = global.MedcalcInputReaders || {};
  global.MedcalcInputReaders.readLiverInput = readLiverInput;
})(window);
