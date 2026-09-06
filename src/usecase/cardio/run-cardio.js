(function (global) {
  'use strict';

  function getCalculators() {
    return {
      'wells-pe': global.MedcalcDomain.calculateWellsPe,
      'cha2ds2-vasc': global.MedcalcDomain.calculateCha2ds2Vasc,
      'has-bled': global.MedcalcDomain.calculateHasBled
    };
  }

  function toCardioViewModel(selectedScore, domainResult) {
    return {
      selectedScore: selectedScore,
      scoreName: domainResult.scoreName,
      score: domainResult.score,
      components: domainResult.components.slice(),
      interpretation: domainResult.interpretation,
      missingItems: domainResult.missingItems.slice(),
      hasAnyInput: domainResult.hasAnyInput,
      context: domainResult.context
    };
  }

  function runCardioUsecase(inputPort) {
    inputPort = inputPort || {};
    var calculators = getCalculators();
    var selectedScore = calculators[inputPort.selectedScore] ? inputPort.selectedScore : 'wells-pe';
    var scoreInputs = inputPort.scores || {};
    var domainResult = calculators[selectedScore](scoreInputs[selectedScore] || {});
    return toCardioViewModel(selectedScore, domainResult);
  }

  global.MedcalcUsecase = global.MedcalcUsecase || {};
  global.MedcalcUsecase.runCardio = runCardioUsecase;
})(window);
