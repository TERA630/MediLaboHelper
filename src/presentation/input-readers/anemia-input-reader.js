(function (global) {
  'use strict';

  function readAnemiaInput() {
    var dom = global.MedcalcDom;

    return {
      hb: dom.getNum('hb'),
      hct: dom.getNum('hct'),
      rbc: dom.getNum('rbc'),
      mcvInput: dom.getNum('mcv'),
      retic: dom.getNum('retic'),
      ferritin: dom.getNum('ferritin'),
      tibc: dom.getNum('tibc'),
      uibc: dom.getNum('uibc'),
      serumIron: dom.getNum('serumIron'),
      tsatInput: dom.getNum('tsat'),
      crp: dom.getNum('crpAnemia'),
      rdw: dom.getNum('rdw'),
      stfrIndex: dom.getNum('stfrIndex'),
      sex: dom.getSelectValue('anemiaSex'),
      epo: dom.getNum('epo'),
      gfrStage: dom.getSelectValue('gfrAnemia'),
      esaTherapy: dom.getSelectValue('esaTherapy')
    };
  }

  global.MedcalcInputReaders = global.MedcalcInputReaders || {};
  global.MedcalcInputReaders.readAnemiaInput = readAnemiaInput;
})(window);
