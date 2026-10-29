// El idioma de la página (la landing y play/). Lo cargan las dos al final del <body>, después de
// textos.js (las traducciones) y antes de su propio script.
//
// Cada texto va en el HTML con su español y su inglés: data-es / data-en (el texto), data-es-label /
// data-en-label (aria-label) y data-es-alt / data-en-alt (alt de una imagen). Los otros idiomas buscan el
// inglés en textos.js (GK_TEXTS[idioma][inglés]); lo que no está ahí sale en inglés.
//
// Qué idioma: ?lang=xx en la dirección (solo esa visita); si no, el elegido en el menú (localStorage
// gk.lang, el mismo que usa el juego); si no, el navegador: el primero de sus idiomas que tengamos y no sea
// inglés (mucha gente tiene el navegador en inglés y su idioma más abajo en la lista); si no, inglés.
//
// El menú se arma solo adentro de cada `.lang` de la página. window.gkLang le da al script de la página el
// idioma (`lang`), la traducción de un texto suelto (`t(es, en)`) y el aviso de cambio (`onChange`).
(function () {
  var LANGS = [
    { id: 'es', name: 'Español', short: 'ES', tag: 'es' },
    { id: 'en', name: 'English', short: 'EN', tag: 'en' },
    { id: 'zh', name: '简体中文', short: '中文', tag: 'zh-CN' },
    { id: 'ko', name: '한국어', short: '한국어', tag: 'ko' },
    { id: 'ja', name: '日本語', short: '日本語', tag: 'ja' },
    { id: 'pt', name: 'Português (Brasil)', short: 'PT', tag: 'pt-BR' },
    { id: 'ru', name: 'Русский', short: 'RU', tag: 'ru' },
  ];
  var TEXTS = window.GK_TEXTS || {};
  var listeners = [];

  function known(tag) {
    var base = String(tag || '').toLowerCase().split('-')[0];
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].id === base) return base;
    return null;
  }
  function info(id) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].id === id) return LANGS[i];
    return LANGS[1];
  }

  var lang = (function () {
    var asked = null;
    try { asked = known(new URLSearchParams(location.search).get('lang')); } catch (e) { /* dirección rara */ }
    if (asked) return asked;
    try {
      var saved = known(localStorage.getItem('gk.lang'));
      if (saved) return saved;
    } catch (e) { /* sin almacenamiento */ }
    var prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < prefs.length; i++) {
      var l = known(prefs[i]);
      if (l && l !== 'en') return l;
    }
    return 'en';
  })();

  function t(es, en) {
    if (lang === 'es') return es;
    if (lang === 'en') return en;
    var table = TEXTS[lang] || {};
    return Object.prototype.hasOwnProperty.call(table, en) ? table[en] : en;
  }

  function apply() {
    document.documentElement.lang = info(lang).tag;
    var els = document.querySelectorAll('[data-es]');
    for (var i = 0; i < els.length; i++) els[i].textContent = t(els[i].dataset.es, els[i].dataset.en);
    els = document.querySelectorAll('[data-es-label]');
    for (i = 0; i < els.length; i++) els[i].setAttribute('aria-label', t(els[i].dataset.esLabel, els[i].dataset.enLabel));
    els = document.querySelectorAll('[data-es-alt]');
    for (i = 0; i < els.length; i++) els[i].alt = t(els[i].dataset.esAlt, els[i].dataset.enAlt);
    var menus = document.querySelectorAll('.lang');
    for (i = 0; i < menus.length; i++) {
      var current = menus[i].querySelector('.lang-current');
      if (current) current.textContent = info(lang).short;
      var opts = menus[i].querySelectorAll('[data-lang]');
      for (var j = 0; j < opts.length; j++) opts[j].setAttribute('aria-selected', String(opts[j].dataset.lang === lang));
    }
    for (i = 0; i < listeners.length; i++) listeners[i](lang);
  }

  function set(next) {
    if (!known(next)) return;
    lang = next;
    try { localStorage.setItem('gk.lang', lang); } catch (e) { /* sin almacenamiento */ }
    // si vino en la dirección, se saca: si no, al recargar volvería al de la dirección
    try {
      var url = new URL(location.href);
      if (url.searchParams.has('lang')) {
        url.searchParams.delete('lang');
        history.replaceState(null, '', url.toString());
      }
    } catch (e) { /* sin history */ }
    apply();
  }

  // el menú: un botón con el globo y el idioma de ahora, que abre la lista
  var GLOBE = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 8h13M8 1.5c-2.2 2.3-2.2 10.7 0 13M8 1.5c2.2 2.3 2.2 10.7 0 13" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>';
  var menus = document.querySelectorAll('.lang');
  for (var m = 0; m < menus.length; m++) {
    (function (box) {
      box.setAttribute('translate', 'no');
      var html = '<button type="button" class="lang-toggle" aria-haspopup="listbox" aria-expanded="false">' + GLOBE + '<span class="lang-current"></span></button><ul class="lang-list" role="listbox" hidden>';
      for (var i = 0; i < LANGS.length; i++) html += '<li role="option" tabindex="-1" data-lang="' + LANGS[i].id + '" lang="' + LANGS[i].tag + '">' + LANGS[i].name + '</li>';
      box.innerHTML = html + '</ul>';
      var toggle = box.querySelector('.lang-toggle');
      var list = box.querySelector('.lang-list');
      var open = function (yes) {
        list.hidden = !yes;
        toggle.setAttribute('aria-expanded', String(yes));
        if (yes) {
          var mine = list.querySelector('[aria-selected="true"]') || list.firstChild;
          mine.focus();
        }
      };
      toggle.setAttribute('aria-label', t('Idioma', 'Language'));
      toggle.addEventListener('click', function () { open(list.hidden); });
      list.addEventListener('click', function (e) {
        var li = e.target.closest('[data-lang]');
        if (!li) return;
        set(li.dataset.lang);
        open(false);
        toggle.focus();
      });
      list.addEventListener('keydown', function (e) {
        var items = Array.prototype.slice.call(list.children);
        var at = items.indexOf(document.activeElement);
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          items[(at + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (at >= 0) items[at].click();
        } else if (e.key === 'Escape') {
          open(false);
          toggle.focus();
        }
      });
      document.addEventListener('click', function (e) { if (!box.contains(e.target)) open(false); });
      listeners.push(function () { toggle.setAttribute('aria-label', t('Idioma', 'Language')); });
    })(menus[m]);
  }

  window.gkLang = {
    get lang() { return lang; },
    t: t,
    set: set,
    onChange: function (fn) { listeners.push(fn); },
  };
  apply();
})();
