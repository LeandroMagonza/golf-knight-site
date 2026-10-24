// El idioma del juego, decidido antes que cualquier otra cosa. Lo cargan index.html y cine.html como
// script común al final del <body>: corre antes que los módulos, así los textos fijos del HTML ya
// están traducidos al primer cuadro. Ver docs/localizacion.md.
//
// Cómo decide: ?lang=xx en la dirección (solo para esa visita); si no, lo elegido en el menú de idioma
// (localStorage gk.lang, lo escribe setLang en src/i18n.ts); si no, el navegador: el primero de sus
// idiomas preferidos que el juego tenga y no sea inglés (mucha gente tiene el navegador en inglés con su
// idioma más abajo en la lista), inglés si no tiene ninguno.
//
// Deja el resultado en <html lang> (con la etiqueta completa: zh-CN, pt-BR), que es lo que lee
// src/i18n.ts. Si no es español, pone el inglés de los elementos marcados: data-en (el texto),
// data-en-html (el contenido con etiquetas) y data-en-<atributo> (title, aria-label, placeholder...).
// Chino, coreano, japonés, portugués y ruso salen de un catálogo que carga src/i18n.ts: hasta que llega,
// la página queda escondida (clase gk-i18n), así no se ve el inglés un instante.
(function () {
  // la misma lista que LANGS en src/i18n.ts
  var LANGS = ['es', 'en', 'zh', 'ko', 'ja', 'pt', 'ru'];
  var TAGS = { zh: 'zh-CN', pt: 'pt-BR' };
  var lang = 'es';
  var known = function (tag) {
    var base = String(tag || '').toLowerCase().split('-')[0];
    return LANGS.indexOf(base) >= 0 ? base : null;
  };
  try {
    var asked = known(new URLSearchParams(location.search).get('lang'));
    var saved = null;
    try {
      saved = known(localStorage.getItem('gk.lang'));
    } catch (e) { /* sin localStorage: decide el navegador */ }
    if (asked) lang = asked;
    else if (saved) lang = saved;
    else {
      var prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
      lang = 'en';
      for (var i = 0; i < prefs.length; i++) {
        var l = known(prefs[i]);
        if (l && l !== 'en') {
          lang = l;
          break;
        }
      }
    }
  } catch (e) { /* algo raro en el navegador: queda español */ }
  document.documentElement.lang = TAGS[lang] || lang;
  if (lang === 'es') return;
  if (lang !== 'en') {
    var style = document.createElement('style');
    style.textContent = 'html.gk-i18n body { visibility: hidden; }';
    document.head.appendChild(style);
    document.documentElement.classList.add('gk-i18n');
    // si el catálogo no llega, mejor en inglés que nada
    setTimeout(function () { document.documentElement.classList.remove('gk-i18n'); }, 6000);
  }
  var all = document.querySelectorAll('*');
  for (var j = 0; j < all.length; j++) {
    var el = all[j];
    for (var k = 0; k < el.attributes.length; k++) {
      var a = el.attributes[k];
      if (a.name === 'data-en') el.textContent = a.value;
      else if (a.name === 'data-en-html') el.innerHTML = a.value;
      else if (a.name.indexOf('data-en-') === 0) el.setAttribute(a.name.slice(8), a.value);
    }
  }
})();
