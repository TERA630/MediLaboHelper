(function (global) {
  'use strict';

  function readRenalInput() {
    var dom = global.MedcalcDom;
    var patient = global.MedcalcInputReaders.readPatientContext();

    return {
      age: patient.age,
      weight: patient.weight,
      height: patient.height,
      scr: dom.getNum('scr'),
      bun: dom.getNum('bun'),
      cys: dom.getNum('cys'),
      na: dom.getNum('na'),
      k: dom.getNum('k'),
      ua: dom.getNum('ua'),
      ucr: dom.getNum('ucr'),
      una: dom.getNum('una'),
      uk: dom.getNum('uk'),
      uua: dom.getNum('uua'),
      uun: dom.getNum('uun'),
      gender: patient.gender
    };
  }

  global.MedcalcInputReaders = global.MedcalcInputReaders || {};
  global.MedcalcInputReaders.readRenalInput = readRenalInput;
})(window);
