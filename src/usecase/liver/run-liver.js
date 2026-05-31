(function (global) {
  'use strict';

  function toLiverViewModel(domainResult) {
    return {
      messages: domainResult && domainResult.messages ? domainResult.messages.slice() : []
    };
  }

  function runLiverUsecase(inputPort) {
    var domainResult = global.MedcalcDomain.calculateLiver(inputPort);
    return toLiverViewModel(domainResult);
  }

  global.MedcalcUsecase = global.MedcalcUsecase || {};
  global.MedcalcUsecase.runLiver = runLiverUsecase;
})(window);
