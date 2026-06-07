# 📋 Változásnapló — Vibekóding Tudásgömb

[![Changelog Badge](https://img.shields.io/badge/changelog-v1.0.0-FD7E14.svg?style=flat-square)]()
[![Build](https://img.shields.io/badge/build-passing-brightgreen.svg?style=flat-square)]()

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
