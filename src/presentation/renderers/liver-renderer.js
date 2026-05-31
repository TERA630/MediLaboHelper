(function (global) {
  'use strict';

  function renderLiverResult(viewModel) {
    var messages = viewModel && viewModel.messages ? viewModel.messages : [];
    global.MedcalcRenderers.setMessages('liver-output', messages);
  }

  global.MedcalcRenderers = global.MedcalcRenderers || {};
  global.MedcalcRenderers.renderLiver = renderLiverResult;
})(window);
