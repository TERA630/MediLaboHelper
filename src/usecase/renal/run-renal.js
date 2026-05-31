(function (global) {
  'use strict';

  function toRenalViewModel(domainResult) {
    return {
      messages: domainResult && domainResult.messages ? domainResult.messages.slice() : []
    };
  }

  function runRenalUsecase(inputPort) {
    var domainResult = global.MedcalcDomain.calculateRenal(inputPort);
    return toRenalViewModel(domainResult);
  }

  global.MedcalcUsecase = global.MedcalcUsecase || {};
  global.MedcalcUsecase.runRenal = runRenalUsecase;
})(window);
