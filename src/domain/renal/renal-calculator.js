(function (global) {
  'use strict';

  function calculateRenalDomain(input) {
    var age = input.age;
    var weight = input.weight;
    var height = input.height;
    var scr = input.scr;
    var bun = input.bun;
    var cys = input.cys;
    var na = input.na;
    var k = input.k;
    var ua = input.ua;
    var ucr = input.ucr;
    var una = input.una;
    var uk = input.uk;
    var uua = input.uua;
    var uun = input.uun;
    var gender = input.gender;
    var evalMode = input.evalMode || 'ckd_eval';

    var messages = [];

    // BMI 計算と体型判定
    var bmi = null;
    var bodyType = null;
    if (height && weight) {
      bmi = weight / ((height / 100) * (height / 100));
      bodyType = bmi < 18.5 ? 'lean' : (bmi < 25 ? 'normal' : 'obese');
    }

    var bsa = (height && weight)
      ? 0.007184 * Math.pow(height, 0.725) * Math.pow(weight, 0.425)
      : null;

    // 計算結果を個別に格納
    var calcResults = {
      standardEgfrcr: null,
      gStage: null,
      individualEgfrcr: null,
      eccr: null,
      eccrBsa: null,
      egfrcys: null,
      individualEgfrcys: null,
      feun: null,
      fena: null,
      fek: null,
      feua: null,
      naKRatio: null,
      saltEstimate: null,
      kEstimate: null
    };

    // eGFRcr 関連の計算
    if (age && scr && gender) {
      var sexFactor = (gender === 'female') ? 0.739 : 1;
      var egfrcr = 194 * Math.pow(scr, -1.094) * Math.pow(age, -0.287) * sexFactor;

      var gStage =
        egfrcr >= 90 ? 'G1: 正常または高値' :
        egfrcr >= 60 ? 'G2: 軽度低下' :
        egfrcr >= 45 ? 'G3a: 軽度〜中等度低下' :
        egfrcr >= 30 ? 'G3b: 中等度〜高度低下' :
        egfrcr >= 15 ? 'G4: 高度低下' :
        'G5: 末期腎不全';

      calcResults.standardEgfrcr = egfrcr;
      calcResults.gStage = gStage;

      if (bsa) {
        calcResults.individualEgfrcr = egfrcr * (bsa / 1.73);
      }

      if (weight) {
        var eccr = ((140 - age) * weight * ((gender === 'female') ? 0.85 : 1)) / (72 * scr);
        calcResults.eccr = eccr;

        if (bsa) {
          calcResults.eccrBsa = eccr * (1.73 / bsa);
        }
      }
    }

    // eGFRcys 関連の計算
    if (age && cys && gender) {
      var sexFactor2 = (gender === 'female') ? 0.82 : 1;
      var egfrcys = 104 * Math.pow(cys / sexFactor2, -1.019) * Math.pow(age, -0.996);
      calcResults.egfrcys = egfrcys;

      if (bsa) {
        calcResults.individualEgfrcys = egfrcys * (bsa / 1.73);
      }
    }

    // FE/比率関連の計算
    if (bun && scr && ucr && uun) {
      var feun = (uun * scr) / (bun * ucr) * 100;
      calcResults.feun = feun;
    }

    if (na && scr && ucr && una) {
      var fena = (una * scr) / (na * ucr) * 100;
      calcResults.fena = fena;
    }

    if (k && scr && ucr && uk) {
      var fek = (uk * scr) / (k * ucr) * 100;
      calcResults.fek = fek;
    }

    if (ua && scr && ucr && uua) {
      var feua = (uua * scr) / (ua * ucr) * 100;
      calcResults.feua = feua;
    }

    if (una && uk) {
      calcResults.naKRatio = una / uk;
    }

    if (una && ucr) {
      var naExcretion = 21.98 * Math.pow(una / ucr, 0.392);
      calcResults.saltEstimate = naExcretion * 58.5 / 1000;
    }

    if (uk && ucr) {
      var kExcretion = 10.15 * Math.pow(uk / ucr, 0.517);
      calcResults.kEstimate = kExcretion;
    }

    // ===== モード別メッセージフィルタリング =====
    if (evalMode === 'ckd_eval') {
      // CKD評価モード：標準化eGFRのみ表示
      if (calcResults.standardEgfrcr !== null) {
        messages.push('標準化eGFRcr: ' + calcResults.standardEgfrcr.toFixed(1) + ' mL/min/1.73m² ⇒ ' + calcResults.gStage);
      }
    } else if (evalMode === 'drug_dose') {
      // 薬剤投与モード
      if (bodyType === 'lean') {
        // やせ型
        if (calcResults.standardEgfrcr !== null) {
          messages.push('標準化eGFRcr: ' + calcResults.standardEgfrcr.toFixed(1) + ' mL/min/1.73m² ⇒ ' + calcResults.gStage);
        }
        if (calcResults.individualEgfrcr !== null) {
          messages.push('個別化eGFRcr: ' + calcResults.individualEgfrcr.toFixed(1) + ' mL/min');
        }
        if (calcResults.eccr !== null) {
          messages.push('eCCr: ' + calcResults.eccr.toFixed(1) + ' mL/min');
        }
        if (calcResults.egfrcys === null) {
          messages.push('⇒ 低筋肉量で過大評価しやすいのでCys測定推奨');
        }
      } else if (bodyType === 'normal') {
        // 標準体型
        if (calcResults.individualEgfrcr !== null) {
          messages.push('個別化eGFRcr: ' + calcResults.individualEgfrcr.toFixed(1) + ' mL/min');
        }
        if (calcResults.eccr !== null) {
          messages.push('eCCr: ' + calcResults.eccr.toFixed(1) + ' mL/min');
        }
      } else if (bodyType === 'obese') {
        // 肥満型
        if (calcResults.individualEgfrcr !== null) {
          messages.push('個別化eGFRcr: ' + calcResults.individualEgfrcr.toFixed(1) + ' mL/min');
        }
        
        // 理想体重でのeCCrを計算
        if (age && scr && height && gender) {
          var idealWeight = (gender === 'female') 
            ? (height - 100) * 0.85 
            : (height - 100) * 0.9;
          var eccrIdeal = ((140 - age) * idealWeight * ((gender === 'female') ? 0.85 : 1)) / (72 * scr);
          messages.push('eCCr（理想体重）: ' + eccrIdeal.toFixed(1) + ' mL/min');
          messages.push('⇒ 実体重で過大評価しやすいため理想体重で算出');
        }
      }
    }

    // 電解質・その他指標は常に表示（モードに関わらず）
    if (calcResults.feun !== null) {
      messages.push('FEUN: ' + calcResults.feun.toFixed(2) + ' %');
      if (scr > 1.2) {
        var noteFeun =
          calcResults.feun > 50 ? '尿素再吸収破綻、腎性：急性尿細管壊死' :
          calcResults.feun < 35 ? '抗利尿状態、腎前性を示唆' :
          '';
        if (noteFeun) messages.push('⇒ ' + noteFeun);
      }
    }

    if (calcResults.fena !== null) {
      messages.push('FENa: ' + calcResults.fena.toFixed(2) + ' %');
      if (scr > 1.2) {
        var noteFena =
          calcResults.fena > 2 ? '腎性：急性尿細管壊死' :
          calcResults.fena < 1 ? '腎前性を示唆' :
          '';
        if (noteFena) messages.push('⇒ ' + noteFena);
      }
    }

    if (calcResults.fek !== null) {
      messages.push('FEK: ' + calcResults.fek.toFixed(2) + ' %');
    }

    if (calcResults.feua !== null) {
      var noteFeua =
        calcResults.feua < 10 ? '尿酸排泄低下。あるいは腎前性' :
        calcResults.feua <= 15 ? '境界領域' :
        '尿酸産生過剰型';
      messages.push('FEUa: ' + calcResults.feua.toFixed(2) + ' % ⇒ ' + noteFeua);
    }

    if (calcResults.naKRatio !== null) {
      var ratio = calcResults.naKRatio;
      var status = ratio < 2 ? '理想的' : ratio < 4 ? '目標内' : '目標未達成';
      messages.push('尿中Na/K比: ' + ratio.toFixed(2) + '（' + status + '）');
    }

    if (calcResults.saltEstimate !== null) {
      messages.push('推定食塩摂取量: ' + calcResults.saltEstimate.toFixed(1) + ' g/day（田中法）');
    }

    if (calcResults.kEstimate !== null) {
      messages.push('推定K摂取量: ' + calcResults.kEstimate.toFixed(1) + ' mEq/day（田中法）');
    }

    return { messages: messages };
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.calculateRenal = calculateRenalDomain;
})(window);
