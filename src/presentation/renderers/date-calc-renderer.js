(function (global) {
  'use strict';

  function renderDateCalcResult(viewModel) {
    var messages = viewModel && viewModel.messages ? viewModel.messages : [];
    global.MedcalcRenderers.setMessages('dateCalc-output', messages);
  }

  global.MedcalcRenderers = global.MedcalcRenderers || {};
  global.MedcalcRenderers.renderDateCalc = renderDateCalcResult;
})(window);
