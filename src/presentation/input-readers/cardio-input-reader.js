(function (global) {
  'use strict';

  function readSelectedScore() {
    var selected = document.querySelector('[data-cardio-score].active');
    return selected ? selected.getAttribute('data-cardio-score') : 'wells-pe';
  }

  function readWellsPeInput() {
    var dom = global.MedcalcDom;
    return {
      dvtSigns: dom.isChecked('cardio-wells-dvt-signs'),
      peMostLikely: dom.isChecked('cardio-wells-pe-most-likely'),
      heartRate: dom.getNum('cardio-wells-heart-rate'),
      immobilizationOrSurgery: dom.isChecked('cardio-wells-immobilization-surgery'),
      previousDvtOrPe: dom.isChecked('cardio-wells-previous-dvt-pe'),
      hemoptysis: dom.isChecked('cardio-wells-hemoptysis'),
      activeMalignancy: dom.isChecked('cardio-wells-malignancy')
    };
  }

  function readCha2ds2VascInput(patient) {
    var dom = global.MedcalcDom;
    return {
      age: patient.age,
      gender: patient.gender,
      congestiveHeartFailure: dom.isChecked('cardio-cha-heart-failure'),
      hypertension: dom.isChecked('cardio-cha-hypertension'),
      diabetesMellitus: dom.isChecked('cardio-cha-diabetes'),
      strokeTiaThromboembolism: dom.isChecked('cardio-cha-stroke-tia-te'),
      vascularDisease: dom.isChecked('cardio-cha-vascular-disease')
    };
  }

  function readHasBledInput(patient) {
    var dom = global.MedcalcDom;
    return {
      age: patient.age,
      systolicBloodPressure: dom.getNum('cardio-has-sbp'),
      abnormalRenalFunction: dom.isChecked('cardio-has-renal'),
      abnormalLiverFunction: dom.isChecked('cardio-has-liver'),
      stroke: dom.isChecked('cardio-has-stroke'),
      bleedingHistoryOrPredisposition: dom.isChecked('cardio-has-bleeding'),
      labileInr: dom.isChecked('cardio-has-labile-inr'),
      drugs: dom.isChecked('cardio-has-drugs'),
      alcohol: dom.isChecked('cardio-has-alcohol')
    };
  }

  function readCardioInput() {
    var patient = global.MedcalcInputReaders.readPatientContext();
    return {
      selectedScore: readSelectedScore(),
      scores: {
        'wells-pe': readWellsPeInput(),
        'cha2ds2-vasc': readCha2ds2VascInput(patient),
        'has-bled': readHasBledInput(patient)
      }
    };
  }

  global.MedcalcInputReaders = global.MedcalcInputReaders || {};
  global.MedcalcInputReaders.readWellsPeInput = readWellsPeInput;
  global.MedcalcInputReaders.readCha2ds2VascInput = function () {
    return readCha2ds2VascInput(global.MedcalcInputReaders.readPatientContext());
  };
  global.MedcalcInputReaders.readHasBledInput = function () {
    return readHasBledInput(global.MedcalcInputReaders.readPatientContext());
  };
  global.MedcalcInputReaders.readCardioInput = readCardioInput;
})(window);
