(function (global) {
  'use strict';

  function renderRenalResult(result) {
    global.MedcalcRenderers.setMessages('renal-output', result && result.messages ? result.messages : []);
  }

  global.MedcalcRenderers = global.MedcalcRenderers || {};
  global.MedcalcRenderers.renderRenal = renderRenalResult;
})(window);
