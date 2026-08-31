(function (global) {
  'use strict';

  var IDA_TARGET = 'IRON_DEFICIENCY_ANEMIA';
  var IRON_DEFICIENCY_TARGET = 'IRON_DEFICIENCY';
  var IDA_SOURCES = ['ferritin', 'tsat', 'tibc', 'uibc', 'mcv', 'rdw', 'stfr_index'];
  var OTHER_IRON_METABOLISM_SOURCES = ['tsat', 'tibc', 'uibc', 'stfr_index'];
  var IDA_DECISION_TABLE = [
    {
      label: 'IDA_DIAGNOSTIC',
      requiredAtoms: ['ANEMIA_PRESENT', 'FERRITIN_LT15'],
      message: '貧血があり、フェリチン15 ng/mL未満です。鉄欠乏性貧血として診断的です（感度59％、特異度99％）'
    },
    {
      label: 'IDA_SUPPORTED_WITH_INFLAMMATION',
      requiredAtoms: ['ANEMIA_PRESENT', 'INFLAMMATION_PRESENT', 'FERRITIN_LT70_WITH_INFLAMMATION'],
      minOtherIronSupportingSources: 1,
      message: '炎症を考慮したフェリチン基準と他の鉄代謝所見から、鉄欠乏性貧血が支持されます'
    },
    {
      label: 'IDA_SUPPORTED_LOW_STORES',
      requiredAtoms: ['ANEMIA_PRESENT', 'FERRITIN_LT30'],
      minOtherIronSupportingSources: 1,
      message: '鉄貯蔵低下と他の鉄代謝所見から、鉄欠乏性貧血が支持されます'
    },
    {
      label: 'IDA_SUPPORTED_AGA',
      requiredAtoms: ['ANEMIA_PRESENT', 'FERRITIN_LT45_AGA'],
      minOtherIronSupportingSources: 1,
      message: 'AGAのフェリチン基準と他の鉄代謝所見から、鉄欠乏性貧血が支持されます'
    },
    {
      label: 'IDA_SUPPORTED',
      requiredAtoms: ['ANEMIA_PRESENT'],
      minOtherIronSupportingSources: 2,
      minScore: 3,
      message: '複数の鉄代謝所見から、鉄欠乏性貧血が支持されます'
    }
  ];

  function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
  }

  // 境界は min <= value < max。null の境界は片側無限として扱う。
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

  function copyMetadata(atom, finding) {
    var keys = [
      'classification', 'role', 'evidenceGroup', 'diagnosticRole',
      'requiresForIda', 'requiresCorroboration', 'recommendedCorroboration',
      'diagnosticAccuracy', 'evidenceCertainty', 'guideline'
    ];
    keys.forEach(function (key) {
      if (typeof finding[key] !== 'undefined') atom[key] = finding[key];
    });
    return atom;
  }

  function defaultTargetForSource(source) {
    if (source === 'crp') return 'CLINICAL_CONTEXT';
    if (source === 'mcv' || source === 'rdw') return IDA_TARGET;
    return IRON_DEFICIENCY_TARGET;
  }

  function createEvidenceAtom(source, finding) {
    var atom = {
      target: finding.target || defaultTargetForSource(source),
      code: finding.code,
      direction: finding.direction,
      weight: finding.weight,
      confidence: finding.confidence,
      source: source,
      message: finding.message
    };
    if (!finding.evidenceGroup && OTHER_IRON_METABOLISM_SOURCES.indexOf(source) !== -1) {
      atom.evidenceGroup = 'iron_metabolism';
    }
    return copyMetadata(atom, finding);
  }

  function getInflammationStatus(crp) {
    if (!isNumber(crp)) return 'unknown';
    return crp >= 0.5 ? 'present' : 'absent';
  }

  function getContextCodes(inflammationStatus) {
    if (inflammationStatus === 'present') return ['INFLAMMATION_PRESENT'];
    if (inflammationStatus === 'absent') return ['INFLAMMATION_ABSENT'];
    return [];
  }

  function matchesFerritinOverloadRule(value, sex, inflammationStatus, rule) {
    if (!isNumber(value) || !rule || rule.sex !== sex) return false;
    if (rule.requiredContext === 'INFLAMMATION_ABSENT' && inflammationStatus !== 'absent') return false;
    return rule.operator === 'gt' && value > rule.value;
  }

  function buildFerritinAtom(value, sex, inflammationStatus, finding) {
    if (!finding) return null;
    var rules = global.MedcalcAnemiaEvidenceRules || {};
    var overloadRules = rules.ferritinOverload || [];
    for (var i = 0; i < overloadRules.length; i += 1) {
      if (matchesFerritinOverloadRule(value, sex, inflammationStatus, overloadRules[i])) {
        var overloadAtom = createEvidenceAtom('ferritin', rules.ferritinOverloadAtom);
        overloadAtom.classification = sex === 'female' ? 'high_for_female' : 'high_for_male';
        overloadAtom.threshold = overloadRules[i].value;
        return overloadAtom;
      }
    }

    var inflammationRule = rules.ferritinWithInflammation;
    if (inflammationStatus === 'present' && inflammationRule && finding.classification === inflammationRule.rangeClassification) {
      var inflammationAtom = createEvidenceAtom('ferritin', inflammationRule.atom);
      inflammationAtom.classification = finding.classification;
      return inflammationAtom;
    }

    var atom = createEvidenceAtom('ferritin', finding);
    atom.target = IRON_DEFICIENCY_TARGET;
    atom.evidenceGroup = 'iron_metabolism';
    return atom;
  }

  function buildEvidenceAtoms(values, sex, hb) {
    var table = global.MedcalcAnemiaRangeTable || {};
    var atoms = [];
    var classifications = {};
    var inflammationStatus = getInflammationStatus(values.crp);
    var contextCodes = getContextCodes(inflammationStatus);
    var hemoglobinFinding = table.hemoglobin ? classifyByRange(hb, table.hemoglobin.ranges, sex) : null;

    if (hemoglobinFinding) {
      classifications.hemoglobin = hemoglobinFinding.classification;
      atoms.push(createEvidenceAtom('hb', hemoglobinFinding));
    }

    var ferritinFinding = table.ferritin ? classifyByRange(values.ferritin, table.ferritin.ranges, sex) : null;
    if (ferritinFinding) {
      var ferritinAtom = buildFerritinAtom(values.ferritin, sex, inflammationStatus, ferritinFinding);
      classifications.ferritin = ferritinAtom.classification || ferritinFinding.classification;
      atoms.push(ferritinAtom);
    }

    ['tsat', 'tibc', 'uibc', 'mcv', 'crp', 'rdw', 'stfr_index'].forEach(function (source) {
      if (!table[source]) return;
      var finding = classifyByRange(values[source], table[source].ranges, sex);
      if (!finding) return;
      classifications[source] = finding.classification;
      atoms.push(createEvidenceAtom(source, finding));
    });

    return {
      atoms: atoms,
      classifications: classifications,
      contextCodes: contextCodes,
      inflammationStatus: inflammationStatus
    };
  }

  function isIronDeficiencyEvidence(atom) {
    return atom.target === IRON_DEFICIENCY_TARGET || atom.target === IDA_TARGET;
  }

  function aggregateEvidence(atoms, measuredSources, contextCodes) {
    var score = {
      target: IDA_TARGET,
      score: 0,
      supportingAtoms: [], opposingAtoms: [], modifierAtoms: [],
      missingItems: [], flags: [], evidenceSourceCount: 0,
      supportingSourceCount: 0, otherIronSupportingSourceCount: 0
    };
    var evidenceSources = {};
    var supportSources = {};
    var otherIronSupportSources = {};

    atoms.forEach(function (atom) {
      if (atom.direction === 'modifier') score.modifierAtoms.push(atom);
      if (!isIronDeficiencyEvidence(atom)) return;
      evidenceSources[atom.source] = true;
      if (atom.direction === 'support') {
        score.score += atom.weight;
        score.supportingAtoms.push(atom);
        supportSources[atom.source] = true;
        if (OTHER_IRON_METABOLISM_SOURCES.indexOf(atom.source) !== -1) otherIronSupportSources[atom.source] = true;
      } else if (atom.direction === 'against') {
        score.score -= atom.weight;
        score.opposingAtoms.push(atom);
      }
    });

    IDA_SOURCES.forEach(function (source) {
      if (!isNumber(measuredSources[source])) score.missingItems.push(source);
    });
    score.evidenceSourceCount = Object.keys(evidenceSources).length;
    score.supportingSourceCount = Object.keys(supportSources).length;
    score.otherIronSupportingSourceCount = Object.keys(otherIronSupportSources).length;
    if (score.supportingAtoms.length && score.opposingAtoms.length) score.flags.push('CONFLICTING_EVIDENCE');
    if (contextCodes.indexOf('INFLAMMATION_PRESENT') !== -1) score.flags.push('INFLAMMATION_PRESENT');
    if (score.supportingSourceCount < 2 && score.supportingAtoms.length) score.flags.push('SINGLE_SOURCE_EVIDENCE');
    return score;
  }

  function collectCodes(atoms, contextCodes) {
    var codes = {};
    atoms.forEach(function (atom) { codes[atom.code] = true; });
    contextCodes.forEach(function (code) { codes[code] = true; });
    return codes;
  }

  function hasAllCodes(codes, requiredCodes) {
    return (requiredCodes || []).every(function (code) { return !!codes[code]; });
  }

  function hasAnyCode(codes, requiredCodes) {
    if (!requiredCodes || !requiredCodes.length) return true;
    return requiredCodes.some(function (code) { return !!codes[code]; });
  }

  function matchesDecisionRule(rule, codes, score) {
    if (!hasAllCodes(codes, rule.requiredAtoms)) return false;
    if (!hasAnyCode(codes, rule.requiredAnyAtoms)) return false;
    if (typeof rule.minOtherIronSupportingSources === 'number' && score.otherIronSupportingSourceCount < rule.minOtherIronSupportingSources) return false;
    if (typeof rule.minScore === 'number' && score.score < rule.minScore) return false;
    return true;
  }

  function decideIda(score, atoms, contextCodes) {
    var codes = collectCodes(atoms, contextCodes);
    var hasRelevantEvidence = score.evidenceSourceCount > 0;

    if (codes.ANEMIA_NOT_PRESENT) {
      return { label: 'NOT_ANEMIC', message: '現在のヘモグロビン値は貧血の基準を満たさないため、鉄欠乏性貧血とは判定しません。鉄欠乏の評価は別途行ってください', reason: 'ANEMIA_NOT_PRESENT' };
    }
    if (!codes.ANEMIA_PRESENT) {
      if (!hasRelevantEvidence) return null;
      return { label: 'INSUFFICIENT_ANEMIA_CONTEXT', message: '鉄欠乏性貧血の判定には、ヘモグロビン値と性別による貧血の確認が必要です', reason: 'ANEMIA_STATUS_UNKNOWN' };
    }

    for (var i = 0; i < IDA_DECISION_TABLE.length; i += 1) {
      if (matchesDecisionRule(IDA_DECISION_TABLE[i], codes, score)) return IDA_DECISION_TABLE[i];
    }

    if (!score.supportingAtoms.length) {
      return { label: 'NOT_SUPPORTED', message: '鉄欠乏性貧血を支持する所見は確認できません', reason: 'NO_SUPPORT' };
    }
    if (score.flags.indexOf('CONFLICTING_EVIDENCE') !== -1) {
      return { label: 'INDETERMINATE', message: '鉄欠乏を支持する所見と反証所見が混在しています。炎症・併存疾患を含めて再評価してください', reason: 'CONFLICTING_EVIDENCE' };
    }
    if (codes.FERRITIN_LT30) {
      return { label: 'CORROBORATION_REQUIRED', message: 'フェリチン30 ng/mL未満で鉄貯蔵低下が強く示唆されます。他の鉄代謝所見と合わせて鉄欠乏性貧血を判定してください', reason: 'OTHER_IRON_METABOLISM_REQUIRED' };
    }
    if (codes.FERRITIN_LT45_AGA) {
      return { label: 'CORROBORATION_REQUIRED', message: 'フェリチン45 ng/mL未満ですが、鉄欠乏性貧血の判定には他の鉄代謝所見を合わせてください', reason: 'OTHER_IRON_METABOLISM_REQUIRED' };
    }
    if (codes.FERRITIN_LT70_WITH_INFLAMMATION) {
      return { label: 'CORROBORATION_REQUIRED', message: '炎症下でフェリチン70 ng/mL未満のため鉄欠乏を示唆します。他の鉄代謝所見と合わせて鉄欠乏性貧血を判定してください', reason: 'OTHER_IRON_METABOLISM_REQUIRED' };
    }
    return { label: 'INSUFFICIENT', message: '鉄欠乏性貧血の判定には、追加の鉄代謝所見が必要です', reason: 'LOW_EVIDENCE' };
  }

  function decideIronOverload(atoms) {
    var codes = collectCodes(atoms, []);
    if (!codes.FERRITIN_HIGH_FOR_SEX) return null;
    if (codes.TSAT_HIGH) {
      return { label: 'IRON_OVERLOAD_SUPPORTED', message: '炎症のない状態で性別基準を超えるフェリチン高値とTSAT高値を認めます。鉄過剰について精査してください' };
    }
    return { label: 'IRON_OVERLOAD_SUSPECTED', message: '炎症のない状態でフェリチンが性別基準を超えています。鉄過剰を疑い、TSATなどを確認してください' };
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
    var values = {
      ferritin: input.ferritin, tsat: tsat, tibc: tibc, uibc: uibc,
      mcv: mcv, crp: input.crp, rdw: input.rdw, stfr_index: input.stfrIndex
    };
    var built = buildEvidenceAtoms(values, input.sex, hb);
    var score = aggregateEvidence(built.atoms, values, built.contextCodes);
    var decision = decideIda(score, built.atoms, built.contextCodes);
    var ironOverloadDecision = decideIronOverload(built.atoms);
    var messages = [];

    if (decision) messages.push(decision.message);
    if (ironOverloadDecision) messages.push(ironOverloadDecision.message);
    return {
      messages: messages,
      evidenceAtoms: built.atoms,
      diseaseScore: score,
      idaDecision: decision,
      ironOverloadDecision: ironOverloadDecision,
      classifications: built.classifications,
      clinicalContext: {
        anemiaStatus: built.classifications.hemoglobin || 'unknown',
        inflammationStatus: built.inflammationStatus
      },
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
