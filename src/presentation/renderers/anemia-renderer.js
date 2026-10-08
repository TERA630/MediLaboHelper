(function (global) {
  'use strict';

  function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
  }

  function formatCalculatedValue(label, unit, inputValue, calculatedValue) {
    if (!isNumber(calculatedValue)) return '';
    var calculatedText = calculatedValue.toFixed(1) + ' ' + unit + '（算出値）';
    if (!isNumber(inputValue)) return label + '：' + calculatedText;
    return label + '：' + inputValue.toFixed(1) + ' ' + unit + '（入力値） / ' + calculatedText;
  }

  function formatEvidenceDetails(viewModel) {
    var diagnosticAtoms = viewModel && viewModel.evidenceAtoms ? viewModel.evidenceAtoms : [];
    var ironStatusAtoms = viewModel && viewModel.ironStatusEvidenceAtoms ? viewModel.ironStatusEvidenceAtoms : [];
    var atoms = diagnosticAtoms.filter(function (atom) {
      if (atom.source === 'hb' || atom.source === 'inflammation' || atom.source === 'ferritin' || atom.source === 'tsat' || atom.source === 'mcv') return false;
      if (atom.source === 'uibc' && atom.code === 'UIBC_NORMAL') return false;
      return true;
    }).concat(ironStatusAtoms);
    if (!atoms.length) return '';

    var storageIronLabels = {
      deficient: '欠乏',
      replete: '充足',
      increased: '増加',
      indeterminate: '判定保留'
    };
    var detailItems = atoms.map(function (atom) {
      if (atom.source === 'ferritin_status' && storageIronLabels[atom.classification]) {
        return '<li>貯蔵鉄：' + storageIronLabels[atom.classification] + '</li>';
      }
      var prefix = atom.source === 'iron_metabolism' ? '鉄代謝判定：' : '';
      return '<li>' + prefix + atom.message + '</li>';
    });
    var flags = viewModel.diseaseScore && viewModel.diseaseScore.flags ? viewModel.diseaseScore.flags : [];
    if (flags.indexOf('CONFLICTING_EVIDENCE') !== -1) {
      detailItems.push('<li>支持所見と反証所見が混在しています</li>');
    }
    return '<details class="anemia-evidence-details"><summary>判定の詳細</summary><ul>' + detailItems.join('') + '</ul></details>';
  }

  function renderAnemiaResult(viewModel) {
    var out = global.MedcalcDom.$('anemia-output');
    if (!out) return;

    var calculatedValues = viewModel && viewModel.calculatedValues ? viewModel.calculatedValues : {};
    var lines = [];
    var tsatLine = formatCalculatedValue('鉄飽和率', '%', calculatedValues.tsatInput, calculatedValues.tsatCalculated);
    var mcvLine = formatCalculatedValue('MCV', 'fL', calculatedValues.mcvInput, calculatedValues.mcvCalculated);
    var decision = viewModel && viewModel.idaDecision && viewModel.evidenceAtoms && viewModel.evidenceAtoms.length ? viewModel.idaDecision.message : '';
    var ironStatusDecision = viewModel && viewModel.ironStatusDecision ? viewModel.ironStatusDecision.message : '';

    if (tsatLine) lines.push('<p>' + tsatLine + '</p>');
    if (mcvLine) lines.push('<p>' + mcvLine + '</p>');
    if (decision) lines.push('<p><b>鉄欠乏性貧血判定：</b>' + decision + '</p>');
    if (ironStatusDecision) lines.push('<p><b>鉄状態：</b>' + ironStatusDecision + '</p>');
    lines.push(formatEvidenceDetails(viewModel));
    out.innerHTML = lines.join('');
  }

  global.MedcalcRenderers = global.MedcalcRenderers || {};
  global.MedcalcRenderers.renderAnemia = renderAnemiaResult;
})(window);
