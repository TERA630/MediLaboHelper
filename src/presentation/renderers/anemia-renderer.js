(function (global) {
  'use strict';

  function renderAnemiaResult(viewModel) {
    var messages = viewModel && viewModel.messages ? viewModel.messages : [];
    global.MedcalcRenderers.setMessages('anemia-output', messages);
  }

  global.MedcalcRenderers = global.MedcalcRenderers || {};
  global.MedcalcRenderers.renderAnemia = renderAnemiaResult;
})(window);
