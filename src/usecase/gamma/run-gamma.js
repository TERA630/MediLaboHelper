(function (global) {
  'use strict';

  function toGammaViewModel(domainResult) {
    return {
      messagesA: domainResult && domainResult.messagesA ? domainResult.messagesA.slice() : [],
      messagesB: domainResult && domainResult.messagesB ? domainResult.messagesB.slice() : [],
      messagesDrug: domainResult && domainResult.messagesDrug ? domainResult.messagesDrug.slice() : [],
      selectedDrug: domainResult ? domainResult.selectedDrug : '',
      drugs: domainResult && domainResult.drugs ? domainResult.drugs.slice() : []
    };
  }

  function runGammaUsecase(inputPort) {
    var domainResult = global.MedcalcDomain.calculateGamma(inputPort);
    return toGammaViewModel(domainResult);
  }

  global.MedcalcUsecase = global.MedcalcUsecase || {};
  global.MedcalcUsecase.runGamma = runGammaUsecase;
})(window);
