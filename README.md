# 🌐 Vibekóding Tudásgömb — AI Fejlesztői Tudástérkép

[![Status](https://img.shields.io/badge/status-stable-emerald.svg?style=flat-square)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square)]()
[![Engine](https://img.shields.io/badge/engine-Three.js-orange.svg?style=flat-square)]()
[![Author](https://img.shields.io/badge/author-Rózsavölgyi%20János-ff69b4.svg?style=flat-square)]()

A **Vibekóding Tudásgömb** egy interaktív, 3D hangulatalapú (Vibe Coding) szoftveres és prompt-mérnöki tudásgráf. A hálózat magával ragadó vizuális reprezentációt nyújt a modern szoftverfejlesztési tudásanyagokról: AI asszisztenciáról, Prompt Engineeringről, UI/UX elvekről, Backend rendszerekről, Adatbázisokról és Biztonsági szabványokról.

---

## ✨ Kiemelt Funkciók

*   **Interaktív 3D Háromdimenziós Tér (Three.js WebGL):** Fluid forgatás, görgős mélységállítás (zoom) és érintésérzékeny navigáció.
*   **Intelligens Level of Detail (LOD) & Depth-2 renderelés:** Sávszélesség-takarékos és processzor-kímélő rendering pipeline. Ha nincs kiválasztott szó, a gömb optimalizált "Chaos" nézetben lebeg. Amikor rákattintasz egy szóra:
    *   Az adott szó automatikusan fókuszba lép.
    *   **Maximum 2 mélységig (depth-2)** minden hozzá kapcsolódó szó és reláció azonnal, hiánytalanul kirajzolódik a térben.
*   **Intelligens AI Keresés (Gemini BYOK):** Gépi tanulással kiegészített, szemantikus kulcsszókereső motor:
    *   **Auto-Aktív Kulcsok:** Ha az alkalmazásban már be van állítva egy központi AI kulcs, a rendszer azonnal működésbe lép.
    *   **Egyéni Kulcs Integráció (BYOK):** Lehetőség van saját Gemini API kulcs használatára is. A kulcs a böngészőben (`localStorage`) tárolódik, adatbázisba nem kerül, de az AI keresés futtatásakor a saját backendnek továbbítjuk, mert a szerver hívja meg a Gemini API-t.
    *   **Aktív Kezdőkarakter-Vizsgálat:** A beviteli mező automatikusan ellenőrzi a formátumot (`AIzaSy` kezdet) és a hosszúságot, segítve a hibák megelőzését.
*   **Egyenként másolható Mintamondatok:** A prompt-mérnöki kifejezések dobozában a mintamondatok mellett elhelyezett **Másolás gomb** segítségével a másolás egyetlen kattintással elérhető.
*   **Együttesen másolható Útmutatók:** A *Megvalósítási lépések* és az *Anti-Patternök* teljes anyaga egyetlen gombnyomással a vágólapra helyezhető, strukturált, kész listaként.
*   **Letisztított tanulói felület:** A fejléc és státuszsáv a tanulási fókuszt támogatja, a részletesebb nézet- és mozgásvezérlők a bal oldali panelen maradnak.
*   **Bootstrapped Infobox Portal (bal alsó sarok):**
    *   **ABOUT:** Átfogó leírás a tudástérről és kategóriáiról.
    *   **HOWTO:** Részletes, pontokba szedett használati útmutató.
    *   **DEV:** Fejlesztői névjegy, portré kép betöltése GitHubról, valamint interaktív GitHub profil linkelés ([arlinamid](https://github.com/arlinamid)).

---

## 🛠️ Alkalmazott Technológiák

*   **Keretrendszer:** [React 19.0.1](https://react.dev/) + [Vite](https://vitejs.dev/)
*   **3D Renderelés:** [Three.js](https://threejs.org/) + custom HTML Label vetítés (Level of Detail)
*   **Dizájn & Styling:** [Tailwind CSS](https://tailwindcss.com/) szigorú Space-age Dark, nagy kontrasztú arany-szürke hangulattal
*   **Ikonkészlet:** [Lucide React](https://lucide.dev/) (egységesen betöltve)
*   **Nyelv:** [TypeScript](https://www.typescriptlang.org/) (szigorú típusbiztonság)

---

## 📂 Projekt Felépítése

```bash
/
├── src/
│   ├── components/
│   │   ├── ThreeKnowledgeSphere.tsx # A 3D-s WebGL gömb és a LOD / kapcsolat kirajzolás lelke
│   │   ├── DetailPanel.tsx          # Jobb oldali részletes elemző kártya (Copy funkciókkal)
│   │   └── GroupFilter.tsx          # Bal oldali kategóriaszűrők
│   ├── data/
│   │   ├── dictionary/
│   │   │   ├── manifest.json        # Metaadatok, fő csoportok és kategóriafájlok listája
│   │   │   └── *.json               # Kategóriánként bontott kulcsszavak
│   │   └── dictionaryService.ts     # Kapcsolatgenerátor és adatszolgáltató
│   ├── App.tsx                      # Fő alkalmazás logikája, óra és az Infó Modal
│   ├── main.tsx                     # React belépési pont
│   └── index.css                    # Globális Tailwind CSS beállítások és betűtípusok
├── metadata.json                    # Alkalmazás metaadatai (Név: Vibekóding Tudásgömb)
└── package.json                     # Projekt függőségek és futtató scriptek
```

### Szótárbetöltés

Az alkalmazás build közben az új, kategóriánként bontott `src/data/dictionary/*.json` fájlokat használja. Ha egy kategória split fájlja hiányzik vagy nem tartalmaz érvényes `keywords` listát, a loader ugyanazt a kategóriát a régi `src/data/user_dictionary.json` sémából építi fel. Ugyanez a fallback működik a szerveroldali AI kereső indexnél is.

---

## 🚀 Futtatás és Telepítés

### 1. Függőségek telepítése
```bash
npm install
```

### 2. Fejlesztői szerver indítása
```bash
npm run dev
```
*Az alkalmazás a helyi hálózaton a http://localhost:3000 porton lesz elérhető.*

### 3. Statikus build készítése
```bash
npm run build
```

---
