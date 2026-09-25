"use strict";
/* Temporary restore: load last good build while hardened version is deployed */
(function () {
  var s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/gh/fintalabo3-web/M-moire-fintalabo@c668c6c503732de9a48c326a992f28cc3f8fdd47/app.js";
  s.async = false;
  s.onerror = function () {
    console.error("FasoService: failed to load app.js from CDN fallback");
  };
  document.head.appendChild(s);
})();
