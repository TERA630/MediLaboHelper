(function (global) {
  'use strict';

  function renderDrugChips(viewModel) {
    var chipsEl = global.MedcalcDom.$('gamma-drug-chips');
    if (!chipsEl) return;

    var chipsHtml = '';
    var drugs = viewModel && viewModel.drugs ? viewModel.drugs : [];
    var selectedDrug = viewModel ? viewModel.selectedDrug : '';

    drugs.forEach(function (entry) {
      var key = entry.key;
      var d = entry.info;
      var rangeStr = d.ranges.map(function (r) {
        return r.label + '：' + r.min + (r.min === r.max ? '' : '～' + r.max) + ' γ';
      }).join('<br>');
      var concStr = d.conc_label ? '<span style="color:#888;font-size:11px;">💊 ' + d.conc_label + '</span><br>' : '';
      var selectedClass = (key === selectedDrug) ? ' selected-drug' : '';
      chipsHtml += '<div class="drug-chip' + selectedClass + '">';
      chipsHtml += '<span class="drug-name">' + d.label + '</span>';
      chipsHtml += concStr;
      chipsHtml += '<span class="drug-range">' + rangeStr + '</span>';
      chipsHtml += '</div>';
    });

    chipsEl.innerHTML = chipsHtml;
  }

  function renderGammaResult(viewModel) {
    global.MedcalcRenderers.setMessages('gamma-output-a', viewModel && viewModel.messagesA ? viewModel.messagesA : []);
    global.MedcalcRenderers.setMessages('gamma-output-b', viewModel && viewModel.messagesB ? viewModel.messagesB : []);
    global.MedcalcRenderers.setMessages('gamma-output-drug', viewModel && viewModel.messagesDrug ? viewModel.messagesDrug : []);
    renderDrugChips(viewModel);
  }

  global.MedcalcRenderers = global.MedcalcRenderers || {};
  global.MedcalcRenderers.renderGamma = renderGammaResult;
})(window);
