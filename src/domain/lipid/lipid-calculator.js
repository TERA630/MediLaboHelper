(function (global) {
  'use strict';

  function calculateLipidDomain(input) {
    var age = input.age;
    var gender = input.gender; // 'male' | 'female'

    // Lipids
    var ldl = input.ldl;       // 実測LDL-C
    var hdl = input.hdl;
    var tc  = input.tc;
    var tg  = input.tg;

    var nonHdl = (tc !== null && hdl !== null) ? (tc - hdl) : null;

    // Friedewald LDL-C
    var friedewaldLdl = null;
    var friedewaldAvailable = false;
    if (tc !== null && hdl !== null && tg !== null && tg < 400) {
      friedewaldLdl = tc - hdl - (tg / 5);
      friedewaldAvailable = true;
    }

    // 判定用LDL-C：実測優先、なければFriedewald
    var judgeLdl = null;
    var judgeLdlSource = '';
    if (ldl !== null) {
      judgeLdl = ldl;
      judgeLdlSource = '実測LDL-C';
    } else if (friedewaldAvailable) {
      judgeLdl = friedewaldLdl;
      judgeLdlSource = 'Friedewald式推算LDL-C';
    }

    // ASCVD / risk factors
    var cadType = input.cadType; // '' | within1y | multiple | after1y | stable
    var multiVessel = input.multiVessel;
    var atheroStroke = input.atheroStroke;
    var pad = input.pad;

    var dmStatus = input.dmStatus; // normal | igt | dm | dmComp
    var ckdGrade = input.ckdGrade; // g1 | g3 | g4
    var proteinuria = input.proteinuria; // a1 | a2 | a3
    var htGrade = input.htGrade; // normal | elevated | stage1 | stage2 | stage3

    var smoking = input.smoking;
    var familyHistory = input.familyHistory;
    var fh = input.fh;

    var messages = [];
    var decidedBy = '';

    function isDM() { return dmStatus === 'dm' || dmStatus === 'dmComp'; }
    function isDMComp() { return dmStatus === 'dmComp'; }
    function isIGT() { return dmStatus === 'igt'; }
    function hasHTN() { return htGrade && htGrade !== 'normal'; }

    function hasCAD() { return !!cadType; }
    function hasACSAny() { return cadType === 'within1y' || cadType === 'multiple' || cadType === 'after1y'; }
    function hasACSWithin1y() { return cadType === 'within1y'; }
    function hasACSMultiple() { return cadType === 'multiple'; }
    function isACSAfter1yOrStable() { return cadType === 'after1y' || cadType === 'stable'; }

    function hasExtremeFactorForCAD() {
      return !!(fh || isDMComp() || pad || atheroStroke);
    }

    function hasAnyCKDRisk() {
      return (ckdGrade === 'g3' || ckdGrade === 'g4' || (ckdGrade === 'g1' && (proteinuria === 'a2' || proteinuria === 'a3')));
    }

    function hisayamaRisk() {
      // 判定用LDLを使用
      if (!age || !gender || judgeLdl === null || hdl === null) {
        return { ok:false, reason:'久山町計算に年齢/性別/LDL/HDLが必要' };
      }

      var pts = (gender === 'male') ? 7 : 0;

      var sbpPts =
        htGrade === 'normal'   ? 0 :
        htGrade === 'elevated' ? 1 :
        htGrade === 'stage1'   ? 2 :
        htGrade === 'stage2'   ? 3 :
        htGrade === 'stage3'   ? 4 : 0;
      pts += sbpPts;

      if (isIGT()) pts += 1;

      var ldlPts = (judgeLdl < 120) ? 0 : (judgeLdl < 140) ? 1 : (judgeLdl < 160) ? 2 : 3;
      pts += ldlPts;

      var hdlPts = (hdl >= 60) ? 0 : (hdl >= 40) ? 1 : 2;
      pts += hdlPts;

      pts += smoking ? 2 : 0;

      var band = null;
      if (age >= 40 && age <= 49) band = '40-49';
      else if (age >= 50 && age <= 59) band = '50-59';
      else if (age >= 60 && age <= 69) band = '60-69';
      else if (age >= 70 && age <= 79) band = '70-79';
      else return { ok:false, reason:'久山町の年齢範囲は40-79歳（入力: ' + age + '）' };

      var risk = null;
      if (band === '40-49') {
        risk = (pts <= 12) ? 'low' : 'middle';
      } else if (band === '50-59') {
        risk = (pts <= 7) ? 'low' : (pts <= 18) ? 'middle' : 'high';
      } else if (band === '60-69') {
        risk = (pts <= 1) ? 'low' : (pts <= 12) ? 'middle' : 'high';
      } else if (band === '70-79') {
        risk = (pts <= 7) ? 'middle' : 'high';
      }

      return { ok:true, points:pts, band:band, risk:risk };
    }

    var targetLDL = null;
    var categoryLabel = '';

    // 55 mg/dL未満（極高リスク）
    if (hasACSWithin1y()) {
      targetLDL = 55;
      categoryLabel = '極高リスク（55）';
      decidedBy = 'ACS発症1年以内';
    } else if (hasACSMultiple()) {
      targetLDL = 55;
      categoryLabel = '極高リスク（55）';
      decidedBy = '2回以上のACS既往';
    } else if (hasACSAny() && multiVessel) {
      targetLDL = 55;
      categoryLabel = '極高リスク（55）';
      decidedBy = 'ACS既往 + 多枝病変';
    } else if (isACSAfter1yOrStable() && hasExtremeFactorForCAD()) {
      targetLDL = 55;
      categoryLabel = '極高リスク（55）';
      var factors = [];
      if (fh) factors.push('FH');
      if (isDMComp()) factors.push('DM細小血管障害');
      if (pad) factors.push('PAD');
      if (atheroStroke) factors.push('アテローム血栓性脳梗塞');
      decidedBy = (cadType === 'after1y' ? 'ACS1年後以降' : '安定CAD') + ' + ' + factors.join(' / ');
    }

    // 70 mg/dL未満（二次予防）
    if (targetLDL === null) {
      if (isACSAfter1yOrStable() && !hasExtremeFactorForCAD()) {
        targetLDL = 70;
        categoryLabel = '二次予防（70）';
        decidedBy = (cadType === 'after1y' ? 'ACS1年後以降' : '安定CAD') + '（極高リスク因子なし）';
      } else if (!hasCAD() && (atheroStroke || pad)) {
        targetLDL = 70;
        categoryLabel = '二次予防（70）';
        decidedBy = 'CADなし + ' + (atheroStroke ? 'アテローム血栓性脳梗塞' : 'PAD');
      }
    }

    // 一次予防
    if (targetLDL === null) {
      var fhRiskFactor = (
        isDM() ||
        hasAnyCKDRisk() ||
        hasHTN() ||
        smoking ||
        familyHistory
      );

      var primaryHigh70 =
        (fh && fhRiskFactor) ||
        (isDM() && (isDMComp() || smoking)) ||
        ((ckdGrade === 'g3' || ckdGrade === 'g4') && (proteinuria === 'a2' || proteinuria === 'a3')) ||
        (ckdGrade === 'g1' && proteinuria === 'a3');

      if (primaryHigh70) {
        targetLDL = 70;
        categoryLabel = '一次予防 高リスク（70）';

        if (fh && fhRiskFactor) {
          decidedBy = 'FH + リスク因子あり';
        } else if (isDM() && (isDMComp() || smoking)) {
          decidedBy = '糖尿病 +（細小血管障害 or 喫煙）';
        } else if ((ckdGrade === 'g3' || ckdGrade === 'g4') && (proteinuria === 'a2' || proteinuria === 'a3')) {
          decidedBy = 'CKD G3-5 + 蛋白尿A2/A3';
        } else {
          decidedBy = 'CKD G1-2 + 蛋白尿A3';
        }
      } else {
        var hy = hisayamaRisk();

        var primaryMidHigh100 =
          (fh && !fhRiskFactor) ||
          (dmStatus === 'dm') ||
          ((ckdGrade === 'g3' || ckdGrade === 'g4') && proteinuria === 'a1') ||
          (ckdGrade === 'g1' && proteinuria === 'a2') ||
          (hy.ok && hy.risk === 'high');

        if (primaryMidHigh100) {
          targetLDL = 100;
          categoryLabel = '一次予防 中高リスク（100）';

          if (fh && !fhRiskFactor) {
            decidedBy = 'FH（リスク因子なし）';
          } else if (dmStatus === 'dm') {
            decidedBy = '糖尿病（合併症なし）';
          } else if ((ckdGrade === 'g3' || ckdGrade === 'g4') && proteinuria === 'a1') {
            decidedBy = 'CKD G3-5 + 蛋白尿A1';
          } else if (ckdGrade === 'g1' && proteinuria === 'a2') {
            decidedBy = 'CKD G1-2 + 蛋白尿A2';
          } else {
            decidedBy = '久山町 高リスク: ' + hy.points + '点';
          }
        } else if (hy.ok && hy.risk === 'middle') {
          targetLDL = 120;
          categoryLabel = '一次予防 中リスク（120）';
          decidedBy = '久山町 中リスク: ' + hy.points + '点';
        } else if (hy.ok && hy.risk === 'low') {
          targetLDL = 140;
          categoryLabel = '一次予防 低リスク（140）';
          decidedBy = '久山町 低リスク: ' + hy.points + '点';
        } else {
          targetLDL = null;
          categoryLabel = '';
          decidedBy = hy.reason || '一次予防リスク判定不能';
        }
      }
    }

    // ===== 表示 =====
    if (ldl !== null) {
      messages.push('LDL-C（実測）: ' + ldl.toFixed(0) + ' mg/dL');
    } else {
      messages.push('LDL-C（実測）: 未入力');
    }

    if (hdl !== null) messages.push('HDL-C: ' + hdl.toFixed(0) + ' mg/dL');
    if (tc !== null) messages.push('総コレステロール: ' + tc.toFixed(0) + ' mg/dL');
    if (tg !== null) messages.push('中性脂肪: ' + tg.toFixed(0) + ' mg/dL');
    if (nonHdl !== null) messages.push('Non-HDL-C（TC−HDL）: ' + nonHdl.toFixed(0) + ' mg/dL');

    if (tc !== null && hdl !== null && tg !== null) {
      if (tg < 400) {
        messages.push('Friedewald式推算LDL-C: ' + friedewaldLdl.toFixed(0) + ' mg/dL');
      } else {
        messages.push('Friedewald式推算LDL-C: TG 400 mg/dL以上のため計算対象外');
      }
    }

    if (judgeLdl !== null) {
      messages.push('判定に使用したLDL-C: ' + judgeLdl.toFixed(0) + ' mg/dL（' + judgeLdlSource + '）');
    } else {
      messages.push('判定に使用したLDL-C: 未確定');
    }

    if (targetLDL === null) {
      messages.push('<b>目標値が確定できない</b>（' + decidedBy + '）');
      return { messages: messages };
    }

    var targetNonHDL = targetLDL + 30;

    var ldlAchieved = (judgeLdl !== null) ? (judgeLdl < targetLDL) : null;
    var nonHdlAchieved = (nonHdl !== null) ? (nonHdl < targetNonHDL) : null;

    messages.push('---');
    messages.push('カテゴリ: <b>' + categoryLabel + '</b>');
    messages.push('LDL-C目標: <b>' + targetLDL + ' mg/dL 未満</b> → ' + (ldlAchieved === null ? '（LDL未確定）' : (ldlAchieved ? '<b>達成</b>' : '<b>未達成</b>')));
    messages.push('Non-HDL-C目標: <b>' + targetNonHDL + ' mg/dL 未満</b> → ' + (nonHdlAchieved === null ? '（TC/HDLが必要）' : (nonHdlAchieved ? '<b>達成</b>' : '<b>未達成</b>')));
    messages.push('判定経路: ' + decidedBy);

    return { messages: messages };
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.calculateLipid = calculateLipidDomain;
})(window);
