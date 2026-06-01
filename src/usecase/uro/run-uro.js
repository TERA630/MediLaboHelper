(function (global) {
  'use strict';

  function toUroViewModel(domainResult) {
    return {
      messages: domainResult && domainResult.messages ? domainResult.messages.slice() : []
    };
  }

  function runUroUsecase(inputPort) {
    var domainResult = global.MedcalcDomain.calculateUro(inputPort);
    return toUroViewModel(domainResult);
  }

  global.MedcalcUsecase = global.MedcalcUsecase || {};
  global.MedcalcUsecase.runUro = runUroUsecase;
})(window);
