(function (global) {
  'use strict';

  function toAnemiaViewModel(domainResult) {
    return {
      messages: domainResult && domainResult.messages ? domainResult.messages.slice() : []
    };
  }

  function runAnemiaUsecase(inputPort) {
    var domainResult = global.MedcalcDomain.calculateAnemia(inputPort);
    return toAnemiaViewModel(domainResult);
  }

  global.MedcalcUsecase = global.MedcalcUsecase || {};
  global.MedcalcUsecase.runAnemia = runAnemiaUsecase;
})(window);
