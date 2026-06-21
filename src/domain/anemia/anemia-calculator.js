(function (global) {
  'use strict';

  var IDA_TARGET = 'IRON_DEFICIENCY_ANEMIA';
  var IDA_SOURCES = ['ferritin', 'tsat', 'tibc', 'uibc', 'mcv', 'rdw', 'stfr_index'];
  var IDA_DECISION_TABLE = [
    { label: 'HIGH', minScore: 6, minSupportingSources: 2, message: '鉄欠乏性貧血を支持する所見が複数あり、蓋然性は高いです' },
    { label: 'POSSIBLE', minScore: 3, minSupportingSources: 2, message: '鉄欠乏性貧血の可能性があります。臨床状況と追加検査をあわせて評価してください' },
    { label: 'WEAK', minScore: 1, minSupportingSources: 2, message: '一部に鉄欠乏を示唆する所見がありますが、証拠は限定的です' }
  ];

  function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
  }

  // 境界は min <= value < max。nullの境界は片側無限として扱う。
  function classifyByRange(value, ranges, sex) {
    if (!isNumber(value) || !Array.isArray(ranges)) return null;
    for (var i = 0; i < ranges.length; i += 1) {
      var range = ranges[i];
      var min = range.min === null || typeof range.min === 'undefined' ? -Infinity : range.min;
      var max = range.max === null || typeof range.max === 'undefined' ? Infinity : range.max;
      var sexMatches = !range.sex || range.sex === sex;
      if (sexMatches && min <= value && value < max) return range;
    }
    return null;
  }

  function createEvidenceAtom(source, finding) {
    return {
      target: IDA_TARGET,
      code: finding.code,
      direction: finding.direction,
      weight: finding.weight,
      confidence: finding.confidence,
      source: source,
      message: finding.message
    };
  }

  function buildEvidenceAtoms(values, sex) {
    var table = global.MedcalcAnemiaRangeTable || {};
    var atoms = [];
    var classifications = {};
    Object.keys(values).forEach(function (source) {
      if (!table[source]) return;
      var finding = classifyByRange(values[source], table[source].ranges, sex);
      if (!finding) return;
      classifications[source] = finding.classification;
      atoms.push(createEvidenceAtom(source, finding));
    });
    return { atoms: atoms, classifications: classifications };
  }

  function aggregateEvidence(atoms, measuredSources) {
    var score = {
      target: IDA_TARGET,
      score: 0,
      supportingAtoms: [],
      opposingAtoms: [],
      modifierAtoms: [],
      missingItems: [],
      flags: []
    };
    atoms.forEach(function (atom) {
      if (atom.direction === 'support') {
        score.score += atom.weight;
        score.supportingAtoms.push(atom);
      } else if (atom.direction === 'against') {
        score.score -= atom.weight;
        score.opposingAtoms.push(atom);
      } else if (atom.direction === 'modifier') {
        score.modifierAtoms.push(atom);
      }
    });
    IDA_SOURCES.forEach(function (source) {
      if (!measuredSources[source]) score.missingItems.push(source);
    });
    var supportSources = {};
    var evidenceSources = {};
    atoms.forEach(function (atom) { evidenceSources[atom.source] = true; });
    score.supportingAtoms.forEach(function (atom) { supportSources[atom.source] = true; });
    score.evidenceSourceCount = Object.keys(evidenceSources).length;
    score.supportingSourceCount = Object.keys(supportSources).length;
    if (score.supportingAtoms.length && score.opposingAtoms.length) score.flags.push('CONFLICTING_EVIDENCE');
    if (score.modifierAtoms.some(function (atom) { return atom.code === 'CRP_HIGH'; })) score.flags.push('INFLAMMATION_PRESENT');
    if (score.supportingSourceCount < 2 && score.supportingAtoms.length) score.flags.push('SINGLE_SOURCE_EVIDENCE');
    return score;
  }

  function decideIda(score) {
    if (score.evidenceSourceCount < 2) {
      return { label: 'INSUFFICIENT', message: '単一の検査項目だけでは鉄欠乏性貧血の最終判定は行いません。補助指標を追加してください', reason: 'SINGLE_SOURCE' };
    }
    if (!score.supportingAtoms.length) {
      return { label: 'NOT_SUPPORTED', message: '鉄欠乏性貧血を支持する所見は確認できません', reason: 'NO_SUPPORT' };
    }
    if (score.flags.indexOf('SINGLE_SOURCE_EVIDENCE') !== -1) {
      return { label: 'INSUFFICIENT', message: '単一の検査項目だけでは鉄欠乏性貧血の最終判定は行いません。補助指標を追加してください', reason: 'SINGLE_SOURCE' };
    }
    if (score.flags.indexOf('CONFLICTING_EVIDENCE') !== -1 && score.score < 6) {
      return { label: 'INDETERMINATE', message: '鉄欠乏を支持する所見と反証所見が混在しています。炎症・併存疾患を含めて再評価してください', reason: 'CONFLICTING_EVIDENCE' };
    }
    for (var i = 0; i < IDA_DECISION_TABLE.length; i += 1) {
      var rule = IDA_DECISION_TABLE[i];
      if (score.score >= rule.minScore && score.supportingSourceCount >= rule.minSupportingSources) return rule;
    }
    return { label: 'INSUFFICIENT', message: '複数所見はありますが、鉄欠乏性貧血の判定には証拠が不足しています', reason: 'LOW_SCORE' };
  }

  function calculateAnemiaDomain(input) {
    input = input || {};
    var hb = input.hb;
    var hct = input.hct;
    var rbc = input.rbc;
    var tibc = input.tibc;
    var serumIron = input.serumIron;
    var uibc = input.uibc;
    var mcvCalc = isNumber(hct) && isNumber(rbc) && rbc > 0 ? hct * 1000 / rbc : null;
    var mcv = isNumber(input.mcvInput) ? input.mcvInput : mcvCalc;
    if (!isNumber(tibc) && isNumber(uibc) && isNumber(serumIron)) tibc = uibc + serumIron;
    var tsatCalc = isNumber(tibc) && isNumber(serumIron) && tibc > 0 ? serumIron / tibc * 100 : null;
    var tsat = isNumber(input.tsatInput) ? input.tsatInput : tsatCalc;
    var values = { ferritin: input.ferritin, tsat: tsat, tibc: tibc, uibc: uibc, mcv: mcv, crp: input.crp, rdw: input.rdw, stfr_index: input.stfrIndex };
    var built = buildEvidenceAtoms(values, input.sex);
    var score = aggregateEvidence(built.atoms, values);
    var decision = decideIda(score);
    var messages = [];

    if (built.atoms.length) {
      messages.push(decision.message);
    }
    if (mcv !== null) {
      messages.push(mcv < 80 ? '<b>小球性貧血</b>' : (mcv > 100 ? '<b>大球性貧血</b>' : '<b>正球性貧血</b>'));
    }
    return {
      messages: messages,
      evidenceAtoms: built.atoms,
      diseaseScore: score,
      idaDecision: decision,
      classifications: built.classifications,
      calculatedValues: {
        tsatInput: input.tsatInput,
        tsatCalculated: tsatCalc,
        mcvInput: input.mcvInput,
        mcvCalculated: mcvCalc,
        mcvForClassification: mcv
      }
    };
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.classifyAnemiaByRange = classifyByRange;
  global.MedcalcDomain.calculateAnemia = calculateAnemiaDomain;
})(window);
