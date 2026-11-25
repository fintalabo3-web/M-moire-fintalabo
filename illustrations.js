/* FasoService — galerie SVG autonome : portraits métiers et pictogrammes uniques */
(() => {
  "use strict";
  const jobs = {
    "plombier": ["#DDF7F7","#087F8C",'<path d="M45 38v39q0 12 12 12h18q12 0 12-12V57h20" fill="none" stroke="#087F8C" stroke-width="11" stroke-linecap="round"/><path d="M99 43h20v20" fill="none" stroke="#F59E0B" stroke-width="8"/><path d="M110 76c0 10-8 17-17 17S76 86 76 76c0-8 17-28 17-28s17 20 17 28" fill="#38BDF8"/>'],
    "électricien": ["#FFF3CC","#B66A08",'<path d="M91 20L48 78h29l-8 43 46-61H85z" fill="#F59E0B" stroke="#B66A08" stroke-width="4" stroke-linejoin="round"/><path d="M35 43l9-9m72 71 9 9" stroke="#FBBF24" stroke-width="7" stroke-linecap="round"/>'],
    "serrurier": ["#E8E8FF","#5546A5",'<circle cx="62" cy="62" r="24" fill="none" stroke="#5546A5" stroke-width="12"/><path d="M81 79l39 39m-13-13 10-10m-21 0 10-10" stroke="#E6A23C" stroke-width="12" stroke-linecap="round"/>'],
    "vulcanisateur": ["#E9EEF4","#334155",'<circle cx="80" cy="69" r="43" fill="#334155"/><circle cx="80" cy="69" r="25" fill="#E9EEF4"/><circle cx="80" cy="69" r="11" fill="#F59E0B"/><path d="M49 35l9 9m44-9-9 9M49 103l9-9m44 9-9-9" stroke="#94A3B8" stroke-width="7"/>'],
    "mécanicien": ["#E1F0FF","#1D4ED8",'<path d="M36 91h88l-9-28H54z" fill="#2563EB"/><path d="M53 63l12-19h31l17 19" fill="#60A5FA"/><circle cx="57" cy="94" r="12" fill="#263238"/><circle cx="104" cy="94" r="12" fill="#263238"/><path d="M83 30a17 17 0 0 0 19 21l-35 36-15-15 36-35A17 17 0 0 0 83 30z" fill="#F59E0B"/>'],
    "réparateur téléphone": ["#FCE7F3","#BE185D",'<rect x="51" y="20" width="58" height="101" rx="12" fill="#334155"/><rect x="57" y="30" width="46" height="76" rx="5" fill="#FBCFE8"/><circle cx="80" cy="113" r="4" fill="#fff"/><path d="M31 65l18-12m-18 12 18 12" stroke="#BE185D" stroke-width="7" stroke-linecap="round"/>'],
    "frigoriste": ["#E0F2FE","#0284C7",'<rect x="47" y="20" width="66" height="101" rx="9" fill="#fff" stroke="#0284C7" stroke-width="7"/><path d="M47 67h66M99 37v19m0 28v19" stroke="#38BDF8" stroke-width="5" stroke-linecap="round"/><path d="M30 35l12 7-12 7m88-14 12 7-12 7M80 91v22m-10-11h20m-17-7 14 14m0-14-14 14" stroke="#0284C7" stroke-width="4" stroke-linecap="round"/>'],
    "maçon": ["#FDEBD5","#A64B16",'<path d="M31 48h98v69H31z" fill="#C66A35"/><path d="M31 71h98M31 94h98M63 48v23m35 0v23M63 94v23" stroke="#FFF1D6" stroke-width="6"/><path d="M42 30h76" stroke="#8B4513" stroke-width="9" stroke-linecap="round"/>'],
    "peintre": ["#FCE7F3","#BE185D",'<path d="M49 28h62v35H49z" rx="7" fill="#EC4899"/><path d="M80 63v49" stroke="#A16207" stroke-width="9" stroke-linecap="round"/><path d="M63 111h34" stroke="#A16207" stroke-width="10" stroke-linecap="round"/><path d="M45 42h70" stroke="#fff" stroke-width="5"/>'],
    "menuisier": ["#F5E9D7","#92400E",'<path d="M35 45l44-20 46 20-46 22z" fill="#D6A56B"/><path d="M79 67v47M35 45v53l44 22 46-22V45" fill="none" stroke="#92400E" stroke-width="7"/><path d="M48 34l64 29" stroke="#FDE68A" stroke-width="5"/>'],
    "carreleur": ["#E0F2FE","#0369A1",'<path d="M35 31h90v90H35z" fill="#fff" stroke="#0369A1" stroke-width="6"/><path d="M80 31v90M35 76h90" stroke="#38BDF8" stroke-width="6"/><path d="M42 39l30 30m16 16 30 30" stroke="#BAE6FD" stroke-width="5"/>'],
    "plaquiste": ["#F1F5F9","#475569",'<rect x="39" y="24" width="82" height="96" rx="4" fill="#fff" stroke="#64748B" stroke-width="6"/><path d="M53 24v96m54-96v96M39 54h82m-82 36h82" stroke="#94A3B8" stroke-width="4" stroke-dasharray="5 5"/><path d="M69 44l22 22-22 22" fill="none" stroke="#F59E0B" stroke-width="7"/>'],
    "vitrier": ["#DBF4F7","#0E7490",'<rect x="39" y="24" width="82" height="96" rx="5" fill="#BAE6FD" fill-opacity=".7" stroke="#0E7490" stroke-width="7"/><path d="M80 24v96M39 72h82" stroke="#fff" stroke-width="6"/><path d="M94 37l-13 25 16 9-18 29" fill="none" stroke="#0E7490" stroke-width="5"/>'],
    "soudeur": ["#FFF1D6","#B45309",'<path d="M46 94l28-29 16 15-28 29z" fill="#64748B"/><path d="M84 69l20-29 11 10-19 29" fill="#334155"/><path d="M112 27l4 13 13 4-13 5-4 13-5-13-12-5 12-4zM43 33l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#F59E0B"/>'],
    "forgeron": ["#FDE8D0","#9A3412",'<path d="M31 80h98v22H31z" fill="#475569"/><path d="M47 80V61h66v19" fill="#64748B"/><path d="M58 60l22-28 22 28" fill="none" stroke="#9A3412" stroke-width="10"/><path d="M80 19v19m-13-12 13 12 13-12" stroke="#F59E0B" stroke-width="6" stroke-linecap="round"/>'],
    "couturière": ["#FCE7F3","#BE185D",'<path d="M80 24l34 23-11 68H57L46 47z" fill="#EC4899"/><path d="M80 24v91M47 48q33 20 66 0" stroke="#fff" stroke-width="5" fill="none"/><path d="M115 31l-47 60" stroke="#64748B" stroke-width="5"/><circle cx="63" cy="98" r="6" fill="#F59E0B"/>'],
    "coiffeur": ["#FCE7F3","#9D174D",'<path d="M37 49q43-40 86 0" fill="none" stroke="#334155" stroke-width="10" stroke-linecap="round"/><path d="M42 56h76" stroke="#EC4899" stroke-width="8"/><circle cx="56" cy="88" r="15" fill="none" stroke="#64748B" stroke-width="7"/><circle cx="104" cy="88" r="15" fill="none" stroke="#64748B" stroke-width="7"/><path d="M68 100l24-24" stroke="#64748B" stroke-width="7"/>'],
    "blanchisseur": ["#E0F2FE","#0369A1",'<path d="M48 34h64l-5 83H53z" fill="#fff" stroke="#0369A1" stroke-width="6"/><path d="M48 50h64M80 50v67" stroke="#7DD3FC" stroke-width="5"/><path d="M64 22q-8 12 0 19m16-22q-8 12 0 19m16-16q-8 12 0 19" fill="none" stroke="#38BDF8" stroke-width="5" stroke-linecap="round"/>'],
    "ménage": ["#E0F2FE","#0F766E",'<path d="M91 25l-31 79" stroke="#A16207" stroke-width="9" stroke-linecap="round"/><path d="M49 96l35 14-11 18-35-14z" fill="#14B8A6"/><path d="M105 33l4-13 4 13 13 4-13 4-4 13-4-13-13-4z" fill="#F59E0B"/><path d="M32 51l3-9 3 9 9 3-9 3-3 9-3-9-9-3z" fill="#38BDF8"/>'],
    "livreur / coursier": ["#FFEDD5","#C2410C",'<circle cx="49" cy="103" r="17" fill="none" stroke="#334155" stroke-width="7"/><circle cx="112" cy="103" r="17" fill="none" stroke="#334155" stroke-width="7"/><path d="M49 103l20-36h23l20 36H49l22-36m21 0 12-16" fill="none" stroke="#EA580C" stroke-width="7" stroke-linejoin="round"/><rect x="65" y="29" width="39" height="27" rx="5" fill="#F59E0B"/>'],
    "chauffeur / transport": ["#DBEAFE","#1D4ED8",'<path d="M28 78l11-29q4-10 15-10h52q11 0 15 10l11 29v34H28z" fill="#2563EB"/><path d="M47 55h66l9 24H38z" fill="#BAE6FD"/><circle cx="51" cy="111" r="12" fill="#1E293B"/><circle cx="109" cy="111" r="12" fill="#1E293B"/>'],
    "jardinier": ["#DCFCE7","#15803D",'<path d="M80 115V61" stroke="#15803D" stroke-width="8" stroke-linecap="round"/><path d="M78 80Q36 81 38 39q37-2 40 41M84 69q0-40 40-43 5 36-40 43" fill="#4ADE80"/><path d="M38 117q42-22 84 0" stroke="#A16207" stroke-width="8" stroke-linecap="round"/>'],
    "garde d'enfants": ["#FCE7F3","#BE185D",'<circle cx="58" cy="55" r="17" fill="#D97757"/><circle cx="103" cy="70" r="13" fill="#F0B28A"/><path d="M31 119q3-42 27-42t27 42M82 119q2-30 21-30t24 30" fill="#EC4899"/><path d="M48 51q10-20 23-4" stroke="#211D1A" stroke-width="8" stroke-linecap="round"/>'],
    "aide-soignant": ["#DCFCE7","#047857",'<path d="M80 112S29 80 42 51q13-22 38 0 25-22 38 0 13 29-38 61" fill="#10B981"/><path d="M80 52v35m-17-18h34" stroke="#fff" stroke-width="9" stroke-linecap="round"/>'],
    "professeur particulier": ["#EDE9FE","#6D28D9",'<path d="M29 47l51-24 51 24-51 24z" fill="#8B5CF6"/><path d="M48 62v35q32 20 64 0V62" fill="#C4B5FD"/><path d="M130 49v44" stroke="#F59E0B" stroke-width="5"/><circle cx="130" cy="99" r="7" fill="#F59E0B"/><path d="M63 82h34" stroke="#fff" stroke-width="5"/>'],
    "masseur / kinésithérapeute": ["#FCE7F3","#BE185D",'<path d="M34 76q17-31 39 0l7 9 7-9q22-31 39 0-4 26-46 46-42-20-46-46" fill="#F9A8D4"/><path d="M48 48l14 12m50-12L98 60" stroke="#BE185D" stroke-width="8" stroke-linecap="round"/>'],
    "traiteur": ["#FFEDD5","#C2410C",'<path d="M38 65h84v43q0 14-14 14H52q-14 0-14-14z" fill="#F97316"/><path d="M30 65h100" stroke="#9A3412" stroke-width="8" stroke-linecap="round"/><path d="M48 57q-8-24 14-28 18-22 35 0 20 4 15 28" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>'],
    "photographe": ["#E0E7FF","#4338CA",'<rect x="27" y="48" width="106" height="66" rx="12" fill="#4338CA"/><path d="M48 48l9-15h42l10 15" fill="#6366F1"/><circle cx="80" cy="81" r="25" fill="#C7D2FE"/><circle cx="80" cy="81" r="15" fill="#312E81"/><circle cx="86" cy="75" r="5" fill="#fff"/>'],
    "vidéaste": ["#E0F2FE","#0369A1",'<rect x="30" y="48" width="80" height="63" rx="9" fill="#334155"/><path d="M110 65l25-15v60l-25-15z" fill="#0EA5E9"/><circle cx="70" cy="79" r="20" fill="#BAE6FD"/><circle cx="70" cy="79" r="11" fill="#0F172A"/><path d="M49 40l-8-14m39 14 8-14" stroke="#F59E0B" stroke-width="6"/>'],
    "décorateur événementiel": ["#FCE7F3","#BE185D",'<path d="M55 73q-18-34 4-43 25-4 18 43M105 73q-18-34 4-43 25-4 18 43" fill="#F472B6"/><path d="M67 73v40m50-40v40" stroke="#BE185D" stroke-width="3"/><path d="M80 78l7 14 15 2-11 10 3 15-14-8-14 8 3-15-11-10 15-2z" fill="#F59E0B"/>'],
    "musicien / dj": ["#F3E8FF","#7E22CE",'<path d="M42 49v40q0 27 24 27t24-27V49" fill="none" stroke="#7E22CE" stroke-width="11"/><path d="M42 63H29v24h13m48-24h13v24H90" fill="none" stroke="#A855F7" stroke-width="8"/><path d="M104 45l22-15m-19 30 25 1" stroke="#F59E0B" stroke-width="6" stroke-linecap="round"/>'],
    "informaticien": ["#DBEAFE","#1D4ED8",'<rect x="27" y="27" width="106" height="76" rx="8" fill="#1E3A8A"/><rect x="35" y="35" width="90" height="59" rx="3" fill="#BFDBFE"/><path d="M67 53l-13 12 13 12m26-24 13 12-13 12m-7-19-9 26" fill="none" stroke="#2563EB" stroke-width="5" stroke-linecap="round"/><path d="M17 116h126l-13 9H30z" fill="#64748B"/>'],
    "antenniste": ["#E0F2FE","#0369A1",'<path d="M80 111V64m-18 47h36" stroke="#475569" stroke-width="8" stroke-linecap="round"/><path d="M80 64L52 37q28-20 56 0z" fill="#38BDF8" stroke="#0369A1" stroke-width="5"/><path d="M46 24q-18 18 0 36m68-36q18 18 0 36M31 13q-30 29 0 58m98-58q30 29 0 58" fill="none" stroke="#0EA5E9" stroke-width="4" stroke-linecap="round"/>'],
    "assainissement": ["#D1FAE5","#047857",'<path d="M80 23C80 23 43 70 43 91a37 37 0 0 0 74 0C117 70 80 23 80 23z" fill="#10B981"/><path d="M61 92q4 18 21 18" fill="none" stroke="#D1FAE5" stroke-width="7" stroke-linecap="round"/><path d="M111 35l13 13m-13 0 13-13" stroke="#F59E0B" stroke-width="5" stroke-linecap="round"/>'],
    "déménageur": ["#FFEDD5","#C2410C",'<path d="M38 51h84v67H38z" fill="#D97706"/><path d="M38 73h84M80 51v67" stroke="#FDE68A" stroke-width="5"/><path d="M64 51V39h32v12m-16 22 10 10-10 10-10-10z" fill="none" stroke="#fff" stroke-width="5"/>'],
    "agent de sécurité": ["#E0E7FF","#3730A3",'<path d="M80 20l48 18v31q0 37-48 54Q32 106 32 69V38z" fill="#4F46E5"/><path d="M80 38l30 11v20q0 23-30 38-30-15-30-38V49z" fill="#C7D2FE"/><path d="M64 72l11 11 23-26" fill="none" stroke="#3730A3" stroke-width="8" stroke-linecap="round"/>'],
    "cordonnier": ["#F5E9D7","#92400E",'<path d="M33 83q30 0 47-31l19 17q9 8 27 10 12 2 12 15v17H33z" fill="#A16207"/><path d="M34 99h103" stroke="#FDE68A" stroke-width="6"/><path d="M66 72l14 14" stroke="#fff" stroke-width="4"/>'],
    "bijoutier": ["#FEF3C7","#A16207",'<path d="M51 37h58l20 28-49 57-49-57z" fill="#F59E0B"/><path d="M51 37l29 85 29-85M31 65h98M51 37l29 28 29-28" fill="none" stroke="#fff" stroke-width="5"/><path d="M80 14l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z" fill="#FDE68A"/>'],
    "fleuriste": ["#FCE7F3","#BE185D",'<path d="M80 110V65" stroke="#15803D" stroke-width="7"/><path d="M80 78q-36 4-35-26 31-6 35 26m0-12q3-32 34-31 5 30-34 31" fill="#4ADE80"/><g fill="#F472B6"><circle cx="80" cy="45" r="14"/><circle cx="65" cy="34" r="13"/><circle cx="95" cy="34" r="13"/><circle cx="67" cy="53" r="13"/><circle cx="93" cy="53" r="13"/></g><circle cx="80" cy="43" r="9" fill="#F59E0B"/>'],
    "graphiste": ["#F3E8FF","#7E22CE",'<path d="M80 24a54 54 0 1 0 54 54q0-15-18-15h-8q-9 0-9-9 0-8 8-8 12 0 12-9 0-13-39-13z" fill="#A78BFA"/><circle cx="54" cy="63" r="7" fill="#F472B6"/><circle cx="76" cy="44" r="7" fill="#F59E0B"/><circle cx="98" cy="54" r="7" fill="#34D399"/><circle cx="55" cy="88" r="7" fill="#38BDF8"/>'],
    "imprimeur / sérigraphie": ["#E0F2FE","#0369A1",'<rect x="40" y="45" width="80" height="62" rx="9" fill="#64748B"/><rect x="51" y="22" width="58" height="40" fill="#fff" stroke="#0369A1" stroke-width="5"/><path d="M56 32h48m-48 11h38" stroke="#38BDF8" stroke-width="4"/><path d="M55 90h50v29H55z" fill="#F59E0B"/><circle cx="108" cy="75" r="5" fill="#4ADE80"/>'],
    "autre métier": ["#E2E8F0","#475569",'<rect x="34" y="42" width="92" height="69" rx="12" fill="#64748B"/><path d="M56 42V31q0-8 9-8h30q9 0 9 8v11" fill="none" stroke="#475569" stroke-width="8"/><path d="M80 58v37m-18-18h36" stroke="#F59E0B" stroke-width="8" stroke-linecap="round"/>']
  };
  const aliases = [
    ["plomb","plombier"],["électric","électricien"],["serrur","serrurier"],["vulcan","vulcanisateur"],["mécan","mécanicien"],["réparateur téléphone","réparateur téléphone"],["téléphone","réparateur téléphone"],["frigor","frigoriste"],["maçon","maçon"],["peint","peintre"],["menuis","menuisier"],["carre","carreleur"],["plaqu","plaquiste"],["vitri","vitrier"],["soud","soudeur"],["forger","forgeron"],["coutur","couturière"],["coiff","coiffeur"],["blanch","blanchisseur"],["ménage","ménage"],["nettoy","ménage"],["livreur","livreur / coursier"],["coursier","livreur / coursier"],["chauffeur","chauffeur / transport"],["transport","chauffeur / transport"],["jardin","jardinier"],["garde","garde d'enfants"],["soignant","aide-soignant"],["prof","professeur particulier"],["masseur","masseur / kinésithérapeute"],["kiné","masseur / kinésithérapeute"],["traiteur","traiteur"],["photograph","photographe"],["vidéo","vidéaste"],["décorateur","décorateur événementiel"],["musicien","musicien / dj"],["dj","musicien / dj"],["informatic","informaticien"],["anten","antenniste"],["assain","assainissement"],["déménag","déménageur"],["sécurité","agent de sécurité"],["cordonn","cordonnier"],["bijout","bijoutier"],["fleur","fleuriste"],["graph","graphiste"],["imprimeur","imprimeur / sérigraphie"],["sérigraph","imprimeur / sérigraphie"]
  ];
  const skinTones = ["#8D5038","#A96545","#70402F","#B87956","#925B43","#C18462"];
  const hairTones = ["#211B18","#30221C","#171717","#3A241B"];
  const shirts = ["#087F5B","#1D4ED8","#B45309","#7E22CE","#BE185D","#0F766E","#334155"];
  const esc = value => String(value || "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function hash(value){return [...String(value||"FasoService")].reduce((n,c)=>((n*31)+c.charCodeAt(0))>>>0,7);}
  function palette(seed){const h=hash(seed)%360;return {h,bg:`hsl(${h} 88% 94%)`,deep:`hsl(${h} 72% 38%)`,shirt:shirts[hash(seed+"shirt")%shirts.length],skin:skinTones[hash(seed+"skin")%skinTones.length],hair:hairTones[hash(seed+"hair")%hairTones.length]};}
  function person(category, compact){
    const label=esc(category||"Prestataire"), p=palette(category), female=/coutur|coiff|ménage|garde|fleur|blanch/i.test(category||"");
    const headX=80+(hash(category)%7-3), skin=p.skin, hair=p.hair;
    const uniform=/électric|plomb|mécan|maçon|soud|menuis|frigor|peint|jardin|sécurité/i.test(category||"");
    const accessory=uniform
      ? '<path d="M48 67q0-35 32-35t32 35" fill="#F59E0B" stroke="#9A5B13" stroke-width="4"/><path d="M45 67h70" stroke="#fff" stroke-width="5"/>'
      : /soignant|kiné|masseur/i.test(category||"")
      ? '<path d="M111 111v24m-12-12h24" stroke="#fff" stroke-width="8" stroke-linecap="round"/>'
      : /photograph|vidéo/i.test(category||"")
      ? '<rect x="103" y="106" width="32" height="23" rx="5" fill="#263238"/><circle cx="119" cy="117" r="7" fill="#93C5FD"/>'
      : /prof/i.test(category||"")
      ? '<path d="M104 111h29v23h-29z" fill="#fff"/><path d="M110 118h17m-17 7h12" stroke="#64748B" stroke-width="3"/>'
      : '<path d="M120 113l9 9-9 9-9-9z" fill="#FBBF24"/>';
    const hairShape=female
      ? `<path d="M${headX-27} 76q-12-46 26-49 43-1 34 49l-8 34-12-16H${headX-9}l-13 16z" fill="${hair}"/>`
      : `<path d="M${headX-25} 61q0-31 26-32 29-1 29 31-13-12-28-12-14 0-27 13" fill="${hair}"/>`;
    const full = `<svg viewBox="0 0 160 160" role="img" aria-label="Portrait illustré d'un professionnel : ${label}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="portrait-bg-${p.h}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p.bg}"/><stop offset="1" stop-color="#fff"/></linearGradient><linearGradient id="shirt-${p.h}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${p.shirt}"/><stop offset="1" stop-color="#142D3A"/></linearGradient></defs>
      <rect width="160" height="160" rx="24" fill="url(#portrait-bg-${p.h})"/>
      <circle cx="130" cy="29" r="19" fill="#fff" opacity=".65"/><circle cx="22" cy="121" r="13" fill="${p.deep}" opacity=".12"/>
      <path d="M17 160q5-52 63-52t63 52" fill="url(#shirt-${p.h})"/>
      <path d="M58 111l22 24 22-24-10-16H68z" fill="${skin}"/>
      <path d="M60 112l20 23 20-23-9-10H69z" fill="#fff" opacity=".9"/>
      <ellipse cx="${headX}" cy="67" rx="27" ry="34" fill="${skin}"/>
      <ellipse cx="${headX-27}" cy="72" rx="5" ry="9" fill="${skin}"/><ellipse cx="${headX+27}" cy="72" rx="5" ry="9" fill="${skin}"/>
      ${hairShape}
      <path d="M${headX-15} 67q6-4 12 0m8 0q6-4 12 0" stroke="${hair}" stroke-width="3" stroke-linecap="round" fill="none"/>
      <ellipse cx="${headX-9}" cy="73" rx="2.5" ry="3" fill="#211B18"/><ellipse cx="${headX+9}" cy="73" rx="2.5" ry="3" fill="#211B18"/>
      <path d="M${headX} 75l-4 12 7 2" stroke="#74412F" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M${headX-8} 94q8 6 16 0" stroke="#7B332E" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="${headX-16}" cy="84" rx="5" ry="3" fill="#E98B76" opacity=".25"/><ellipse cx="${headX+16}" cy="84" rx="5" ry="3" fill="#E98B76" opacity=".25"/>
      <path d="M56 120l24 25 24-25" fill="none" stroke="#fff" stroke-width="4" opacity=".85"/>
      ${accessory}
      <circle cx="27" cy="29" r="4" fill="#F59E0B"/><path d="M132 87l5 8 9 2-7 6 2 9-9-5-8 5 2-9-7-6 9-2z" fill="#F59E0B" opacity=".9"/>
    </svg>`;
    return full;
  }
  function category(name){
    const n=String(name||"").toLowerCase();
    const match=aliases.find(([key])=>n.includes(key));
    const key=match?match[1]:"autre métier", item=jobs[key]||jobs["autre métier"];
    const p=palette(key);
    return `<svg viewBox="0 0 160 140" role="img" aria-label="Icône métier : ${esc(name)}" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="job-bg-${p.h}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${item[0]}"/><stop offset="1" stop-color="#fff"/></linearGradient><filter id="job-shadow-${p.h}" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="${item[1]}" flood-opacity=".18"/></filter></defs>
      <rect x="3" y="3" width="154" height="134" rx="23" fill="url(#job-bg-${p.h})"/>
      <circle cx="128" cy="24" r="16" fill="#fff" opacity=".65"/><circle cx="28" cy="111" r="10" fill="${item[1]}" opacity=".10"/>
      <g filter="url(#job-shadow-${p.h})">${item[2]}</g>
      <path d="M18 125h124" stroke="${item[1]}" stroke-width="4" stroke-linecap="round" opacity=".2"/>
      <circle cx="132" cy="112" r="4" fill="#F59E0B"/>
    </svg>`;
  }
  function hero(){return `<svg viewBox="0 0 260 190" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="hero-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FBBF24"/><stop offset=".55" stop-color="#F59E0B"/><stop offset="1" stop-color="#0B7A4B"/></linearGradient></defs><circle cx="134" cy="93" r="82" fill="#fff" opacity=".16"/><path d="M15 164h230" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".35"/><path d="M31 161V89l42-29 42 29v72" fill="#FDE68A" stroke="#fff" stroke-width="4"/><path d="M44 106h58v55H44z" fill="#fff" opacity=".8"/><path d="M128 160q5-49 38-49t38 49" fill="#0B7A4B"/><circle cx="166" cy="75" r="24" fill="#925B43"/><path d="M142 74q2-30 27-30 22 0 24 29-13-13-26-12-12 0-25 13" fill="#211B18"/><path d="M145 106l21 18 21-18" fill="none" stroke="#FBBF24" stroke-width="7" stroke-linecap="round"/><rect x="185" y="106" width="30" height="35" rx="6" fill="#F59E0B"/><path d="M199 117l-7 9h7l-2 8 10-12h-7l2-5z" fill="#fff"/><circle cx="48" cy="38" r="8" fill="#fff" opacity=".8"/><path d="M220 37l6 10 11 2-8 8 2 11-11-5-10 5 2-11-8-8 11-2z" fill="#fff" opacity=".8"/></svg>`;}
  window.FSArt={person,category,hero};
  const heroBox=document.getElementById("heroIllustration");if(heroBox)heroBox.innerHTML=hero();
})();