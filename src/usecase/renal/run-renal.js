(function (global) {
  'use strict';

  function runRenalUsecase(inputPort) {
    return global.MedcalcDomain.calculateRenal(inputPort);
  }

  global.MedcalcUsecase = global.MedcalcUsecase || {};
  global.MedcalcUsecase.runRenal = runRenalUsecase;
})(window);
