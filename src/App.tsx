/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from "react";
import { KeywordNode, KeywordLink, ViewMode } from "./types";
import {
  RAW_NODES,
  buildLinks,
  initializeNodePositions,
  GROUPS,
  META,
} from "./data/dictionaryService";
import { calculateChaosLayout, calculateStructuredLayout } from "./three/layouts";
import { ThreeKnowledgeSphere } from "./components/ThreeKnowledgeSphere";
import { GroupFilter } from "./components/GroupFilter";
import { DetailPanel } from "./components/DetailPanel";
import {
  Search,
  Sparkles,
  RotateCcw,
  Compass,
  Zap,
  Layers,
  HelpCircle,
  Maximize2,
  Minimize2,
  Info,
  Calendar,
  Settings,
  Github
} from "lucide-react";

export default function App() {
  // 1. Core Graph Data (Memoized and mapped state)
  const initialLinks = useMemo(() => buildLinks(RAW_NODES), []);
  const initialNodes = useMemo(() => {
    const rawWithPositions = initializeNodePositions(RAW_NODES);
    calculateChaosLayout(rawWithPositions); // Establish initial spherical targets
    return rawWithPositions;
  }, []);

  // 2. Client Space State Routing
  const [nodes, setNodes] = useState<KeywordNode[]>(initialNodes);
  const [links] = useState<KeywordLink[]>(initialLinks);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("chaos");
  const [cameraMode, setCameraMode] = useState<"inside" | "outside">("outside");

  // 3. Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [showRelations, setShowRelations] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Real-time ticking clock state & Modal system states
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"about" | "howto" | "dev">("about");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = useMemo(() => {
    const y = currentTime.getFullYear();
    const m = String(currentTime.getMonth() + 1).padStart(2, "0");
    const d = String(currentTime.getDate()).padStart(2, "0");
    const hh = String(currentTime.getHours()).padStart(2, "0");
    const mm = String(currentTime.getMinutes()).padStart(2, "0");
    const ss = String(currentTime.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }, [currentTime]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach((n) => {
      counts[n.group] = (counts[n.group] || 0) + 1;
    });
    return counts;
  }, [nodes]);

  // 4. Fetch Active Selected Node info
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Handle active search highlight counting
  const matchingCount = useMemo(() => {
    if (!searchQuery) return 0;
    const lower = searchQuery.toLowerCase();
    return nodes.filter(
      (n) =>
        n.label.toLowerCase().includes(lower) ||
        n.group.toLowerCase().includes(lower) ||
        n.description.toLowerCase().includes(lower)
    ).length;
  }, [searchQuery, nodes]);

  // 5. Layout Transition dispatching
  const handleSelectNode = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    
    // Recalculate target positions
    const nextNodes = [...nodes];
    if (nodeId) {
      calculateStructuredLayout(nextNodes, links, nodeId);
      setViewMode("focused");
    } else {
      calculateChaosLayout(nextNodes);
      setViewMode("chaos");
    }
    
    setNodes(nextNodes);
  };

  // Full reset dispatcher
  const handleResetView = () => {
    setSelectedNodeId(null);
    setHoveredNodeId(null);
    setActiveGroup(null);
    setSearchQuery("");
    setCameraMode("outside");
    setViewMode("chaos");

    const resetNodes = [...nodes];
    calculateChaosLayout(resetNodes);
    setNodes(resetNodes);
  };

  // Safe escape keyboard handler for resettings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleResetView();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes]);

  return (
    <div className="relative h-screen bg-[#050508] text-[#E0D8D0] flex flex-col overflow-hidden font-sans select-none selection:bg-white/10 selection:text-white">
      {/* Background radial starry gradient overlays - Cinematic Atmospheric */}
      <div className="absolute inset-0 sphere-gradient pointer-events-none z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-950/15 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-950/15 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Primary Top Header Board */}
      <header className="relative z-10 shrink-0 border-b border-white/5 bg-[#050508]/40 backdrop-blur-md px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_#ffffff]"></div>
          </div>
          <div>
            <h1 className="text-xs tracking-[0.4em] font-semibold uppercase text-white/80">
              Vibekóding Tudásgömb <span className="text-white/20 font-light mx-1">|</span> AI FEJLESZTŐI TUDÁSGÖMB
            </h1>
            <p className="text-[9px] text-white/40 tracking-[0.1em] uppercase mt-1 font-mono">
              {META.purpose}
            </p>
          </div>
        </div>

        {/* Real-time system monitoring panel */}
        <div className="hidden lg:flex items-center gap-4 text-[9px] tracking-widest uppercase text-white/40 font-mono">
          <div className="flex items-center gap-2 bg-white/3 border border-white/5 px-4 py-2 rounded-full">
            <Calendar className="w-3.5 h-3.5 text-white/50" />
            <span>Pontos Idő:</span>
            <span className="text-white font-semibold">{formattedTime}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/3 border border-white/5 px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>System:</span>
            <span className="text-emerald-400 font-semibold">Stable</span>
          </div>
        </div>
      </header>

      {/* Main Core Layout Deck */}
      <main className="flex-1 relative z-10 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* Left Side: Controls, Searches and Categories Badges */}
        <section
          id="left-control-sidebar"
          className="w-full md:w-[320px] shrink-0 border-r border-white/5 bg-[#050508]/20 backdrop-blur-sm p-4 overflow-y-auto space-y-4 flex flex-col order-2 md:order-1 select-none scrollbar-thin scrollbar-thumb-white/10"
        >
          {/* Module 1: Searching Input with rounded-full design layout mapping */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-3 backdrop-blur-xl glass-panel">
            <label id="search-input-label" htmlFor="search-input" className="block text-[10px] font-semibold text-white/50 uppercase tracking-[0.2em]">
              Intelligens kereső
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/30 absolute left-4 top-3.5" />
              <input
                id="search-input"
                type="text"
                placeholder="Search knowledge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-full pl-9 pr-9 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all font-mono"
              />
              {searchQuery && (
                <button
                  id="clear-search-btn"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-2.5 p-1 text-white/40 hover:text-white hover:bg-white/5 rounded-full cursor-pointer transition-colors"
                >
                  <XIcon />
                </button>
              )}
            </div>

            {searchQuery && (
              <div id="search-matches-badge" className="text-[10px] bg-sky-950/20 text-sky-300 px-3 py-1.5 rounded-full border border-sky-500/10 font-mono flex items-center justify-between">
                <span>Találati lista:</span>
                <span className="font-bold bg-sky-500/25 px-2 py-0.5 rounded-full text-white text-[11px]">{matchingCount} szó</span>
              </div>
            )}
          </div>

          {/* Module 2: Category Badge Filtering */}
          <GroupFilter
            activeGroup={activeGroup}
            onSelectGroup={setActiveGroup}
          />

          {/* Module 3: Active Layout Mode state display in glass-panel format */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-4 backdrop-blur-xl glass-panel">
            <div>
              <h3 id="layout-title" className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.2em]">
                Vizuális Állapotgép
              </h3>
              <p className="text-[10px] text-white/40 font-mono mt-1">
                Aktuális nézet: <span className="text-sky-400 capitalize font-medium">{viewMode}</span>
              </p>
            </div>

            <div className="space-y-2 pt-1 border-t border-white/5">
              {/* Reset to chaos button */}
              {viewMode === "focused" && (
                <button
                  id="reset-chaos-btn"
                  onClick={handleResetView}
                  className="w-full flex items-center justify-center gap-2 bg-[#E0D8D0]/5 hover:bg-[#E0D8D0]/10 border border-white/10 text-[#E0D8D0] text-[10px] font-semibold py-2.5 px-3 rounded-full cursor-pointer active:scale-95 transition-all text-center uppercase tracking-widest"
                >
                  <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" />
                  Reset Sphere Space
                </button>
              )}

              {/* Show relations lines toggle */}
              <button
                id="toggle-lines-btn"
                onClick={() => setShowRelations(!showRelations)}
                className={`w-full flex items-center justify-between text-[11px] py-2 px-3.5 rounded-full border transition-all cursor-pointer select-none ${
                  showRelations
                    ? "bg-white/10 border-white/20 text-white font-medium"
                    : "bg-black/30 border-white/5 text-[#E0D8D0]/60 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2 uppercase tracking-wider text-[10px]">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  Minden kapcsolat
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-sky-400">
                  {showRelations ? "ON" : "OFF"}
                </span>
              </button>

              {/* Reduced animation motion settings */}
              <button
                id="toggle-motion-btn"
                onClick={() => setReducedMotion(!reducedMotion)}
                className={`w-full flex items-center justify-between text-[11px] py-2 px-3.5 rounded-full border transition-all cursor-pointer select-none ${
                  reducedMotion
                    ? "bg-white/10 border-white/20 text-white font-medium"
                    : "bg-black/30 border-white/5 text-[#E0D8D0]/60 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2 uppercase tracking-wider text-[10px]">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Csökkentett mozgás
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-amber-400">
                  {reducedMotion ? "ON" : "OFF"}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Center Section: High performance Three.js WebGL Interactive stage */}
        <section className="flex-1 relative flex flex-col order-1 md:order-2 h-[450px] md:h-auto border-b md:border-b-0 border-white/5 bg-[#050508]/10 relative overflow-hidden">
          
          {/* Three.js interactive canvas mount */}
          <ThreeKnowledgeSphere
            nodes={nodes}
            links={links}
            selectedNodeId={selectedNodeId}
            hoveredNodeId={hoveredNodeId}
            searchQuery={searchQuery}
            activeGroup={activeGroup}
            showRelations={showRelations}
            viewMode={viewMode}
            reducedMotion={reducedMotion}
            onSelectNode={handleSelectNode}
            onHoverNode={setHoveredNodeId}
            cameraMode={cameraMode}
            setCameraMode={setCameraMode}
          />

          {/* Floaters overlays controls bar */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#050508]/85 border border-white/10 p-2 rounded-full shadow-2xl shadow-black backdrop-blur-xl z-20">
            <button
              id="camera-mode-btn"
              onClick={() => setCameraMode(cameraMode === "inside" ? "outside" : "inside")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-widest cursor-pointer transition-all ${
                cameraMode === "inside"
                  ? "bg-white text-black"
                  : "bg-white/5 border border-white/5 text-white/60 hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{cameraMode === "inside" ? "Kilépés a Gömbből" : "Belépés a Gömbbe"}</span>
            </button>

            <div className="h-4 w-px bg-white/10 shrink-0" />

            {/* Quick manual zoom keys */}
            <button
              id="zoom-helper-btn"
              onClick={handleResetView}
              title="Kamera alapállás"
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 text-[#E0D8D0]/60 hover:text-white rounded-full transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick interactive guide float */}
          <div className="absolute top-4 left-4 p-4 bg-white/3 border border-white/5 rounded-xl text-[10px] text-white/50 backdrop-blur-md pointer-events-none hidden md:block uppercase tracking-widest font-mono">
            <div className="flex items-center gap-2 text-white font-semibold mb-2">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>Súgó tippek</span>
            </div>
            <div className="space-y-1">
              <div>• Klikk + Húzás: Forgatás</div>
              <div>• Egér Görgő: Nagyítás</div>
              <div>• Kattintás: Adatlap</div>
            </div>
          </div>

          {/* System status & bootstrapped popup triggers in bottom-left corner */}
          <div className="absolute bottom-5 left-5 z-20 flex items-center gap-1.5 bg-[#050508]/85 border border-white/10 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-xl">
            <button
              onClick={() => { setModalTab("about"); setIsModalOpen(true); }}
              className="px-2 py-1 text-[9px] font-mono font-bold tracking-wider text-white/60 hover:text-white uppercase hover:bg-white/5 rounded transition-all cursor-pointer"
              title="About - Tudásgömb"
            >
              ABOUT
            </button>
            <span className="text-white/15 self-center font-mono select-none text-[8px]">|</span>
            <button
              onClick={() => { setModalTab("howto"); setIsModalOpen(true); }}
              className="px-2 py-1 text-[9px] font-mono font-bold tracking-wider text-white/60 hover:text-white uppercase hover:bg-white/5 rounded transition-all cursor-pointer"
              title="Howto - Használati útmutató"
            >
              HOWTO
            </button>
            <span className="text-white/15 self-center font-mono select-none text-[8px]">|</span>
            <button
              onClick={() => { setModalTab("dev"); setIsModalOpen(true); }}
              className="px-2 py-1 text-[9px] font-mono font-bold tracking-wider text-[#FD7E14]/85 hover:text-[#FD7E14] uppercase hover:bg-white/5 rounded transition-all cursor-pointer"
              title="Dev - Fejlesztői névjegy"
            >
              DEV
            </button>
          </div>
        </section>

        {/* Right Side: Floating details card sheet */}
        <section
          id="right-details-sidebar"
          className="w-full md:w-[380px] shrink-0 border-l border-white/5 bg-[#050508]/20 backdrop-blur-sm p-4 h-full flex flex-col overflow-hidden order-3 select-none"
        >
          <DetailPanel
            selectedNode={selectedNode}
            allNodes={nodes}
            links={links}
            onSelectNode={handleSelectNode}
            onClose={() => handleSelectNode(null)}
          />
        </section>

      </main>

      {/* Bottom Status Bar from the Design HTML */}
      <footer className="relative z-10 shrink-0 border-t border-white/5 bg-[#050508]/40 backdrop-blur-md px-8 py-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-white/40 tracking-[0.22em] uppercase">
        <div className="flex space-x-8 mb-2 md:mb-0">
          <span>Nodes: {nodes.length}</span>
          <span>Relations: {links.length}</span>
          <span>System: Stable</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4 text-[9px] tracking-widest">
          <span className="text-[#FF6B6B]">● Auth & Sec</span>
          <span className="text-[#4DABF7]">● Frontend</span>
          <span className="text-[#FFD43B]">● AI Agentic</span>
          <span className="text-[#FD7E14]">● Vibe</span>
          <span className="text-[#BA68C8]">● DevOps</span>
          <span className="text-[#20C997]">● Database</span>
        </div>
      </footer>

      {/* Dynamic Bootstrapped Infobox Portal modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#050508]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all select-none">
          <div className="bg-[#0b0b14] border border-white/10 w-full max-w-xl rounded-2xl p-6 relative shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-[#E0D8D0] glass-panel select-text animate-fade-in">
            {/* Modal Title & Navigation tabs */}
            <div className="flex flex-col gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FD7E14] animate-ping" />
                  <h2 className="text-xs font-mono tracking-[0.2em] font-bold uppercase text-white/90">
                    Vibekóding Tudásgömb : Rendszerinfó
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 px-2.5 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all cursor-pointer font-mono"
                >
                  [ Bezárás ]
                </button>
              </div>

              {/* Tab options selector bar */}
              <div className="flex flex-wrap gap-1 bg-black/40 p-1 rounded-full border border-white/5">
                {(["about", "howto", "dev"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setModalTab(tab)}
                    className={`flex-1 min-w-[70px] px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wider font-semibold transition-all cursor-pointer ${
                      modalTab === tab
                        ? "bg-white text-black shadow-md"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Scrollable Contents area */}
            <div className="flex-1 overflow-y-auto py-5 pr-1 space-y-4 scrollbar-thin scrollbar-thumb-white/10 mini-scrollbar">
              {modalTab === "about" && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-white/3 border border-white/5 rounded-xl space-y-2">
                    <p className="text-xs leading-relaxed text-[#E0D8D0]/90">
                      A <span className="text-white font-bold">Vibekóding Tudásgömb</span> egy interaktív, 3D-s hálózati elrendezésű intelligens tudástérkép, amely tartalmazza az AI fejlesztések, prompt engineering, dizájn elvek, UI/UX állapotok, backend, adatbázisok és biztonságtechnika alapvető fogalmait és JSON-alapú összefüggéseit.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-mono tracking-wide">
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                      <span className="text-white/40 block mb-1">PROGRAM NÉV</span>
                      <span className="text-[#FD7E14] font-semibold">Vibekóding Tudásgömb</span>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                      <span className="text-white/40 block mb-1">ÖSSZES FOGALOM</span>
                      <span className="text-sky-400 font-semibold">{nodes.length} Kulcsszó</span>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === "howto" && (
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-4 bg-black/30 border border-white/5 rounded-xl space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-[#FD7E14] font-bold">01.</span>
                      <p>
                        <strong className="text-white">Gömb Forgatása:</strong> Fogd meg a gömböt a bal egérgombbal tetszőleges ponton, és húzd a kívánt irányba.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FD7E14] font-bold">02.</span>
                      <p>
                        <strong className="text-white">Nagyítás (Zoom):</strong> Forgasd az egérgörgőt a szavak közti magassági szintekre való ráközelítéshez.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FD7E14] font-bold">03.</span>
                      <p>
                        <strong className="text-white">Részletes Adatlap Lekérése:</strong> Kattints bármelyik szóra a gömbben! Ekkor a jobb oldalon megjelenik az adatlap.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#FD7E14] font-bold">04.</span>
                      <p>
                        <strong className="text-white">Kapcsolatok szűrése (LOD):</strong> Forgatás közben az FPS sebesség magasan tartása érdekében a gömb intelligens lazy load és Level of Detail (LOD) logikát alkalmaz. Amikor kiválasztasz egy szót, annak közvetlen és másodlagos (depth-2) kapcsolatai azonnal részletesen kirajzolódnak a képernyőn.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {modalTab === "dev" && (
                <div className="space-y-4 font-sans text-xs text-left">
                  <div className="p-4 bg-white/3 border border-white/5 rounded-xl flex flex-col sm:flex-row items-center gap-5">
                    {/* Portrait Photo */}
                    <div className="w-24 h-24 border-2 border-white/10 rounded-xl overflow-hidden shrink-0 shadow-lg relative bg-black">
                      <img
                        src="https://avatars.githubusercontent.com/u/67795466?s=96&v=4"
                        referrerPolicy="no-referrer"
                        alt="Rózsavölgyi János"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      />
                    </div>

                    <div className="space-y-2 text-center sm:text-left">
                      <h3 className="text-sm font-semibold text-white tracking-wider">
                        Rózsavölgyi János
                      </h3>
                      <p className="text-[11px] font-mono text-white/40">
                        Szoftverfejlesztő & AI Architekt
                      </p>

                      <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                        <a
                          href="https://github.com/arlinamid"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 rounded-full text-[10px] font-mono text-[#E0D8D0] hover:text-white transition-all cursor-pointer"
                        >
                          <Github className="w-3.5 h-3.5 text-white" />
                          <span>github.com/arlinamid</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-black/20 border border-white/5 rounded-xl space-y-2 text-[11px] leading-relaxed text-[#E0D8D0]/80">
                    <p>
                      <strong>Főbb technológiák:</strong> React, Three.js, TypeScript, Vite, Tailwind CSS, high-fidelity WebGL interakciók és webes optimalizálások.
                    </p>
                    <p>
                      Ezt a 3D hálózatos tudástérképet kiegészítettük egy sávszélesség-takarékos és processzor-kímélő rendering pipeline-nal, így bármely laptopon tökéletesen folyékony animációkkal üzemel.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal system info footer note */}
            <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[9px] font-mono text-white/30 tracking-widest">
              <span>SYSTEM: ONLINE</span>
              <span>EST. 2026</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact helper icon SVG close
function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-3.5 h-3.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
