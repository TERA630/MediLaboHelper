(function (global) {
  'use strict';

  function readLipidInput() {
    var dom = global.MedcalcDom;
    var patient = global.MedcalcInputReaders.readPatientContext();

    return {
      age: patient.age,
      gender: patient.gender,
      ldl: dom.getNum('ldl'),
      hdl: dom.getNum('hdl'),
      tc: dom.getNum('tc'),
      tg: dom.getNum('tgLipid'),
      cadType: dom.getSelectValue('cadType'),
      multiVessel: dom.isChecked('multiVessel'),
      atheroStroke: dom.isChecked('atheroStroke'),
      pad: dom.isChecked('pad'),
      dmStatus: dom.getSelectValue('dmStatus'),
      ckdGrade: dom.getSelectValue('ckdGrade'),
      proteinuria: dom.getSelectValue('proteinuria'),
      htGrade: dom.getSelectValue('htGrade'),
      smoking: dom.isChecked('smoking'),
      familyHistory: dom.isChecked('familyHistory'),
      fh: dom.isChecked('fh')
    };
  }

  global.MedcalcInputReaders = global.MedcalcInputReaders || {};
  global.MedcalcInputReaders.readLipidInput = readLipidInput;
})(window);
