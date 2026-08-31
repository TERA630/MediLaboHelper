(function (global) {
  'use strict';

  // IDA_rangetable.json と同じ臨床定義。静的HTMLから同期的に利用するためJSとして公開する。
  global.MedcalcAnemiaRangeTable = {
    hemoglobin: { unit: 'g/dL', ranges: [
      { sex: 'male', max: 13, classification: 'anemia', code: 'ANEMIA_PRESENT', direction: 'support', weight: 0, confidence: 'strong', role: 'required_context', target: 'ANEMIA', message: '男性でヘモグロビン13 g/dL未満のため、貧血を認めます' },
      { sex: 'female', max: 12, classification: 'anemia', code: 'ANEMIA_PRESENT', direction: 'support', weight: 0, confidence: 'strong', role: 'required_context', target: 'ANEMIA', message: '女性でヘモグロビン12 g/dL未満のため、貧血を認めます' },
      { sex: 'male', min: 13, classification: 'not_anemic', code: 'ANEMIA_NOT_PRESENT', direction: 'against', weight: 0, confidence: 'strong', role: 'required_context', target: 'ANEMIA', message: '男性でヘモグロビン13 g/dL以上のため、貧血の基準を満たしません' },
      { sex: 'female', min: 12, classification: 'not_anemic', code: 'ANEMIA_NOT_PRESENT', direction: 'against', weight: 0, confidence: 'strong', role: 'required_context', target: 'ANEMIA', message: '女性でヘモグロビン12 g/dL以上のため、貧血の基準を満たしません' }
    ] },
    ferritin: { unit: 'ng/mL', ranges: [
      { max: 15, classification: 'very_low_lt15', code: 'FERRITIN_LT15', direction: 'support', weight: 4, confidence: 'strong', diagnosticRole: 'standalone_when_anemia_present', requiresForIda: ['ANEMIA_PRESENT'], requiresCorroboration: false, diagnosticAccuracy: { sensitivity: 0.59, specificity: 0.99 }, guideline: 'AGA', message: 'フェリチン15 ng/mL未満です。貧血があれば鉄欠乏性貧血として診断的です（感度59％、特異度99％）' },
      { min: 15, max: 30, classification: 'low_15_to_lt30', code: 'FERRITIN_LT30', direction: 'support', weight: 3, confidence: 'strong', diagnosticRole: 'corroborative', requiresForIda: ['ANEMIA_PRESENT', 'OTHER_IRON_METABOLISM_SUPPORT'], requiresCorroboration: true, message: 'フェリチン30 ng/mL未満であり、鉄貯蔵低下が強く示唆されます' },
      { min: 30, max: 45, classification: 'aga_low_30_to_lt45', code: 'FERRITIN_LT45_AGA', direction: 'support', weight: 2, confidence: 'strong', diagnosticRole: 'corroborative', requiresForIda: ['ANEMIA_PRESENT', 'OTHER_IRON_METABOLISM_SUPPORT'], requiresCorroboration: true, diagnosticAccuracy: { sensitivity: 0.85, specificity: 0.92 }, guideline: 'AGA', message: 'フェリチン45 ng/mL未満は、貧血患者における鉄欠乏の診断的カットオフです（感度85％、特異度92％）' },
      { min: 45, max: 70, classification: 'inflammation_dependent_45_to_lt70', code: 'FERRITIN_45_TO_LT70', direction: 'neutral', weight: 0, confidence: 'weak', diagnosticRole: 'context_dependent', requiresCorroboration: true, message: 'フェリチン45～70 ng/mLです。フェリチン単独では鉄欠乏を判定できません' },
      { min: 70, classification: 'not_low_ge70', code: 'FERRITIN_NOT_LOW', direction: 'neutral', weight: 0, confidence: 'weak', diagnosticRole: 'not_diagnostic', requiresCorroboration: true, message: 'フェリチン70 ng/mL以上です。鉄欠乏の評価には他の鉄代謝所見を確認してください' }
    ] },
    tsat: { unit: '%', ranges: [
      { max: 10, classification: 'critical_low', code: 'TSAT_VERY_LOW', direction: 'support', weight: 3, confidence: 'strong', message: '鉄飽和率著明低値は鉄欠乏を強く支持します' },
      { min: 10, max: 20, classification: 'low', code: 'TSAT_LOW', direction: 'support', weight: 2, confidence: 'moderate', message: '鉄飽和率低値は鉄欠乏を支持します' },
      { min: 20, max: 45, classification: 'normal', code: 'TSAT_NORMAL', direction: 'against', weight: 1, confidence: 'weak', message: '鉄飽和率は正常範囲です' },
      { min: 45, classification: 'high', code: 'TSAT_HIGH', direction: 'against', weight: 2, confidence: 'moderate', message: '鉄飽和率高値は鉄過剰を示唆し、鉄欠乏を否定します' }
    ] },
    tibc: { unit: 'µg/dL', ranges: [
      { max: 250, classification: 'low', code: 'TIBC_LOW', direction: 'against', weight: 1, confidence: 'weak', message: 'TIBC低値は鉄欠乏より炎症性貧血を示唆します' },
      { min: 250, max: 360, classification: 'normal', code: 'TIBC_NORMAL', direction: 'neutral', weight: 0, confidence: 'weak', message: 'TIBCは正常範囲です' },
      { min: 360, classification: 'high', code: 'TIBC_HIGH', direction: 'support', weight: 2, confidence: 'moderate', message: 'TIBC高値は鉄欠乏を支持します' }
    ] },
    uibc: { unit: 'µg/dL', ranges: [
      { max: 300, classification: 'normal_low', code: 'UIBC_NORMAL', direction: 'neutral', weight: 0, confidence: 'weak', message: 'UIBCは参考所見です' },
      { min: 300, classification: 'high', code: 'UIBC_HIGH', direction: 'support', weight: 1, confidence: 'weak', message: 'UIBC高値は鉄欠乏を支持します' }
    ] },
    mcv: { unit: 'fL', ranges: [
      { max: 70, classification: 'critical_low', code: 'MCV_VERY_LOW', direction: 'support', weight: 2, confidence: 'moderate', message: '著明な小球性はサラセミアとの鑑別を要しますが鉄欠乏を支持します' },
      { min: 70, max: 80, classification: 'low', code: 'MCV_LOW', direction: 'support', weight: 2, confidence: 'moderate', message: '小球性は鉄欠乏性貧血を支持します' },
      { min: 80, max: 100, classification: 'normal', code: 'MCV_NORMAL', direction: 'neutral', weight: 0, confidence: 'weak', message: 'MCVは正常範囲です（初期IDAでは正球性のこともあります）' },
      { min: 100, classification: 'high', code: 'MCV_HIGH', direction: 'against', weight: 2, confidence: 'moderate', message: '大球性は鉄欠乏より巨赤芽球性貧血等を示唆します' }
    ] },
    crp: { unit: 'mg/dL', role: 'modifier', ranges: [
      { max: 0.5, classification: 'normal', code: 'CRP_NORMAL', direction: 'modifier', weight: 0, confidence: 'strong', message: '炎症なし。フェリチン値はそのまま解釈可能です' },
      { min: 0.5, classification: 'high', code: 'CRP_HIGH', direction: 'modifier', weight: 0, confidence: 'strong', message: '炎症存在。フェリチン高値は偽性の可能性があり、カットオフ引き上げを要します' }
    ] },
    rdw: { unit: '%', ranges: [
      { max: 15, classification: 'normal', code: 'RDW_NORMAL', direction: 'neutral', weight: 0, confidence: 'weak', message: 'RDWは正常範囲です' },
      { min: 15, classification: 'high', code: 'RDW_HIGH', direction: 'support', weight: 1, confidence: 'weak', message: 'RDW高値は鉄欠乏を支持し、サラセミアとの鑑別に有用です' }
    ] },
    stfr_index: { unit: 'ratio', ranges: [
      { max: 1, classification: 'low', code: 'STFR_INDEX_LOW', direction: 'against', weight: 2, confidence: 'moderate', message: 'sTfR index低値は炎症性貧血を示唆します' },
      { min: 2, classification: 'high', code: 'STFR_INDEX_HIGH', direction: 'support', weight: 3, confidence: 'strong', message: 'sTfR/log-ferritin index高値は炎症併存下でも鉄欠乏を強く支持します' }
    ] }
  };

  global.MedcalcAnemiaEvidenceRules = {
    ferritinWithInflammation: {
      rangeClassification: 'inflammation_dependent_45_to_lt70',
      requiredContext: 'INFLAMMATION_PRESENT',
      atom: {
        target: 'IRON_DEFICIENCY',
        code: 'FERRITIN_LT70_WITH_INFLAMMATION',
        direction: 'support',
        weight: 2,
        confidence: 'moderate',
        evidenceCertainty: 'low',
        evidenceGroup: 'iron_metabolism',
        diagnosticRole: 'corroborative',
        requiresForIda: ['ANEMIA_PRESENT', 'INFLAMMATION_PRESENT', 'OTHER_IRON_METABOLISM_SUPPORT'],
        requiresCorroboration: true,
        guideline: 'WHO',
        message: '炎症がありフェリチン70 ng/mL未満です。炎症によるフェリチン上昇を考慮しても鉄欠乏を示唆します'
      }
    },
    ferritinOverload: [
      { sex: 'female', requiredContext: 'INFLAMMATION_ABSENT', operator: 'gt', value: 200 },
      { sex: 'male', requiredContext: 'INFLAMMATION_ABSENT', operator: 'gt', value: 300 }
    ],
    ferritinOverloadAtom: {
      target: 'IRON_OVERLOAD',
      code: 'FERRITIN_HIGH_FOR_SEX',
      direction: 'support',
      weight: 2,
      confidence: 'moderate',
      evidenceGroup: 'iron_metabolism',
      diagnosticRole: 'screening_alert',
      requiresCorroboration: true,
      recommendedCorroboration: ['TSAT_HIGH'],
      guideline: 'EASL',
      message: '炎症を認めない状態でフェリチンが性別基準を超えています。鉄過剰を疑い、TSATなどを確認してください'
    }
  };
})(window);
