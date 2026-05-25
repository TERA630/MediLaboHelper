(function (global) {
  'use strict';

  function setMessages(outputId, messages) {
    var out = global.MedcalcDom.$(outputId);
    if (!out) return;

    if (!messages || !messages.length) {
      out.innerHTML = '';
      return;
    }

    // 既存の表示スタイル維持（pタグ列 + 一部<b>を許容）
    var html = '';
    for (var i = 0; i < messages.length; i++) html += '<p>' + messages[i] + '</p>';
    out.innerHTML = html;
  }

  global.MedcalcRenderers = global.MedcalcRenderers || {};
  global.MedcalcRenderers.setMessages = setMessages;
})(window);
