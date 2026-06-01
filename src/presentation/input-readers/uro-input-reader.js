(function (global) {
  'use strict';

  function readUroInput() {
    var dom = global.MedcalcDom;

    return {
      longAxis: dom.getNum('bladder_long'),
      shortAxis: dom.getNum('bladder_short'),
      apAxis: dom.getNum('bladder_ap'),
      organValue: dom.getSelectValue('organSelect') || 'prostate'
    };
  }

  global.MedcalcInputReaders = global.MedcalcInputReaders || {};
  global.MedcalcInputReaders.readUroInput = readUroInput;
})(window);
