(function (global) {
  'use strict';

  var IDA_TARGET = 'IRON_DEFICIENCY_ANEMIA';
  var IRON_DEFICIENCY_TARGET = 'IRON_DEFICIENCY';
  var IDA_SOURCES = ['ferritin', 'tsat', 'tibc', 'uibc', 'mcv', 'rdw', 'stfr_index'];
  var OTHER_IRON_METABOLISM_SOURCES = ['tsat', 'tibc', 'uibc', 'stfr_index'];
  var NON_DIALYSIS_CKD_STAGES = ['g3b', 'g4g5'];
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

  function getInflammationStatus(selectedStatus, crp) {
    if (selectedStatus === 'present' || selectedStatus === 'absent') return selectedStatus;
    // 旧入力ポートとの互換性を保つ。画面からは炎症あり・なしを直接渡す。
    if (!isNumber(crp)) return 'unknown';
    return crp >= 0.5 ? 'present' : 'absent';
  }

  function getContextCodes(inflammationStatus) {
    if (inflammationStatus === 'present') return ['INFLAMMATION_PRESENT'];
    if (inflammationStatus === 'absent') return ['INFLAMMATION_ABSENT'];
    return [];
  }

  function buildInflammationAtom(inflammationStatus) {
    var evidenceRules = global.MedcalcAnemiaEvidenceRules || {};
    var definitions = evidenceRules.inflammationStatus || {};
    var definition = definitions[inflammationStatus];
    return definition ? createEvidenceAtom('inflammation', definition) : null;
  }

  function buildFerritinAtom(value, inflammationStatus, finding) {
    if (!finding) return null;
    var rules = global.MedcalcAnemiaEvidenceRules || {};
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

  function buildEvidenceAtoms(values, sex, hb, selectedInflammationStatus) {
    var table = global.MedcalcAnemiaRangeTable || {};
    var atoms = [];
    var classifications = {};
    var inflammationStatus = getInflammationStatus(selectedInflammationStatus, values.crp);
    var contextCodes = getContextCodes(inflammationStatus);
    var hemoglobinFinding = table.hemoglobin ? classifyByRange(hb, table.hemoglobin.ranges, sex) : null;

    if (hemoglobinFinding) {
      classifications.hemoglobin = hemoglobinFinding.classification;
      atoms.push(createEvidenceAtom('hb', hemoglobinFinding));
    }

    var inflammationAtom = buildInflammationAtom(inflammationStatus);
    if (inflammationAtom) {
      classifications.inflammation = inflammationStatus;
      atoms.push(inflammationAtom);
    }

    var ferritinFinding = table.ferritin ? classifyByRange(values.ferritin, table.ferritin.ranges, sex) : null;
    if (ferritinFinding) {
      var ferritinAtom = buildFerritinAtom(values.ferritin, inflammationStatus, ferritinFinding);
      classifications.ferritin = ferritinAtom.classification || ferritinFinding.classification;
      atoms.push(ferritinAtom);
    }

    ['tsat', 'tibc', 'uibc', 'mcv', 'rdw', 'stfr_index'].forEach(function (source) {
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

  function formatMeasuredValue(value) {
    return Number(value.toFixed(1)).toString();
  }

  function createStorageIronAtom(classification, message, contextKey, threshold) {
    var evidenceRules = global.MedcalcAnemiaEvidenceRules || {};
    var ironStatusRules = evidenceRules.ironStatus || {};
    var definition = ironStatusRules.storageAtoms && ironStatusRules.storageAtoms[classification];
    if (!definition) return null;
    var atom = createEvidenceAtom('ferritin_status', definition);
    atom.classification = classification;
    atom.context = contextKey || 'unknown';
    if (isNumber(threshold)) atom.threshold = threshold;
    atom.message = message;
    return atom;
  }

  function selectStorageContext(gfrStage, esaTherapy, inflammationStatus, contexts) {
    if (!gfrStage) return { reason: 'GFR区分が未選択です' };
    if (gfrStage === 'dialysis') return { key: 'dialysis', definition: contexts.dialysis };
    if (NON_DIALYSIS_CKD_STAGES.indexOf(gfrStage) !== -1) {
      return { key: 'nonDialysisCkd', definition: contexts.nonDialysisCkd };
    }
    if (esaTherapy === 'yes') return { key: 'esaHifPh', definition: contexts.esaHifPh };
    if (esaTherapy !== 'no') return { reason: 'ESA/HIF-PH阻害薬の投与状況が未選択です' };
    if (inflammationStatus === 'present') return { key: 'inflammation', definition: contexts.inflammation };
    if (inflammationStatus === 'absent') return { key: 'general', definition: contexts.general };
    return { reason: '炎症の有無が未選択です' };
  }

  function buildStorageIronAtom(ferritin, gfrStage, esaTherapy, inflammationStatus) {
    if (!isNumber(ferritin)) return null;
    var evidenceRules = global.MedcalcAnemiaEvidenceRules || {};
    var rules = evidenceRules.ironStatus || {};
    var contexts = rules.storageContexts || {};
    var selected = selectStorageContext(gfrStage, esaTherapy, inflammationStatus, contexts);
    var ferritinText = formatMeasuredValue(ferritin) + ' ng/mL';

    if (!selected.definition) {
      return createStorageIronAtom(
        'indeterminate',
        '貯蔵鉄：判定保留（フェリチン ' + ferritinText + '。' + selected.reason + '）',
        'unknown'
      );
    }

    if (ferritin > rules.storageIncreaseAbove) {
      if (inflammationStatus === 'present') {
        return createStorageIronAtom(
          'indeterminate',
          '貯蔵鉄：判定不能（フェリチン ' + ferritinText + 'と高値ですが、炎症の影響があるため貯蔵鉄増加とは判定しません）',
          selected.key,
          rules.storageIncreaseAbove
        );
      }
      if (inflammationStatus !== 'absent') {
        return createStorageIronAtom(
          'indeterminate',
          '貯蔵鉄：判定保留（フェリチン ' + ferritinText + 'と高値ですが、炎症の有無が未選択です）',
          selected.key,
          rules.storageIncreaseAbove
        );
      }
      return createStorageIronAtom(
        'increased',
        '貯蔵鉄：増加（フェリチン ' + ferritinText + '、300 ng/mL超。フェリチン単独では鉄過剰とは判定しません）',
        selected.key,
        rules.storageIncreaseAbove
      );
    }

    var threshold = selected.definition.deficiencyBelow;
    var finding = classifyByRange(ferritin, [
      { max: threshold, classification: 'deficient' },
      { min: threshold, classification: 'replete' }
    ]);
    if (!finding) return null;
    if (finding.classification === 'deficient') {
      return createStorageIronAtom(
        'deficient',
        '貯蔵鉄：欠乏（フェリチン ' + ferritinText + '。' + selected.definition.description + 'の基準で' + threshold + ' ng/mL未満）',
        selected.key,
        threshold
      );
    }
    return createStorageIronAtom(
      'replete',
      '貯蔵鉄：充足（フェリチン ' + ferritinText + '。' + selected.definition.description + 'の基準を満たします）',
      selected.key,
      threshold
    );
  }

  function buildCirculatingIronAtom(tsat) {
    if (!isNumber(tsat)) return null;
    var evidenceRules = global.MedcalcAnemiaEvidenceRules || {};
    var rules = evidenceRules.ironStatus || {};
    var finding = classifyByRange(tsat, rules.circulatingIronRanges || []);
    if (!finding) return null;
    var atom = createEvidenceAtom('tsat_status', finding);
    atom.target = 'IRON_STATUS';
    atom.classification = finding.classification;
    var displayByClassification = {
      low: { label: '低値', criterion: '20％未満' },
      normal: { label: '通常', criterion: '20％以上45％未満' },
      high: { label: '高値', criterion: '45％以上' }
    };
    var display = displayByClassification[finding.classification];
    if (display) {
      atom.message = '循環鉄利用率：' + display.label + '（TSAT ' + formatMeasuredValue(tsat) + '％、' + display.criterion + '）';
    }
    return atom;
  }

  var IRON_METABOLISM_DECISIONS = {
    deficient: {
      low: { code: 'SYSTEMIC_ABSOLUTE_IRON_DEFICIENCY', label: 'SYSTEMIC_IRON_DEFICIENCY', message: '全身性・絶対的鉄欠乏です（貯蔵鉄欠乏かつ循環鉄利用率低値）' },
      normal: { code: 'STORAGE_IRON_DEFICIENCY_WITH_PRESERVED_AVAILABILITY', label: 'STORAGE_IRON_DEFICIENCY', message: '貯蔵鉄欠乏ですが、循環鉄利用率は保たれています' },
      high: { code: 'DISCORDANT_LOW_STORAGE_HIGH_AVAILABILITY', label: 'DISCORDANT_IRON_STATUS', message: '不自然な鉄状態です（貯蔵鉄欠乏かつ循環鉄利用率高値）。鉄剤投与直後やトランスフェリン低下などを確認してください' }
    },
    replete: {
      low: { code: 'IRON_RESTRICTED_ERYTHROPOIESIS', label: 'IRON_RESTRICTED_ERYTHROPOIESIS', message: '鉄利用制限／iron-restricted erythropoiesisパターンです（貯蔵鉄充足かつ循環鉄利用率低値）' },
      normal: { code: 'IRON_REPLETE', label: 'IRON_REPLETE', message: '鉄充足状態です（貯蔵鉄充足かつ循環鉄利用率通常）' },
      high: { code: 'HIGH_CIRCULATING_IRON_AVAILABILITY', label: 'IRON_OVERLOAD_SUSPECTED', message: '循環鉄利用率高値で、鉄過剰が疑われます' }
    },
    increased: {
      low: { code: 'IRON_RESTRICTED_ERYTHROPOIESIS_WITH_INCREASED_STORAGE', label: 'IRON_RESTRICTED_ERYTHROPOIESIS', message: '鉄利用制限／iron-restricted erythropoiesisパターンです（貯蔵鉄増加かつ循環鉄利用率低値）' },
      normal: { code: 'INCREASED_IRON_STORAGE', label: 'INCREASED_IRON_STORAGE', message: '貯蔵鉄増加を認めますが、循環鉄利用率は通常です' },
      high: { code: 'IRON_OVERLOAD', label: 'IRON_OVERLOAD', message: '鉄過剰です（フェリチン300 ng/mL超かつTSAT 45％以上）' }
    }
  };

  function buildIronMetabolismAtom(storageAtom, circulatingAtom, esaTherapy) {
    if (!storageAtom || !circulatingAtom) return null;
    var contextPrefix = esaTherapy === 'yes' ? 'ESA/HIF-PH阻害薬投与下では、' : '';
    if (storageAtom.classification === 'indeterminate') {
      return {
        target: 'IRON_STATUS',
        code: 'IRON_METABOLISM_INDETERMINATE',
        direction: 'modifier',
        weight: 0,
        confidence: 'weak',
        source: 'iron_metabolism',
        classification: 'indeterminate',
        message: contextPrefix + '鉄代謝判定不能：貯蔵鉄の中間判定を確定できません'
      };
    }
    var decision = IRON_METABOLISM_DECISIONS[storageAtom.classification] &&
      IRON_METABOLISM_DECISIONS[storageAtom.classification][circulatingAtom.classification];
    if (!decision) return null;
    return {
      target: 'IRON_STATUS',
      code: decision.code,
      direction: 'modifier',
      weight: 0,
      confidence: 'moderate',
      source: 'iron_metabolism',
      classification: decision.label,
      message: contextPrefix + decision.message
    };
  }

  function buildIronStatusEvidence(values, input, inflammationStatus) {
    var storageAtom = buildStorageIronAtom(values.ferritin, input.gfrStage, input.esaTherapy, inflammationStatus);
    var circulatingAtom = buildCirculatingIronAtom(values.tsat);
    var metabolismAtom = buildIronMetabolismAtom(storageAtom, circulatingAtom, input.esaTherapy);
    var atoms = [];
    if (storageAtom) atoms.push(storageAtom);
    if (circulatingAtom) atoms.push(circulatingAtom);
    if (metabolismAtom) atoms.push(metabolismAtom);
    return {
      atoms: atoms,
      storageAtom: storageAtom,
      circulatingAtom: circulatingAtom,
      metabolismAtom: metabolismAtom
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
    var built = buildEvidenceAtoms(values, input.sex, hb, input.inflammationStatus);
    var score = aggregateEvidence(built.atoms, values, built.contextCodes);
    var decision = decideIda(score, built.atoms, built.contextCodes);
    var ironStatus = buildIronStatusEvidence(values, input, built.inflammationStatus);
    if (ironStatus.storageAtom) built.classifications.storage_iron = ironStatus.storageAtom.classification;
    if (ironStatus.circulatingAtom) built.classifications.circulating_iron = ironStatus.circulatingAtom.classification;
    if (ironStatus.metabolismAtom) built.classifications.iron_metabolism = ironStatus.metabolismAtom.classification;
    var messages = [];

    if (decision) messages.push(decision.message);
    if (ironStatus.metabolismAtom) messages.push(ironStatus.metabolismAtom.message);
    return {
      messages: messages,
      evidenceAtoms: built.atoms,
      ironStatusEvidenceAtoms: ironStatus.atoms,
      diseaseScore: score,
      idaDecision: decision,
      ironStatusDecision: ironStatus.metabolismAtom,
      classifications: built.classifications,
      clinicalContext: {
        anemiaStatus: built.classifications.hemoglobin || 'unknown',
        inflammationStatus: built.inflammationStatus,
        gfrStage: input.gfrStage || 'unknown',
        esaTherapy: input.esaTherapy || 'unknown'
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
