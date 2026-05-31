(function (global) {
  'use strict';

  function toGlucoseViewModel(domainResult) {
    return {
      messages: domainResult && domainResult.messages ? domainResult.messages.slice() : []
    };
  }

  function runGlucoseUsecase(inputPort) {
    var domainResult = global.MedcalcDomain.calculateGlucose(inputPort);
    return toGlucoseViewModel(domainResult);
  }

  global.MedcalcUsecase = global.MedcalcUsecase || {};
  global.MedcalcUsecase.runGlucose = runGlucoseUsecase;
})(window);
