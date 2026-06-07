# 📋 Változásnapló — Vibekóding Tudásgömb

[![Changelog Badge](https://img.shields.io/badge/changelog-v1.1.1-FD7E14.svg?style=flat-square)]()
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg?style=flat-square)]()

---

## [1.1.1] - 2026-06-07 (Gemini BYOK & Intelligens Keresés Frissítés)

### 🔑 Bring Your Own Key (BYOK) & Biztonság
-   **Valós Idejű Rendszerkulcs-Ellenőrzés:** Az alkalmazás indításakor automatikusan lekérdezi a fejlesztői konténer `/api/health` állapotát. Ha van szerveroldali, titkosított `GEMINI_API_KEY` definiálva, az AI keresés zökkenőmentesen és azonnal használatra kész (nem kér plusz kulcsot tőled).
-   **Könnyített Kulcsbeírás:** Ha nincs titkos kulcs a szerveren, vagy ha egyéni kulcsot szeretnél használni, egy letisztult BYOK űrlapon adhatod meg azt. A biztonság kedvéért a korábbi csillagozott password mezőt kicseréltük **teljesen látható szövegdobozra (`type="text"`)**, hogy a kezdők kényelmesen láthassák és ellenőrizhessék, mit másolnak be.
-   **Integrált Google AI Studio Útmutató:** Beágyaztunk egy részletes, közvetlen útmutatót az ingyenes API kulcs megszerzéséhez egyenesen a [Google AI Studio](https://aistudio.google.com/) felületről, megkönnyítve az első lépéseket.
-   **Biztonságos Helyi Tárolás (localStorage):** A megadott kulcsod sosem kerül tárolásra a szerveroldalon, teljesen privát marad, kizárólag a te saját böngésződben (`localStorage`) tárolódik biztonságban.

### 🛡️ Formátumellenőrzés & Hibakezelés (BYOK Validation)
-   **Aktív Kezdőkarakter-Vizsgálat:** A beviteli mező folyamatosan validálja a kulcsot. Nem enged üresen menteni, és figyelmeztet, ha nem `AIzaSy` mintájú Gemini előtaggal kezdődik, vagy ha hossza nem éri el a minimális 35 karaktert.
-   **Elegáns és Stabil UI Viselkedés:** Kijavítottuk azt a hibát, ahol a mező kiürítésekor (például ha törölték az addigi kulcsot) az egész konfigurációs kártya eltűnt a képernyőről, ellehetetlenítve az új kulcs másolását. Mostantól üres állapotban is a háttérben stabilan ott marad a mező a placeholder szöveggel.
-   **Kompakt és Finomhangolt Dizájn:** A mentés gombot letisztultabbá tettük: a felesleges "Mentés" felirat helyett egy **ultramini, helytakarékos és precíz `Save` ikon** felel az elmentésért, hogy tökéletesen illeszkedjen még a legkeskenyebb oldalsávokba is.

---

## [1.0.0] - 2026-06-07 (Kezdeti Stabil Kiadás)

### 🚀 Új Funkciók és Vizuális Frissítések
-   **Vibekóding Tudásgömb Átnevezés:** A korábbi "Keyword Sphere" nevet az alkalmazás szintjén, a címsorban, a metaadatokban és a rendszerleírásban egységesen lecseréltük a felhasználó által kért **Vibekóding Tudásgömb** megnevezésre.
-   **Kezdeti Információs Rendszer (Bootstrapped Modal):**
    *   Létrehoztunk egy új, bal alsó sarokban lebegő információs vezérlőpultot (**ABOUT**, **HOWTO**, **DEV** gombokkal) egy prémium elmosott (acrylic backdrop-blur) modal ablak kíséretében.
    *   **ABOUT fül:** Részletes összefoglaló a rendszer céljáról és az AI, mint anyanyelvi leképezés alapjairól.
    *   **HOWTO fül:** Részletes navigáció, forgatás, zoom és szintenkénti kapcsolatmegjelenítési útmutató.
    *   **DEV fül:** Bemutatja a fejlesztő nevét (**Rózsavölgyi János**), beágyazza a hivatalos GitHub profilképet (`https://avatars.githubusercontent.com/u/67795466?s=96&v=4`), és aktív, kattintható gombként hivatkozik a [github.com/arlinamid](https://github.com/arlinamid) portfólióra.

### ⏱️ Hibajavítások (Bugs & Fixes)
-   **Óra Kijelzés Javítása:** A korábbi statikus, hardkódolt érték helyett egy másodpercenként frissülő, a böngésző helyi idejét másodperc pontossággal kiszámoló komponens fut (ÉÉÉÉ-HH-NN ÓÓ:PP:MS formátumban).
-   **Kapcsolati Háló Rendering Korrekció:** Kijavítottuk a 3D hálózaton belüli kapcsolati vonalak hiányos kirajzolását. A kategóriák közötti felesleges pókhálók helyett bevezettünk egy elegáns kör topológiát, miközben a kapcsolati vonalak felső határát 1200-ról **6000-re emeltük**, garantálva az összes megéredt összefüggés folyékony kirajzolását.
-   **Depth-2 Hálózat Felfedezés:** Ha rákattintanak egy szóra a gömbben, az immár dinamikusan előre betölti **az összes kapcsolódó szót legfeljebb 2 mélységig (depth-2)**. Amint egy másik szóra kattintanak, ezt a hálózatot azonnal és dinamikusan frissíti és újrakalkulálja.

### 📋 Kényelmi Fejlesztések (UX / Copy helper)
-   **Egyenként Másolható Mintamondatok:** Minden mintamondat sorában elhelyeztünk egy elegáns Lucide `Copy` ikont. Rákattintva az adott mondat azonnal a vágólapra kerül, jelezve a sikeres műveletet (`Check` pipa).
-   **Együttes Másolás a Megvalósítási Lépésekhez:** A "Megvalósítási Lépések" fejléc mellett elhelyeztünk egy **MÁSOL / MÁSOLVA** gombot, amivel a teljes checklist számozott formátumban azonnal egyben kimásolható.
-   **Együttes Másolás az Anti-Patternökhöz:** Hasonlóképp, az összetett Anti-Patternökhöz is kiépítettünk egy gyűjtő-másolás funkciót, hogy a fejlesztő azonnal elhelyezhesse az akadályozó tényezők listáját a saját fejlesztési jegyzeteiben.
