/* Abdul Aziz Tours & Consultancy · Stage 1 (static layout, no motion).
 * Handles: language switch, mobile menu, owner config, enquiry form. */
(function () {
  'use strict';

  var cfg = window.SITE_CONFIG || {};
  var root = document.documentElement;
  var KEY = 'aziz-lang';
  var mapImg = document.querySelector('[data-alt-bn]');

  /* ---------- Language ---------- */

  function setLang(lang) {
    if (lang !== 'bn' && lang !== 'en') return;
    root.setAttribute('lang', lang);
    root.setAttribute('data-lang', lang);
    if (mapImg) mapImg.alt = mapImg.getAttribute(lang === 'bn' ? 'data-alt-bn' : 'data-alt-en');
    document.querySelectorAll('option[data-label-bn]').forEach(function (o) {
      o.textContent = o.getAttribute('data-label-' + lang);
    });
    document.querySelectorAll('[data-ph-bn]').forEach(function (el) {
      el.placeholder = el.getAttribute('data-ph-' + lang);
    });
    try { localStorage.setItem(KEY, lang); } catch (e) { /* private mode: keep the session choice only */ }
    document.dispatchEvent(new Event('sitelangchange'));
  }

  var toggle = document.getElementById('lang-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      setLang(root.getAttribute('data-lang') === 'bn' ? 'en' : 'bn');
    });
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { saved = null; }
  setLang(saved === 'en' ? 'en' : 'bn');

  /* ---------- Mobile menu ---------- */

  var menuToggle = document.getElementById('menu-toggle');
  var menuPanel = document.getElementById('mobile-menu');
  if (menuToggle && menuPanel) {
    menuToggle.addEventListener('click', function () {
      var open = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!open));
      menuPanel.hidden = open;
    });
    menuPanel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuPanel.hidden = true;
      });
    });
  }

  /* ---------- Owner config ---------- */

  function digits(s) { return String(s || '').replace(/\D/g, ''); }

  function applyConfig() {
    var wa = digits(cfg.WHATSAPP_NUMBER);

    if (wa) {
      document.querySelectorAll('[data-whatsapp]').forEach(function (a) {
        a.href = 'https://wa.me/' + wa;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.hidden = false;
      });
    }

    document.querySelectorAll('[data-tel]').forEach(function (a) {
      var v = cfg[a.getAttribute('data-tel')];
      if (v) a.href = 'tel:' + digits(v);
    });

    document.querySelectorAll('[data-link]').forEach(function (a) {
      var v = cfg[a.getAttribute('data-link')];
      if (v) a.href = v;
    });

    document.querySelectorAll('[data-config]').forEach(function (row) {
      var key = row.getAttribute('data-config');
      var val = cfg[key];
      if (!val) return;
      var dd = row.querySelector('dd');
      dd.textContent = '';
      if (key === 'OFFICE_EMAIL') {
        var link = document.createElement('a');
        link.href = 'mailto:' + val;
        link.textContent = val;
        dd.appendChild(link);
      } else {
        dd.textContent = val;
      }
      row.hidden = false;
    });

    document.querySelectorAll('[data-flag]').forEach(function (el) {
      if (cfg[el.getAttribute('data-flag')] === true) el.hidden = false;
    });
  }
  applyConfig();

  /* ---------- Programme shortcuts ---------- */

  var programme = document.getElementById('client-programme');
  var nameInput = document.getElementById('client-name');

  document.querySelectorAll('[data-programme]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (programme) programme.value = btn.getAttribute('data-programme');
      var contact = document.getElementById('contact');
      if (contact) contact.scrollIntoView();
      if (nameInput) nameInput.focus({ preventScroll: true });
    });
  });

  /* ---------- Enquiry form ---------- */

  var form = document.getElementById('enquiry');
  var phone = document.getElementById('client-phone');
  var phoneError = document.getElementById('phone-error');
  var details = document.getElementById('client-details');
  var result = document.getElementById('result');
  var resultText = document.getElementById('result-text');
  var copyBtn = document.getElementById('copy-btn');
  var copyStatus = document.getElementById('copy-status');

  function lang() { return root.getAttribute('data-lang') === 'en' ? 'en' : 'bn'; }

  function buildMessage() {
    var isBn = lang() === 'bn';
    var name = nameInput.value.trim() || (isBn ? 'উল্লেখ নেই' : 'Not given');
    var phoneVal = phone.value.trim();
    var prog = programme.options[programme.selectedIndex];
    var progLabel = programme.value
      ? (prog.getAttribute('data-label-' + lang()) || prog.textContent)
      : (isBn ? 'সাধারণ পরামর্শ' : 'General guidance');
    var text = details.value.trim() || (isBn ? 'পরামর্শ চাই।' : 'I would like guidance.');

    return isBn
      ? 'আসসালামু আলাইকুম।\nআমার নাম: ' + name + '\nফোন: ' + phoneVal + '\nআগ্রহের বিষয়: ' + progLabel + '\nবিস্তারিত: ' + text
      : 'Hello,\nName: ' + name + '\nPhone: ' + phoneVal + '\nInterested in: ' + progLabel + '\nDetails: ' + text;
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var value = phone.value.trim();
      if (!/^01\d{9}$/.test(value)) {
        phoneError.hidden = false;
        phone.setAttribute('aria-invalid', 'true');
        phone.focus();
        return;
      }
      phoneError.hidden = true;
      phone.removeAttribute('aria-invalid');

      var message = buildMessage();
      var wa = digits(cfg.WHATSAPP_NUMBER);

      if (wa) {
        window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
        return;
      }

      // No confirmed WhatsApp number yet: keep the typed message and offer copy or call.
      resultText.value = message;
      result.hidden = false;
      copyStatus.textContent = '';
      resultText.focus();
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var isBn = lang() === 'bn';
      var ok = function () {
        copyStatus.textContent = isBn ? 'বার্তাটি কপি হয়েছে।' : 'Message copied.';
      };
      var fail = function () {
        resultText.select();
        var copied = false;
        try { copied = document.execCommand('copy'); } catch (e) { copied = false; }
        copyStatus.textContent = copied
          ? (isBn ? 'বার্তাটি কপি হয়েছে।' : 'Message copied.')
          : (isBn ? 'কপি করা যায়নি। লেখাটি সিলেক্ট করে কপি করুন।' : 'Could not copy. Select the text and copy it.');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(resultText.value).then(ok, fail);
      } else {
        fail();
      }
    });
  }
})();
