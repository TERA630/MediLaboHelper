(function (global) {
  'use strict';

  function renderGlucoseResult(viewModel) {
    var messages = viewModel && viewModel.messages ? viewModel.messages : [];
    global.MedcalcRenderers.setMessages('glucose-output', messages);
  }

  global.MedcalcRenderers = global.MedcalcRenderers || {};
  global.MedcalcRenderers.renderGlucose = renderGlucoseResult;
})(window);
