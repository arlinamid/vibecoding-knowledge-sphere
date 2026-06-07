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
*   **Egyenként másolható Mintamondatok:** A prompt-mérnöki kifejezések dobozában a mintamondatok mellett elhelyezett **Másolás gomb** segítségével a másolás egyetlen kattintással elérhető.
*   **Együttesen másolható Útmutatók:** A *Megvalósítási lépések* és az *Anti-Patternök* teljes anyaga egyetlen gombnyomással a vágólapra helyezhető, strukturált, kész listaként.
*   **Valós idejű Helyi Óra:** A fejlécben elhelyezett óra pontosan és dinamikusan frissítve mutatja a helyi időt.
*   **Bootstrapped Infobox Portal (bal alsó sarok):**
    *   **ABOUT:** Átfogó leírás a tudástérről és kategóriáiról.
    *   **HOWTO:** Részletes, pontokba szedett használati útmutató.
    *   **DEV:** Fejlesztői névjegy, portré kép betöltése GitHubról, valamint interaktív GitHub profil linkelés ([arlinamid](https://github.com/arlinamid)).

---

## 🛠️ Alkalmazott Technológiák

*   **Keretrendszer:** [React 18+](https://react.dev/) + [Vite](https://vitejs.dev/)
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
│   │   └── CategoryFilter.tsx       # Bal oldali kategóriaszűrők
│   ├── data/
│   │   ├── dictionary.json          # A teljes tudásbázis strukturált adata
│   │   └── dictionaryService.ts     # Kapcsolatgenerátor és adatszolgáltató
│   ├── App.tsx                      # Fő alkalmazás logikája, óra és az Infó Modal
│   ├── main.tsx                     # React belépési pont
│   └── index.css                    # Globális Tailwind CSS beállítások és betűtípusok
├── metadata.json                    # Alkalmazás metaadatai (Név: Vibekóding Tudásgömb)
└── package.json                     # Projekt függőségek és futtató scriptek
```

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

## 👤 Fejlesztő

*   **Név:** Rózsavölgyi János
*   **GitHub profil:** [@arlinamid](https://github.com/arlinamid)
*   **Kapcsolat:** janos.rozsavolgyi2@gmail.com
