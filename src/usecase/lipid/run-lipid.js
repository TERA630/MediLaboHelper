(function (global) {
  'use strict';

  function toLipidViewModel(domainResult) {
    return {
      messages: domainResult && domainResult.messages ? domainResult.messages.slice() : []
    };
  }

  function runLipidUsecase(inputPort) {
    var domainResult = global.MedcalcDomain.calculateLipid(inputPort);
    return toLipidViewModel(domainResult);
  }

  global.MedcalcUsecase = global.MedcalcUsecase || {};
  global.MedcalcUsecase.runLipid = runLipidUsecase;
})(window);
