(function (global) {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function getNum(id) {
    var el = $(id);
    if (!el) return null;
    var v = parseFloat(el.value);
    return isFinite(v) ? v : null;
  }

  function getSelectValue(id) {
    var el = $(id);
    return el ? el.value : '';
  }

  function isChecked(id) {
    var el = $(id);
    return !!(el && el.checked);
  }

  global.MedcalcDom = {
    $: $,
    getNum: getNum,
    getSelectValue: getSelectValue,
    isChecked: isChecked
  };
})(window);
