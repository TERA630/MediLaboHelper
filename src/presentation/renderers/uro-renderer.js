(function (global) {
  'use strict';

  function renderUroResult(viewModel) {
    var messages = viewModel && viewModel.messages ? viewModel.messages : [];
    global.MedcalcRenderers.setMessages('uro-output', messages);
  }

  global.MedcalcRenderers = global.MedcalcRenderers || {};
  global.MedcalcRenderers.renderUro = renderUroResult;
})(window);
