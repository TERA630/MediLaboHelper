(function (global) {
  'use strict';

  var DRUG_INFO = {
      DOA: {
        label: 'DOA（ドパミン）',
        unit: 'γ（μg/kg/min）',
        conc_mg_per_ml: 3,          // 150mg/50mL = 3mg/mL
        conc_label: '150mg/50mL（0.3%シリンジ）= 3 mg/mL',
        ranges: [
          { label: '低用量（腎血流域）',   min: 1,   max: 3,   note: '腎・腸管血流増加' },
          { label: '中用量（強心域）',    min: 3,   max: 10,  note: '心収縮力・心拍出量↑' },
          { label: '高用量（血管収縮域）', min: 10,  max: 20,  note: 'α作用優位、末梢血管収縮' }
        ]
      },
      DOB: {
        label: 'DOB（ドブタミン）',
        unit: 'γ（μg/kg/min）',
        conc_mg_per_ml: 3,          // 150mg/50mL = 3mg/mL
        conc_label: '150mg/50mL（0.3%シリンジ）= 3 mg/mL',
        ranges: [
          { label: '標準域', min: 2,  max: 10, note: 'β1刺激、心収縮力↑' },
          { label: '高用量', min: 10, max: 20, note: '頻脈・不整脈に注意' }
        ]
      },
      NAD: {
        label: 'NAD（ノルアドレナリン）',
        unit: 'γ（μg/kg/min）',
        conc_mg_per_ml: 0.06,       // 3mg/50mL = 0.06mg/mL
        conc_label: '3mg/50mL = 0.06 mg/mL',
        ranges: [
          { label: '低用量', min: 0.01, max: 0.1, note: '血圧維持（敗血症性ショックの第1選択）' },
          { label: '高用量', min: 0.1,  max: 1.0, note: '強い血管収縮、虚血に注意' }
        ]
      },
      hANP: {
        label: 'hANP（カルペリチド）',
        unit: 'γ（μg/kg/min）',
        conc_mg_per_ml: 0.06,       // 3mg/50mL = 0.06mg/mL
        conc_label: '3mg/50mL = 0.06 mg/mL',
        ranges: [
          { label: '標準投与', min: 0.0125, max: 0.025, note: '急性心不全。0.025γ固定も多い' }
        ]
      },
      Landiolol: {
        label: 'オノアクト（ランジオロール）',
        unit: 'γ（μg/kg/min）',
        conc_mg_per_ml: 1,          // 50mg/50mL = 1mg/mL
        conc_label: '50mg/50mL = 1 mg/mL',
        ranges: [
          { label: '維持投与', min: 1,  max: 10, note: '心房細動・AFL のレートコントロール' },
          { label: '負荷投与', min: 10, max: 40, note: '短時間の急速投与（1～2分）後に維持へ' }
        ]
      },
      Nifedipine: {
        label: 'ニフェジピン（コアテック）',
        unit: 'γ（μg/kg/min）',
        conc_mg_per_ml: 1,          // 50mg/50mL = 1mg/mL
        conc_label: '50mg/50mL = 1 mg/mL',
        ranges: [
          { label: '標準域', min: 0.3, max: 0.5, note: '高血圧緊急症。0.5γを超えないこと' },
          { label: '最大',   min: 0.5, max: 0.5, note: '上限。急激な血圧低下に注意' }
        ]
      }
  };


  function getGammaDrugInfo(key) {
    return key ? DRUG_INFO[key] : null;
  }

  function listGammaDrugs() {
    return Object.keys(DRUG_INFO).map(function (key) {
      return { key: key, info: DRUG_INFO[key] };
    });
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.GAMMA_DRUG_INFO = DRUG_INFO;
  global.MedcalcDomain.getGammaDrugInfo = getGammaDrugInfo;
  global.MedcalcDomain.listGammaDrugs = listGammaDrugs;
})(window);
