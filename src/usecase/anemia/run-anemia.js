(function (global) {
  'use strict';

  function toAnemiaViewModel(domainResult) {
    return {
      messages: domainResult && domainResult.messages ? domainResult.messages.slice() : [],
      evidenceAtoms: domainResult && domainResult.evidenceAtoms ? domainResult.evidenceAtoms.slice() : [],
      diseaseScore: domainResult ? domainResult.diseaseScore : null,
      idaDecision: domainResult ? domainResult.idaDecision : null,
      calculatedValues: domainResult ? domainResult.calculatedValues : null
    };
  }

  function runAnemiaUsecase(inputPort) {
    var domainResult = global.MedcalcDomain.calculateAnemia(inputPort);
    return toAnemiaViewModel(domainResult);
  }

  global.MedcalcUsecase = global.MedcalcUsecase || {};
  global.MedcalcUsecase.runAnemia = runAnemiaUsecase;
})(window);
