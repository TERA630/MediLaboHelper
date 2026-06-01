(function (global) {
  'use strict';

  function closestWithDataTab(node) {
    while (node && node !== document) {
      if (node.getAttribute && node.getAttribute('data-tab')) return node;
      node = node.parentNode;
    }
    return null;
  }

  function createRunner(handlers) {
    return function runAll() {
      handlers.renal();
      handlers.glucose();
      handlers.lipid();
      handlers.liver();
      handlers.anemia();
      handlers.uro();
      handlers.dateCalc();
      handlers.gamma();
    };
  }

  function bindTabs() {
    var dom = global.MedcalcDom;
    var tabsRoot = document.querySelector('.tabs');
    var tabButtons = document.querySelectorAll('.tab-button');
    var tabContents = document.querySelectorAll('.tab-content');

    function activateTab(tabId) {
      for (var i = 0; i < tabButtons.length; i++) tabButtons[i].classList.remove('active');
      for (var j = 0; j < tabContents.length; j++) tabContents[j].classList.remove('active');

      for (var k = 0; k < tabButtons.length; k++) {
        if (tabButtons[k].getAttribute('data-tab') === tabId) {
          tabButtons[k].classList.add('active');
          break;
        }
      }
      var target = dom.$(tabId);
      if (target) target.classList.add('active');
    }

    if (tabsRoot) {
      tabsRoot.addEventListener('click', function (e) {
        var btn = closestWithDataTab(e.target);
        if (!btn) return;
        var tabId = btn.getAttribute('data-tab');
        if (!tabId) return;
        activateTab(tabId);
      });
    }
  }

  function bindCommonInputs(runAll) {
    var dom = global.MedcalcDom;
    var commonIds = ['age', 'gender', 'height', 'weight'];
    for (var i = 0; i < commonIds.length; i++) {
      (function (id) {
        var el = dom.$(id);
        if (!el) return;
        var ev = (el.tagName === 'SELECT') ? 'change' : 'input';
        el.addEventListener(ev, runAll);
      })(commonIds[i]);
    }
  }

  function bindSection(sectionId, callback) {
    var root = global.MedcalcDom.$(sectionId);
    if (!root) return;

    root.addEventListener('input', function (e) {
      if (!e || !e.target) return;
      var t = e.target;
      if (t && t.tagName === 'INPUT') callback();
    });

    root.addEventListener('change', function (e) {
      if (!e || !e.target) return;
      var t = e.target;
      if (!t) return;
      if (t.tagName === 'SELECT' || (t.tagName === 'INPUT' && t.type === 'checkbox')) callback();
    });
  }

  function bindSections(handlers) {
    bindSection('renal', handlers.renal);
    bindSection('glucose', handlers.glucose);
    bindSection('lipid', handlers.lipid);
    bindSection('liver', handlers.liver);
    bindSection('anemia', handlers.anemia);
    bindSection('uro', handlers.uro);
    bindSection('dateCalc', handlers.dateCalc);
    bindSection('gamma', handlers.gamma);
  }

  function bindDrugSelect(handlers) {
    var dom = global.MedcalcDom;
    var sel = dom.$('g_drug_select');
    if (!sel) return;

    sel.addEventListener('change', function () {
      var key = sel.value;
      var info = global.MedcalcDomain.getGammaDrugInfo(key);
      var conc = info ? info.conc_mg_per_ml : null;

      ['g_conc_a', 'g_conc_b'].forEach(function (id) {
        var el = dom.$(id);
        if (!el) return;
        if (conc !== null) {
          el.value = conc;
        } else {
          el.value = '';
        }
      });
      handlers.gamma();
    });
  }

  function initAppShell(handlers) {
    var runAll = createRunner(handlers);

    bindTabs();
    bindCommonInputs(runAll);
    bindSections(handlers);
    bindDrugSelect(handlers);
    runAll();
  }

  global.MedcalcAppShell = {
    init: initAppShell
  };
})(window);
