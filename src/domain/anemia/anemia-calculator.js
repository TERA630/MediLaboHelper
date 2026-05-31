(function (global) {
  'use strict';

  function calculateAnemiaDomain(input) {
      var hb = input.hb;
      var hct = input.hct;
      var rbc = input.rbc; // 万/mm3
      var mcvInput = input.mcvInput;
      var retic = input.retic; // ‰
      var ferritin = input.ferritin;
      var tibc = input.tibc;
      var uibc = input.uibc;
      var serumIron = input.serumIron;
      var tsatInput = input.tsatInput;
      var epo = input.epo;
      var gfrStage = input.gfrStage;   // g1g2 / g3a / g3b / g4g5 / dialysis
      var esaTherapy = input.esaTherapy; // yes / no

      var messages = [];

      // UIBC + Fe から TIBC 補完
      if (tibc === null && uibc !== null && serumIron !== null) {
        tibc = uibc + serumIron;
      }

      // MCV計算
      // RBCは 万/mm3 = 万/μL として扱う
      // MCV(fL) = Hct(%) * 10 / RBC(10^6/μL)
      // RBC(10^6/μL) = rbc / 100
      // よって MCV = Hct * 1000 / rbc
      var mcvCalc = null;
      if (hct !== null && rbc !== null && rbc > 0) {
        mcvCalc = (hct * 1000) / rbc;
      }

      var mcvUsed = null;
      var mcvSource = '';
      if (mcvInput !== null) {
        mcvUsed = mcvInput;
        mcvSource = '入力値';
      } else if (mcvCalc !== null) {
        mcvUsed = mcvCalc;
        mcvSource = '自動算出';
      }

      // TSAT計算
      var tsatCalc = null;
      if (tibc !== null && serumIron !== null && tibc > 0) {
        tsatCalc = (serumIron / tibc) * 100;
      }

      var tsatUsed = null;
      var tsatSource = '';
      if (tsatInput !== null) {
        tsatUsed = tsatInput;
        tsatSource = '入力値';
      } else if (tsatCalc !== null) {
        tsatUsed = tsatCalc;
        tsatSource = '自動算出';
      }

      // 網状球絶対数
      // RBC = rbc * 10000 /μL
      // Retic fraction = retic / 1000
      // Absolute retic = rbc * 10000 * retic / 1000 = rbc * retic * 10
      var reticAbs = null;
      if (rbc !== null && retic !== null) {
        reticAbs = rbc * retic * 10; // /μL
      }

      // RPI
      // Retic(‰) → %
      var rpi = null;
      if (retic !== null && hct !== null) {
        var reticPercent = retic / 10;
        var maturation = 1.0;

        if (hct >= 36) {
          maturation = 1.0;
        } else if (hct >= 26) {
          maturation = 1.5;
        } else if (hct >= 16) {
          maturation = 2.0;
        } else {
          maturation = 2.5;
        }

        rpi = (reticPercent * (hct / 45)) / maturation;
      }

      function getGfrLabel(val) {
        if (val === 'g1g2') return 'G1,G2：60以上';
        if (val === 'g3a') return 'G3a：45～59';
        if (val === 'g3b') return 'G3b：30～44';
        if (val === 'g4g5') return 'G4,G5：30未満';
        if (val === 'dialysis') return '透析中';
        return '';
      }

      function getEsaLabel(val) {
        if (val === 'yes') return 'あり';
        if (val === 'no') return 'なし';
        return '';
      }

      // 1行サマリー判定
      var ironSummary = '';
      var epoSummary = '';
      var reticSummary = '';

      // 鉄判定
      if (ferritin !== null || tsatUsed !== null) {
        if (esaTherapy === 'yes' && gfrStage === 'dialysis') {
          if (ferritin !== null) {
            if (ferritin > 500) {
              ironSummary = '鉄過剰あり';
            } else if (ferritin >= 300) {
              ironSummary = '鉄過剰なし';
            } else if (ferritin >= 100) {
              ironSummary = '鉄欠乏なし・鉄過剰なし';
            } else if (tsatUsed !== null && tsatUsed < 20) {
              ironSummary = '鉄欠乏あり';
            } else {
              ironSummary = '鉄欠乏なし・鉄過剰なし';
            }
          }
        } else if (esaTherapy === 'yes' && gfrStage && gfrStage !== 'dialysis') {
          if (ferritin !== null) {
            if (ferritin > 300) {
              ironSummary = '鉄過剰あり';
            } else if (ferritin >= 100) {
              ironSummary = '鉄過剰なし';
            } else if (ferritin >= 50) {
              ironSummary = '鉄欠乏なし・鉄過剰なし';
            } else if (tsatUsed !== null && tsatUsed < 20) {
              ironSummary = '鉄欠乏あり';
            } else {
              ironSummary = '鉄欠乏なし・鉄過剰なし';
            }
          }
        } else {
          if (ferritin !== null && tsatUsed !== null) {
            if (ferritin < 30 && tsatUsed < 20) {
              ironSummary = '鉄欠乏あり';
            } else {
              ironSummary = '鉄欠乏なし・鉄過剰なし';
            }
          } else if (ferritin !== null) {
            ironSummary = '鉄欠乏/鉄過剰は判定保留';
          } else if (tsatUsed !== null) {
            ironSummary = '鉄欠乏/鉄過剰は判定保留';
          }
        }
      }

      // EPO判定
      if (hb !== null && epo !== null) {
        if (hb >= 10 && hb <= 11) {
          if (epo < 20) {
            epoSummary = 'エリスロポエチン低反応';
          } else {
            epoSummary = 'エリスロポエチン正常反応';
          }
        } else if (hb >= 8 && hb < 10) {
          if (epo < 30) {
            epoSummary = 'エリスロポエチン低反応';
          } else {
            epoSummary = 'エリスロポエチン正常反応';
          }
        } else if (hb < 8) {
          if (epo < 80) {
            epoSummary = 'エリスロポエチン低反応';
          } else {
            epoSummary = 'エリスロポエチン正常反応';
          }
        }
      }

      // 網状赤血球判定
      // RPI < 2 低反応
      // 2～3 正常反応
      // >3 亢進
      if (rpi !== null) {
        if (rpi < 2) {
          reticSummary = '網状赤血球低反応';
        } else if (rpi > 3) {
          reticSummary = '網状赤血球亢進';
        } else {
          reticSummary = '網状赤血球正常反応';
        }
      }

      // 入力値表示
      if (hb !== null) messages.push('Hb: ' + hb.toFixed(1) + ' g/dL');
      if (hct !== null) messages.push('Ht: ' + hct.toFixed(1) + ' %');
      if (rbc !== null) messages.push('RBC: ' + rbc.toFixed(1) + ' 万/mm3');
      if (mcvCalc !== null) messages.push('MCV（自動算出）: ' + mcvCalc.toFixed(1) + ' fL');
      if (mcvUsed !== null) messages.push('MCV（判定使用）: ' + mcvUsed.toFixed(1) + ' fL（' + mcvSource + '）');

      if (serumIron !== null) messages.push('血清鉄: ' + serumIron.toFixed(0) + ' μg/dL');
      if (uibc !== null) messages.push('UIBC: ' + uibc.toFixed(0) + ' μg/dL');
      if (tibc !== null) messages.push('TIBC: ' + tibc.toFixed(0) + ' μg/dL');
      if (tsatUsed !== null) messages.push('鉄飽和率: ' + tsatUsed.toFixed(1) + ' %（' + tsatSource + '）');
      if (ferritin !== null) messages.push('フェリチン: ' + ferritin.toFixed(1) + ' ng/mL');
      if (epo !== null) messages.push('EPO: ' + epo.toFixed(1) + ' mIU/mL');
      if (gfrStage) messages.push('GFR区分: ' + getGfrLabel(gfrStage));
      if (esaTherapy) messages.push('ESA製剤 / HIF-PH阻害剤投与中: ' + getEsaLabel(esaTherapy));
      if (retic !== null) messages.push('網状球: ' + retic.toFixed(1) + ' ‰');
      if (reticAbs !== null) messages.push('網状球絶対数: ' + reticAbs.toFixed(0) + ' /μL');
      if (rpi !== null) messages.push('RPI: ' + rpi.toFixed(2));

      // 1行サマリー
      if (ironSummary || epoSummary || reticSummary) {
        messages.push('---');
        if (ironSummary) messages.push('<b>鉄評価:</b> ' + ironSummary);
        if (epoSummary) messages.push('<b>EPO反応:</b> ' + epoSummary);
        if (reticSummary) messages.push('<b>網状赤血球反応:</b> ' + reticSummary);
      }

      // MCV分類
      if (mcvUsed !== null) {
        messages.push('---');

        if (mcvUsed < 80) {
          messages.push('<b>小球性貧血</b>');
        } else if (mcvUsed > 100) {
          messages.push('<b>大球性貧血</b>');
          messages.push('⇒ B12欠乏、葉酸欠乏、MDS、肝障害、甲状腺機能低下、溶血後などを鑑別');
        } else {
          messages.push('<b>正球性貧血</b>');
          messages.push('⇒ 腎性貧血、炎症性貧血、急性出血、溶血、骨髄不全などを鑑別');
        }
      }

      // 詳細鉄評価
      if (ferritin !== null || tsatUsed !== null) {
        messages.push('---');

        if (esaTherapy === 'no') {
          if (ferritin !== null && tsatUsed !== null && ferritin < 30 && tsatUsed < 20) {
            messages.push('鉄欠乏を示唆');
          }
        }

        if (esaTherapy === 'yes' && gfrStage === 'dialysis') {
          if (ferritin !== null) {
            if (ferritin > 500) {
              messages.push('鉄過剰を示唆');
            } else if (ferritin >= 300) {
              messages.push('フェリチンの目標値を超過している');
            } else if (ferritin >= 100) {
              messages.push('フェリチンは目標範囲内');
            } else if (tsatUsed !== null && tsatUsed < 20) {
              messages.push('鉄欠乏示唆');
            }
          }
        }

        if (esaTherapy === 'yes' && gfrStage && gfrStage !== 'dialysis') {
          if (ferritin !== null) {
            if (ferritin > 300) {
              messages.push('鉄過剰を示唆');
            } else if (ferritin >= 100) {
              messages.push('フェリチンの目標値を超過');
            } else if (ferritin >= 50) {
              messages.push('フェリチンは目標範囲内');
            } else if (tsatUsed !== null && tsatUsed < 20) {
              messages.push('鉄欠乏示唆');
            }
          }
        }

        if (!esaTherapy && ferritin !== null && tsatUsed !== null) {
          if (ferritin < 30 && tsatUsed < 20) {
            messages.push('鉄欠乏を示唆');
          }
        }
      }

      // EPO詳細
      if (hb !== null && epo !== null) {
        messages.push('---');

        if (hb >= 10 && hb <= 11) {
          if (epo < 20) {
            messages.push('EPOは相対的低値を示唆（Hb 10～11 に対して低反応）');
          } else if (epo <= 30) {
            messages.push('EPOは境界域（Hb 10～11 に対して）');
          } else {
            messages.push('EPOは適切反応（Hb 10～11 に対して）');
          }
        } else if (hb >= 8 && hb < 10) {
          if (epo < 30) {
            messages.push('EPOは相対的低値を示唆（Hb 8～10 に対して低反応）');
          } else if (epo <= 100) {
            messages.push('EPOは境界域（Hb 8～10 に対して）');
          } else {
            messages.push('EPOは適切反応（Hb 8～10 に対して）');
          }
        } else if (hb < 8) {
          if (epo < 80) {
            messages.push('EPOは相対的低値を示唆（Hb 8未満 に対して低反応）');
          } else if (epo <= 300) {
            messages.push('EPOは境界域（Hb 8未満 に対して）');
          } else {
            messages.push('EPOは適切反応（Hb 8未満 に対して）');
          }
        }
      }

      // 腎性貧血の補助コメント
      if (gfrStage === 'g3a' || gfrStage === 'g3b' || gfrStage === 'g4g5' || gfrStage === 'dialysis') {
        messages.push('GFR低下あり。腎性貧血の関与を考慮');
      }

      // RPI判定
      if (rpi !== null) {
        messages.push('---');
        if (rpi > 3) {
          messages.push('<b>RPI > 3</b>：網状赤血球反応亢進');
          messages.push('⇒ 出血性貧血、溶血性貧血をより強く鑑別');
        } else if (rpi >= 2) {
          messages.push('<b>RPI 2～3</b>：網状赤血球反応は概ね保たれる');
        } else {
          messages.push('<b>RPI < 2</b>：骨髄反応不十分');
          messages.push('⇒ 造血不良を示唆');
        }
      }

      // 補足
      if (mcvInput !== null && mcvCalc !== null) {
        var diff = Math.abs(mcvInput - mcvCalc);
        if (diff >= 3) {
          messages.push('---');
          messages.push('入力MCVと自動算出MCVに差あり（' + diff.toFixed(1) + ' fL）。検査値の単位・転記を再確認');
        }
      }

      return { messages: messages };
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.calculateAnemia = calculateAnemiaDomain;
})(window);
