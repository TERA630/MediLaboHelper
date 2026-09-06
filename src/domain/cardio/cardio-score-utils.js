(function (global) {
  'use strict';

  function isNumber(value) {
    return typeof value === 'number' && isFinite(value);
  }

  // 境界は min <= value < max。null の境界は片側無限として扱う。
  function classifyByRange(value, ranges) {
    if (!isNumber(value) || !Array.isArray(ranges)) return null;

    for (var i = 0; i < ranges.length; i += 1) {
      var range = ranges[i];
      var min = range.min === null || typeof range.min === 'undefined' ? -Infinity : range.min;
      var max = range.max === null || typeof range.max === 'undefined' ? Infinity : range.max;
      if (min <= value && value < max) return range;
    }

    return null;
  }

  function createComponent(code, label, points, active, automatic) {
    return {
      code: code,
      label: label,
      points: points,
      active: active === true,
      automatic: automatic === true
    };
  }

  function totalActivePoints(components) {
    return components.reduce(function (total, component) {
      return total + (component.active ? component.points : 0);
    }, 0);
  }

  global.MedcalcDomain = global.MedcalcDomain || {};
  global.MedcalcDomain.cardioScoreUtils = {
    isNumber: isNumber,
    classifyByRange: classifyByRange,
    createComponent: createComponent,
    totalActivePoints: totalActivePoints
  };
})(window);
