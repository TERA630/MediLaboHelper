(function (global) {
  'use strict';

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function findComponent(viewModel, code) {
    var components = viewModel && viewModel.components ? viewModel.components : [];
    for (var i = 0; i < components.length; i += 1) {
      if (components[i].code === code) return components[i];
    }
    return null;
  }

  function formatPoints(points) {
    return points % 1 === 0 ? String(points) : points.toFixed(1);
  }

  function setText(id, text) {
    var el = global.MedcalcDom.$(id);
    if (el) el.textContent = text;
  }

  function renderPatientContext(viewModel) {
    var context = viewModel.context || {};

    if (viewModel.selectedScore === 'cha2ds2-vasc') {
      var age75 = findComponent(viewModel, 'AGE_75_OR_OLDER');
      var age65 = findComponent(viewModel, 'AGE_65_TO_74');
      var agePoints = age75 && age75.active ? age75.points : (age65 && age65.active ? age65.points : 0);
      var female = findComponent(viewModel, 'FEMALE_SEX');
      setText('cardio-cha-age-summary', context.age === null
        ? '年齢：未入力'
        : '年齢：' + context.age + '歳 → +' + agePoints);
      setText('cardio-cha-gender-summary', !context.gender
        ? '性別：未選択'
        : '性別：' + (context.gender === 'female' ? '女性' : '男性') + ' → +' + (female && female.active ? 1 : 0));
    }

    if (viewModel.selectedScore === 'has-bled') {
      var elderly = findComponent(viewModel, 'AGE_OVER_65');
      setText('cardio-has-age-summary', context.age === null
        ? '年齢：未入力'
        : '年齢：' + context.age + '歳 → +' + (elderly && elderly.active ? 1 : 0));
    }
  }

  function renderInterpretation(viewModel) {
    if (!viewModel.hasAnyInput) {
      return '<p class="cardio-guidance">該当項目を入力してください。</p>';
    }

    if (viewModel.selectedScore === 'wells-pe' && viewModel.interpretation) {
      return '<div class="cardio-interpretation">' +
        '<p><b>2-tier:</b> ' + escapeHtml(viewModel.interpretation.twoTier) + '</p>' +
        '<p><b>3-tier:</b> ' + escapeHtml(viewModel.interpretation.threeTier) + '</p>' +
        '</div>';
    }

    if (viewModel.interpretation) {
      return '<p class="cardio-interpretation">' + escapeHtml(viewModel.interpretation) + '</p>';
    }

    return '';
  }

  function renderMissingItems(viewModel) {
    if (!viewModel.missingItems || !viewModel.missingItems.length) return '';
    return '<p class="cardio-missing">未入力：' + escapeHtml(viewModel.missingItems.join('、')) +
      '（未入力項目の加点は評価していません）</p>';
  }

  function renderBreakdown(viewModel) {
    var activeComponents = viewModel.components.filter(function (component) {
      return component.active;
    });
    var items = activeComponents.map(function (component) {
      return '<li>' + escapeHtml(component.label) + ' <b>+' + formatPoints(component.points) + '</b></li>';
    });

    if (!items.length) {
      return '<h3>加点内訳</h3><p class="cardio-no-points">加点項目なし</p>';
    }

    return '<h3>加点内訳</h3><ul class="cardio-breakdown">' + items.join('') + '</ul>';
  }

  function renderCardioResult(viewModel) {
    var out = global.MedcalcDom.$('cardio-output');
    if (!out || !viewModel) return;

    renderPatientContext(viewModel);
    out.innerHTML = '<section class="cardio-result" aria-live="polite">' +
      '<h2>' + escapeHtml(viewModel.scoreName) + '</h2>' +
      '<div class="cardio-score-value"><strong>' + formatPoints(viewModel.score) + '</strong><span>点</span></div>' +
      renderInterpretation(viewModel) +
      renderMissingItems(viewModel) +
      renderBreakdown(viewModel) +
      '<p class="cardio-safety-note">本スコアは診療支援情報です。単独で診断や治療方針を決定するものではありません。</p>' +
      '</section>';
  }

  global.MedcalcRenderers = global.MedcalcRenderers || {};
  global.MedcalcRenderers.renderCardio = renderCardioResult;
})(window);
