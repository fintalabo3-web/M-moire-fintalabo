"use strict";
(async function(){
  try {
    const n = 8;
    const parts = await Promise.all(
      Array.from({length: n}, (_, i) => fetch("./p"+i+".js").then(r => r.text()))
    );
    (0, eval)(parts.join(""));
  } catch (e) {
    console.error(e);
    document.body.innerHTML = "<p style=\"padding:2rem;font-family:sans-serif\">Erreur de chargement. Rechargez.</p>";
  }
})();
