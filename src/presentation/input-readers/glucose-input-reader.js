(function (global) {
  'use strict';

  function readGlucoseInput() {
    var dom = global.MedcalcDom;

    return {
      cp: dom.getNum('cp'),
      glu: dom.getNum('glu'),
      ins: dom.getNum('ins')
    };
  }

  global.MedcalcInputReaders = global.MedcalcInputReaders || {};
  global.MedcalcInputReaders.readGlucoseInput = readGlucoseInput;
})(window);
