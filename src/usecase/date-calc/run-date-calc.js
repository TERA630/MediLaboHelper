(function (global) {
  'use strict';

  function toDateCalcViewModel(domainResult) {
    return {
      messages: domainResult && domainResult.messages ? domainResult.messages.slice() : []
    };
  }

  function runDateCalcUsecase(inputPort) {
    var domainResult = global.MedcalcDomain.calculateDateCalc(inputPort);
    return toDateCalcViewModel(domainResult);
  }

  global.MedcalcUsecase = global.MedcalcUsecase || {};
  global.MedcalcUsecase.runDateCalc = runDateCalcUsecase;
})(window);
