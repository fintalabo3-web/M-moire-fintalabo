"use strict";
(async function(){
  try {
    const parts = await Promise.all([0,1,2,3].map(i => fetch("./app.part"+i+".js").then(r=>r.text())));
    (0, eval)(parts.join(""));
  } catch(e) {
    console.error(e);
    document.body.innerHTML = "<p style=\"padding:2rem\">Erreur de chargement</p>";
  }
})();
