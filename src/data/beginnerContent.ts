/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KeywordNode } from "../types";

export interface BeginnerData {
  whatIsThis: string;
  whenToUse: string;
  blockerSolved: string;
  promptInstructions: string;
}

export function getBeginnerExplanation(node: KeywordNode): BeginnerData {
  const g = node.group;

  // 1. General group fallback values
  let whatIsThis = node.description;
  let whenToUse = "Amikor a kód fejlesztés közben stabil áramlást igényel.";
  let blockerSolved = "Megszünteti a vakrepülést és rendszerezi az AI-jal írt kódokat.";
  let promptInstructions = `Így kérd meg az AI-t a(z) "${node.label}" használatára:`;

  if (g === "vibe_coding") {
    whenToUse = "A fejlesztés indításánál, a célok tisztázásánál és a kódváltozások rendszerezésekor.";
    blockerSolved = "Megelőzi az AI által generált felesleges kódokat (AI slop), és átláthatóvá teszi, ki mit csinál.";
    promptInstructions = `Mondd ezt az AI-nak: "Fókuszáljunk a(z) ${node.label} elveire. Készíts egy tiszta tervet, ami nem lépi túl a hatókört!"`;
  } else if (g === "ui_ux") {
    whenToUse = "Amikor a felület logikai elrendezését, a gombok helyét és az elemek távolságát határozod meg.";
    blockerSolved = "Megszünteti a kusza elrendezést és a rossz kontrasztot. Segít, hogy a felhasználó azonnal megtalálja az akciókat.";
    promptInstructions = `Mondd ezt az AI-nak: "Segíts megtervezni a(z) ${node.label} elrendezését Tailwind osztályokkal, követve a modern vizuális hierarchiát!"`;
  } else if (g === "frontend_ui") {
    whenToUse = "Amikor konkrét HTML elrendezéseket, CSS animációkat vagy komponens-könyvtárakat programozol a böngészőnek.";
    blockerSolved = "Megoldja a merev dizájn és a széteső mobilnézet problémáját. Gyors, reszponzív felületeket nyújt.";
    promptInstructions = `Mondd ezt az AI-nak: "Írj egy tiszta React komponenst ${node.label} használatával. Legyen teljesen reszponzív és akadálymentes!"`;
  } else if (g === "ux_states") {
    whenToUse = "Amikor a hálózati kérések alatt betöltést, sikert vagy hibát akarsz mutatni a felhasználónak.";
    blockerSolved = "Elkerüli a 'lefagyott képernyő' élményt. A felhasználó mindig tudja, hogy az app éppen dolgozik.";
    promptInstructions = `Mondd ezt az AI-nak: "Ügyelj az UX állapotokra! Adj hozzá ${node.label} visszajelzést erre a gombra, miközben az API kérés fut!"`;
  } else if (g === "frontend_architecture") {
    whenToUse = "Amikor a komponensektől elkülönített adatlekérdezést, kliensoldali cache-elést és állapotkezelést végzed.";
    blockerSolved = "Megakadályozza a felesleges API lekéréseket és a komponensek közötti végtelen re-rendereket.";
    promptInstructions = `Mondd ezt az AI-nak: "Használjunk ${node.label} mintát az adatok rendszerezésére, optimalizálva a teljesítményt!"`;
  } else if (g === "backend") {
    whenToUse = "Szerveroldali adatfeldolgozásnál, API útvonalak és biztonságos proxy hívások kialakításakor.";
    blockerSolved = "Eltakarja a titkos API kulcsokat a külső világ elől és központi logikát nyújt az üzleti folyamatokhoz.";
    promptInstructions = `Mondd ezt az AI-nak: "Hozzá szeretnék adni egy ${node.label} Express API végpontot. Legyen benne hibakezelés és validáció!"`;
  } else if (g === "database") {
    whenToUse = "Amikor adatokat kell mentened és előhívnod úgy, hogy böngészőbezárás után se vesszenek el.";
    blockerSolved = "Megszünteti a helyi memóriavesztést és megbízható adatkapcsolati sémákat biztosít a backendnek.";
    promptInstructions = `Mondd ezt az AI-nak: "Tervezz egy Firestore/SQL sémát a(z) ${node.label} tárolásához, és mutass rá az indexelési szabályokra!"`;
  } else if (g === "authentication") {
    whenToUse = "Amikor regisztrációt, bejelentkezést, vagy biztonságosan védett oldalakat építesz be.";
    blockerSolved = "Hárítja az illetéktelen adatbetekintést és gondoskodik a felhasználó bejelentkezve tartásáról.";
    promptInstructions = `Mondd ezt az AI-nak: "Biztosítsd ezt az útvonalat ${node.label} hitelesítéssel. Mutasd meg, hogyan kezeljük a session lejárást!"`;
  } else if (g === "security") {
    whenToUse = "Biztonsági kockázatok, adatszivárgások és jogosulatlan külső API kérések megelőzésére.";
    blockerSolved = "Kivédi a rosszindulatú kód-injektálásokat (XSS), a külső domainek illetéktelen hozzáférését (CORS).";
    promptInstructions = `Mondd ezt az AI-nak: "Ellenőrizd ezt a kódrészletet ${node.label} szempontjából, és zárd be a potenciális biztonsági réseket!"`;
  } else if (g === "debugging") {
    whenToUse = "Amikor a kód összeomlik vagy nem a várt módon működik, és meg kell találnod a rejtélyes bug okát.";
    blockerSolved = "Leállítja a sötétben tapogatózó találgatást: pontos visszacsatolást ad a hibás sorról és az állapotról.";
    promptInstructions = `Mondd ezt az AI-nak: "Itt van a konzol hibaüzenetem. Magyarázd meg ${node.label} segítségével, hogy mi csúszott el és hogyan orvosolható!"`;
  } else if (g === "testing_qa") {
    whenToUse = "Amikor minőségi garanciát akarsz arra, hogy egy új funkció nem töri össze a már kész, működő részeket.";
    blockerSolved = "Garantálja, hogy a kódod holnap is ép marad. Automatikusan teszteli a szoftver elvárt viselkedéseit.";
    promptInstructions = `Mondd ezt az AI-nak: "Írj egy automatizált ${node.label} tesztet erre a komponensre, lefuttatva a legfontosabb teszt-eseteket!"`;
  } else if (g === "devops_deploy") {
    whenToUse = "Amikor meg akarod mutatni a kész alkalmazást a világnak az interneten vagy automatizálnád a közzétételt.";
    blockerSolved = "Megszünteti a kézi fájl-feltöltögetést és a 'nálam még működött' feszültségeket.";
    promptInstructions = `Mondd ezt az AI-nak: "Segíts beállítani egy ${node.label} pipeline-t a GitHub Actions-en a felhőbe történő automatikus élesítéshez!"`;
  } else if (g === "observability") {
    whenToUse = "Az éles környezet távoli megfigyelésére, amikor látni akarod a háttérben futó hibákat még a hibajelzések előtt.";
    blockerSolved = "Megszünteti a láthatatlanságot. Azonnali gombnyomásra értesít, ha egy felhasználónál elszáll a felület.";
    promptInstructions = `Mondd ezt az AI-nak: "Konfiguráljuk be a(z) ${node.label} integrációt az Express szerverünkön a távoli hibák rögzítéséhez!"`;
  } else if (g === "performance") {
    whenToUse = "Amikor az oldal túl lassan tölt be, és szeretnéd felgyorsítani a felhasználók gépein.";
    blockerSolved = "Megelőzi a felhasználók elvándorlását. A villámgyors betöltés növeli az elégedettséget és a konverziót.";
    promptInstructions = `Mondd ezt az AI-nak: "Mutass 3 konkrét ${node.label} optimalizálási tippet a React kódunkhoz a Google Lighthouse pontszám növelésére!"`;
  } else if (g === "accessibility") {
    whenToUse = "Amikor törődsz a látássérült, képernyőolvasót vagy csak billentyűzetet használó látogatókkal is.";
    blockerSolved = "Biztosítja a törvényi és felhasználóbarát megfelelést, növelve az oldalad hozzáférhetőségét.";
    promptInstructions = `Mondd ezt az AI-nak: "Alakítsuk át ezt a form-ot, hogy megfeleljen az ARIA szabványoknak és ${node.label} szabályainak!"`;
  } else if (g === "ai_agentic") {
    whenToUse = "Amikor az AI asszisztensnek akarsz adni olyan eszközöket (tools), amelyekkel önállóan elvégezhet feladatokat.";
    blockerSolved = "Kiterjeszti az egyszerű beszélgetést valós cselekvéssé: valódi adatbázis-lekérések és külső hívások valósulnak meg.";
    promptInstructions = `Mondd ezt az AI-nak: "Építsünk egy ${node.label} modellt a Google GenAI SDK segítségével, amivel az ügynök önállóan képes adatokat lekérni!"`;
  } else if (g === "documentation") {
    whenToUse = "A kód lezárásakor, hogy a csapatod többi tagja (és az AI) is azonnal képbe kerüljön a projekttel.";
    blockerSolved = "Megspórolja az órákig tartó magyarázkodást és az onboarding időszakot.";
    promptInstructions = `Mondd ezt az AI-nak: "Írj egy kiváló, részletes ${node.label} dokumentációt ehhez a modulhoz, példákkal kiegészítve!"`;
  }

  return {
    whatIsThis,
    whenToUse,
    blockerSolved,
    promptInstructions
  };
}
