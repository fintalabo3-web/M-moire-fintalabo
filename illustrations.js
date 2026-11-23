/* FasoService — illustrations SVG intégrées, sans images externes */
(() => {
  "use strict";

  const palettes = [
    { bg: "#E6F4EA", shirt: "#0B7A4B", accent: "#E7A63A", tool: "#D8E7DE" },
    { bg: "#FFF1D8", shirt: "#B66A24", accent: "#0B7A4B", tool: "#F1D29A" },
    { bg: "#E8F0FF", shirt: "#315D91", accent: "#E7A63A", tool: "#C9D9F1" },
    { bg: "#F8EAF1", shirt: "#9C4F72", accent: "#0B7A4B", tool: "#EBC9D8" }
  ];

  function palette(seed) {
    const value = String(seed || "FasoService").split("").reduce((n, c) => n + c.charCodeAt(0), 0);
    return palettes[value % palettes.length];
  }

  function person(category, compact) {
    const p = palette(category);
    const label = String(category || "Prestataire").replace(/[&<>"']/g, "");
    const headY = compact ? 37 : 66;
    const headR = compact ? 17 : 25;
    return `<svg viewBox="0 0 160 160" role="img" aria-label="Illustration d'un professionnel ${label}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="shirt-${compact ? "s" : "l"}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p.shirt}"/><stop offset="1" stop-color="${p.accent}"/></linearGradient></defs>
      <rect width="160" height="160" rx="24" fill="${p.bg}"/>
      <circle cx="124" cy="31" r="18" fill="#fff" opacity=".6"/>
      <path d="M15 142c14-24 35-35 65-35s52 11 65 35v18H15z" fill="#D4E3D8"/>
      <path d="M36 160c2-34 17-51 44-51s42 17 44 51" fill="url(#shirt-${compact ? "s" : "l"})"/>
      <path d="M58 109l22 21 22-21-9-12H67z" fill="#F0B28A"/>
      <circle cx="80" cy="${headY}" r="${headR}" fill="#874B32"/>
      <path d="M55 61q1-29 26-30 25 0 27 31-12-12-26-12-14 0-27 11" fill="#211D1A"/>
      <path d="M61 66q19 9 38 0" stroke="#6D3828" stroke-width="3" fill="none" opacity=".7"/>
      <circle cx="71" cy="${headY}" r="2" fill="#211D1A"/><circle cx="90" cy="${headY}" r="2" fill="#211D1A"/>
      <path d="M73 78q7 5 14 0" stroke="#5B2F25" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M49 126l12 10m50-10-12 10" stroke="#fff" stroke-width="4" opacity=".85"/>
      <path d="M25 24l10-8 10 8-10 8z" fill="${p.accent}" opacity=".9"/>
      <path d="M128 95l9 9-9 9-9-9z" fill="${p.accent}" opacity=".8"/>
      <path d="M77 117l3 5 3-5" stroke="#fff" stroke-width="2" fill="none" opacity=".9"/>
    </svg>`;
  }

  function category(name) {
    const n = String(name || "").toLowerCase();
    const p = palette(name);
    let drawing = "";
    if (/plomb|frigor|assain|eau/.test(n)) drawing = '<path d="M48 35v38q0 12 12 12h16q12 0 12-12V58" fill="none" stroke="#287E9A" stroke-width="11" stroke-linecap="round"/><path d="M77 58h22v-14" fill="none" stroke="#287E9A" stroke-width="9" stroke-linecap="round"/><path d="M91 39h17v17H91z" fill="#E6A23A"/><path d="M109 68c0 8-6 13-13 13s-13-5-13-13c0-7 13-22 13-22s13 15 13 22" fill="#66B8D1"/>';
    else if (/électric|anten|informat|téléphone|photograph|vidéo/.test(n)) drawing = '<rect x="37" y="31" width="86" height="64" rx="10" fill="#344D63"/><rect x="44" y="38" width="72" height="49" rx="5" fill="#BFE3E7"/><path d="M78 46L63 68h14l-4 17 25-29H82l5-10z" fill="#E7A63A"/><path d="M28 105h104l-12 9H40z" fill="#637F91"/>';
    else if (/mécan|vulcan|chauff|livreur|transport|déménag/.test(n)) drawing = '<circle cx="80" cy="69" r="37" fill="#263D36"/><circle cx="80" cy="69" r="23" fill="#DCE9E1"/><circle cx="80" cy="69" r="10" fill="#E5A13A"/><path d="M34 112h92" stroke="#263D36" stroke-width="9" stroke-linecap="round"/><path d="M50 103l13-22m47 22L97 81" stroke="#E5A13A" stroke-width="8" stroke-linecap="round"/>';
    else if (/maçon|carre|plaqu|menuis|soud|forger|vitri|peint/.test(n)) drawing = '<path d="M35 101h90V53H35z" fill="#D18A4A"/><path d="M35 69h90M35 85h90M58 53v16m44 0v16M80 85v16" stroke="#FFF0D8" stroke-width="5"/><path d="M48 42l47 0" stroke="#465E51" stroke-width="8" stroke-linecap="round"/><path d="M91 31l18 12-8 11-18-12z" fill="#E7A63A"/>';
    else if (/coutur|cordonn|blanch|coiff|ménage|nettoy|beauté/.test(n)) drawing = '<path d="M80 28l31 20-9 57H58l-9-57z" fill="#D986A8"/><path d="M80 28v77M49 48q31 17 62 0" stroke="#fff" stroke-width="4" fill="none"/><path d="M114 35l14 14-35 35-14-14z" fill="#E7A63A"/><path d="M120 30l9 9" stroke="#8C4C6B" stroke-width="5" stroke-linecap="round"/>';
    else if (/traiteur|cuisin|restaur|boulanger/.test(n)) drawing = '<path d="M43 62h74v39q0 13-13 13H56q-13 0-13-13z" fill="#D77B37"/><path d="M37 61h86" stroke="#7A482B" stroke-width="8" stroke-linecap="round"/><path d="M56 53q-8-19 9-23 8-17 21-3 17-4 18 15" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M59 78h42" stroke="#FFE5B6" stroke-width="5" stroke-linecap="round"/>';
    else if (/jardin|agric|élev|anim/.test(n)) drawing = '<path d="M80 112V57" stroke="#397A4C" stroke-width="8" stroke-linecap="round"/><path d="M78 78Q39 74 42 40q34-2 36 38M84 68q-2-39 34-43 8 34-34 43" fill="#58A66B"/><path d="M40 113q40-20 80 0" stroke="#9A6B36" stroke-width="8" stroke-linecap="round"/>';
    else if (/prof|professeur|garde|soignant|santé|kiné|masseur/.test(n)) drawing = '<path d="M42 37h76v68H42z" rx="7" fill="#fff" stroke="#6E9A88" stroke-width="5"/><path d="M54 54h52M54 69h40M54 84h45" stroke="#6E9A88" stroke-width="5" stroke-linecap="round"/><path d="M80 93v28m-13-14h26" stroke="#E36D6D" stroke-width="8" stroke-linecap="round"/>';
    else drawing = '<rect x="38" y="49" width="84" height="62" rx="12" fill="#fff" stroke="#567B65" stroke-width="5"/><path d="M58 49V39q0-10 10-10h24q10 0 10 10v10" fill="none" stroke="#567B65" stroke-width="7"/><path d="M80 64v30m-15-15h30" stroke="#E7A63A" stroke-width="8" stroke-linecap="round"/>';
    return `<svg viewBox="0 0 160 140" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><rect width="160" height="140" rx="18" fill="${p.bg}"/><circle cx="128" cy="25" r="15" fill="#fff" opacity=".65"/><circle cx="28" cy="112" r="10" fill="${p.tool}"/>${drawing}<path d="M19 124h122" stroke="${p.shirt}" stroke-width="4" stroke-linecap="round" opacity=".3"/></svg>`;
  }

  function hero() {
    return `<svg viewBox="0 0 260 190" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="hero-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#E9B85D"/><stop offset="1" stop-color="#F6D99B"/></linearGradient></defs>
      <circle cx="134" cy="93" r="82" fill="#fff" opacity=".14"/>
      <path d="M15 164h230" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".35"/>
      <path d="M31 161V89l42-29 42 29v72" fill="#F2C77E" stroke="#fff" stroke-width="4"/>
      <path d="M44 106h58v55H44z" fill="#fff" opacity=".75"/><path d="M69 106v55" stroke="#D69A3D" stroke-width="4"/>
      <path d="M128 160q5-49 38-49t38 49" fill="#0B7A4B"/><circle cx="166" cy="75" r="24" fill="#874B32"/>
      <path d="M142 74q2-30 27-30 22 0 24 29-13-13-26-12-12 0-25 13" fill="#241E1A"/>
      <path d="M145 106l21 18 21-18" fill="none" stroke="#E7A63A" stroke-width="7" stroke-linecap="round"/>
      <path d="M152 126l-9 24m39-24 10 24" stroke="#F0B28A" stroke-width="9" stroke-linecap="round"/>
      <rect x="185" y="106" width="30" height="35" rx="6" fill="#E7A63A"/><path d="M191 106v-7q0-8 9-8t9 8v7" fill="none" stroke="#fff" stroke-width="4"/>
      <path d="M199 117l-7 9h7l-2 8 10-12h-7l2-5z" fill="#fff"/>
      <circle cx="48" cy="38" r="8" fill="#fff" opacity=".8"/><path d="M220 37l6 10 11 2-8 8 2 11-11-5-10 5 2-11-8-8 11-2z" fill="#fff" opacity=".75"/>
    </svg>`;
  }

  window.FSArt = { person, category, hero };
  const heroBox = document.getElementById("heroIllustration");
  if (heroBox) heroBox.innerHTML = hero();
})();