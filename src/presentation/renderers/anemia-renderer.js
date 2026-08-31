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

  function formatMcvClassification(mcv) {
    if (!isNumber(mcv)) return '';
    if (mcv < 80) return '小球性貧血';
    if (mcv > 100) return '大球性貧血';
    return '正球性貧血';
  }

  function formatEvidenceDetails(viewModel) {
    var atoms = viewModel && viewModel.evidenceAtoms ? viewModel.evidenceAtoms : [];
    if (!atoms.length) return '';

    var detailItems = atoms.map(function (atom) {
      return '<li>' + atom.message + '</li>';
    });
    var flags = viewModel.diseaseScore && viewModel.diseaseScore.flags ? viewModel.diseaseScore.flags : [];
    if (flags.indexOf('INFLAMMATION_PRESENT') !== -1) {
      detailItems.push('<li>炎症ありのため、フェリチンは急性期反応の影響を考慮して解釈してください</li>');
    }
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
    var classification = formatMcvClassification(calculatedValues.mcvForClassification);
    var decision = viewModel && viewModel.idaDecision && viewModel.evidenceAtoms && viewModel.evidenceAtoms.length ? viewModel.idaDecision.message : '';
    var generalIronStatusDecision = viewModel && viewModel.generalIronStatusDecision ? viewModel.generalIronStatusDecision.message : '';
    var esaIronStatusDecision = viewModel && viewModel.esaIronStatusDecision ? viewModel.esaIronStatusDecision.message : '';

    if (tsatLine) lines.push('<p>' + tsatLine + '</p>');
    if (mcvLine) lines.push('<p>' + mcvLine + '</p>');
    if (decision) lines.push('<p><b>鉄欠乏性貧血判定：</b>' + decision + '</p>');
    if (generalIronStatusDecision) lines.push('<p><b>一般鉄状態：</b>' + generalIronStatusDecision + '</p>');
    if (esaIronStatusDecision) lines.push('<p><b>ESA/HIF-PH阻害剤投与時の鉄状態：</b>' + esaIronStatusDecision + '</p>');
    if (classification) lines.push('<p><b>' + classification + '</b></p>');
    lines.push(formatEvidenceDetails(viewModel));
    out.innerHTML = lines.join('');
  }

  global.MedcalcRenderers = global.MedcalcRenderers || {};
  global.MedcalcRenderers.renderAnemia = renderAnemiaResult;
})(window);
