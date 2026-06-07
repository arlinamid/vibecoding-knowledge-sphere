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
} from "./data/dictionaryService";
import { calculateChaosLayout, calculateStructuredLayout } from "./three/layouts";
import { ThreeKnowledgeSphere } from "./components/ThreeKnowledgeSphere";
import { GroupFilter } from "./components/GroupFilter";
import { DetailPanel } from "./components/DetailPanel";
import { OnboardingTour } from "./components/OnboardingTour";
import {
  Search,
  Sparkles,
  RotateCcw,
  Compass,
  Zap,
  Layers,
  HelpCircle,
  Info,
  Github,
  Brain,
  Key,
  Save,
  ExternalLink,
  AlertTriangle
} from "lucide-react";

const AI_SEARCH_MAX_QUERY_LENGTH = 120;

type AiSearchMatch = { id: string; matchReason: string };
type AiSearchResponse = { matches?: AiSearchMatch[]; aiSummary?: string };
type AiSearchErrorResponse = { error?: string };

// Beginner Mode Problems config dataset
const BEGINNER_PROBLEMS = [
  {
    id: "shiner_ui",
    title: "„Szebb UI-t akarok”",
    description: "Hogyan építs vizuálisan tökéletes, esztétikus, reszponzív modern felületeket.",
    relatedGroups: ["ui_ux", "frontend_ui", "accessibility"],
    focusedKeywordId: "frontend_ui.tailwind_css",
  },
  {
    id: "login_issue",
    title: "„Nem működik a login”",
    description: "Hitelesítési tokenek, sessionök és CORS szabályok diagnosztizálása.",
    relatedGroups: ["authentication", "security", "ux_states"],
    focusedKeywordId: "authentication.jwt",
  },
  {
    id: "deploy_issue",
    title: "„Deployolni akarok”",
    description: "Éles webalkalmazások közzététele az internetre és automatizációs pipeline-ok.",
    relatedGroups: ["devops_deploy", "observability", "performance"],
    focusedKeywordId: "devops_deploy.github_actions",
  },
  {
    id: "error_undone",
    title: "„Nem értem az error üzenetet”",
    description: "Bugok diagnosztizálása a kódhibákból és hívási láncokból (Stack Trace).",
    relatedGroups: ["debugging", "observability"],
    focusedKeywordId: "debugging.stack_trace",
  },
  {
    id: "save_data",
    title: "„Adatot akarok menteni”",
    description: "Tartós adatkezelés, sémák és adatbázis integrálása.",
    relatedGroups: ["database", "backend"],
    focusedKeywordId: "database.schema",
  },
  {
    id: "api_hook",
    title: "„API-t akarok bekötni”",
    description: "Hogyan lekérdezz és továbbíts adatokat a szerver és a kliens között.",
    relatedGroups: ["backend", "frontend_architecture"],
    focusedKeywordId: "backend.api",
  },
  {
    id: "slow_page",
    title: "„Lassú az alkalmazásom”",
    description: "Késleltetett betöltés (lazy loading), csomagméret csökkentése és gyorsítótárazás (caching).",
    relatedGroups: ["performance", "observability"],
    focusedKeywordId: "performance.lazy_loading",
  },
  {
    id: "blind_spots",
    title: "„Akadálymentesíteni akarok”",
    description: "Szemantikus HTML elemek, képernyőolvasó támogatás (ARIA) és billentyűzet-navigáció.",
    relatedGroups: ["accessibility"],
    focusedKeywordId: "accessibility.semantic_html",
  },
  {
    id: "ai_tools",
    title: "„AI eszközmeghívást akarok”",
    description: "Hogyan hívhat meg az AI ágens (pl. Gemini) egyedi API funkciókat, mint pl. e-mail küldést.",
    relatedGroups: ["ai_agentic"],
    focusedKeywordId: "ai_agentic.tool_calling",
  },
  {
    id: "team_rules",
    title: "„Projekt indítás és leírások”",
    description: "Rendszerezett README fájlok, telepítési útmutatók és világos kóddokumentáció.",
    relatedGroups: ["documentation", "vibe_coding"],
    focusedKeywordId: "documentation.readme",
  }
];

// Learning Roadmap Steps config dataset
const ROADMAP_STEPS = [
  { step: "01", label: "Frontend alapok", desc: "HTML, CSS és reszponzív mobilbarát elrendezések.", group: "frontend_ui", keyId: "frontend_ui.responsive_layout" },
  { step: "02", label: "UI / UX elvek", desc: "Vizuális hierarchia, színkontraszt és elrendezések.", group: "ui_ux", keyId: "ui_ux.visual_hierarchy" },
  { step: "03", label: "Állapotkezelés", desc: "Betöltés, gépelés, hibás és üres UX állapotok.", group: "ux_states", keyId: "ux_states.loading_state" },
  { step: "04", label: "Kommunikáció (API)", desc: "API kérések, REST, JSON és aszinkron adatfolyamok.", group: "backend", keyId: "backend.api" },
  { step: "05", label: "Backend szerver", desc: "Szerveroldali végpontok, Express API routing.", group: "backend", keyId: "backend.route" },
  { step: "06", label: "Hitelesítés (Auth)", desc: "Biztonságos munkamenet, JWT bejelentkezés.", group: "authentication", keyId: "authentication.jwt" },
  { step: "07", label: "Adatbázisok", desc: "Adatmodellek, táblák és sémák tervezése.", group: "database", keyId: "database.schema" },
  { step: "08", label: "Hibakeresés (Debug)", desc: "Stack Trace értelmezés és konzolos diagnosztika.", group: "debugging", keyId: "debugging.stack_trace" },
  { step: "09", label: "Élesítés (Deploy)", desc: "GitHub Actions CI/CD élesítés és felhő alapok.", group: "devops_deploy", keyId: "devops_deploy.github_actions" },
  { step: "10", label: "Biztonság (Security)", desc: "Eltitkolt környezeti változók és titkok menedzsmentje.", group: "security", keyId: "security.secrets_management" },
  { step: "11", label: "Production Checklist", desc: "Vibe kódoló Git minták és verziókövetés.", group: "vibe_coding", keyId: "vibe_coding.git" }
];

// Simplified Filter tags
const QUICK_TAGS = [
  { label: "frontend", group: "frontend_ui", name: "Frontend" },
  { label: "backend", group: "backend", name: "Backend" },
  { label: "auth", group: "authentication", name: "Authentication" },
  { label: "debug", group: "debugging", name: "Debugging" },
  { label: "deploy", group: "devops_deploy", name: "Devops & Deploy" },
  { label: "database", group: "database", name: "Database" },
  { label: "UI/UX", group: "ui_ux", name: "UI/UX" },
  { label: "security", group: "security", name: "Security" },
  { label: "prompting", group: "vibe_coding", name: "Prompting" },
  { label: "production", group: "observability", name: "Production" }
];

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

  // AI Semantic Search States
  const [hasSystemKey, setHasSystemKey] = useState<boolean | null>(null);
  const [byokKey, setByokKey] = useState<string>(() => {
    return localStorage.getItem("BYOK_GEMINI_API_KEY") || "";
  });
  const [tempKey, setTempKey] = useState("");
  const [showByokForm, setShowByokForm] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isAiSearch, setIsAiSearch] = useState<boolean>(() => {
    return !!(localStorage.getItem("BYOK_GEMINI_API_KEY"));
  });
  const [aiSearchMatches, setAiSearchMatches] = useState<AiSearchMatch[] | null>(null);
  const [aiSearchSummary, setAiSearchSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Check on mount if a system-level Gemini API key has already been configured on the backend
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasSystemKey === "boolean") {
          setHasSystemKey(data.hasSystemKey);
          if (data.hasSystemKey) {
            setIsAiSearch(true);
          }
        } else {
          setHasSystemKey(false);
        }
      })
      .catch((err) => {
        console.error("Health check error:", err);
        setHasSystemKey(false);
      });
  }, []);

  // Validation function for BYOK key
  const handleSaveKey = () => {
    const trimmed = tempKey.trim();
    if (!trimmed) {
      setValidationError("A kulcs mező nem lehet üres.");
      return;
    }
    if (!trimmed.startsWith("AIzaSy")) {
      setValidationError("Nem megfelelő Gemini API kulcs formátum (a kulcsnak 'AIzaSy' előtaggal kell kezdődnie).");
      return;
    }
    if (trimmed.length < 35) {
      setValidationError("A megadott kulcs túl rövid (legalább 35 karakter hosszúságúnak kell lennie).");
      return;
    }
    setValidationError(null);
    localStorage.setItem("BYOK_GEMINI_API_KEY", trimmed);
    setByokKey(trimmed);
    setShowByokForm(false);
  };

  // Debounce and trigger server-side Gemini Intelligent Search with cancel request (AbortController) and length limitation
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery || trimmedQuery.length < 2) {
      setAiSearchMatches(null);
      setAiSearchSummary(null);
      setAiError(null);
      setIsAiLoading(false);
      return;
    }

    if (trimmedQuery.length > AI_SEARCH_MAX_QUERY_LENGTH) {
      setAiSearchMatches(null);
      setAiSearchSummary(null);
      setAiError(`Az intelligens (AI) keresés legfeljebb ${AI_SEARCH_MAX_QUERY_LENGTH} karakter hosszúságú lehet.`);
      setIsAiLoading(false);
      return;
    }

    // Must be AI search mode, and either server has system key config, or custom user BYOK exists
    if (!isAiSearch || !(hasSystemKey || byokKey.trim())) {
      setAiSearchMatches(null);
      setAiSearchSummary(null);
      setAiError(null);
      setIsAiLoading(false);
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    const controller = new AbortController();
    const { signal } = controller;

    const handler = setTimeout(async () => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (byokKey.trim()) {
          headers["x-api-key"] = byokKey.trim();
        }

        const response = await fetch("/api/ai-search", {
          method: "POST",
          headers,
          body: JSON.stringify({ q: trimmedQuery }),
          signal,
        });

        if (!response.ok) {
          const errData = (await response.json().catch(() => ({}))) as AiSearchErrorResponse;
          throw new Error(errData.error || "Hiba történt az intelligens keresés során.");
        }

        const data = (await response.json()) as AiSearchResponse;
        setAiSearchMatches(data.matches ?? []);
        setAiSearchSummary(data.aiSummary || null);
        setIsAiLoading(false);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Silent catch for cancelled request
          return;
        }
        console.error("AI Search HTTP error:", err);
        setAiError(err instanceof Error ? err.message : "Szerver kapcsolódási hiba.");
        setAiSearchMatches([]);
        setIsAiLoading(false);
      }
    }, 3500); // 3-4 másodperc türelmi idő (3.5 s debounce)

    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [searchQuery, isAiSearch, hasSystemKey, byokKey]);

  // New Beginner-Focused Interactive States
  const [sidebarTab, setSidebarTab] = useState<"explore" | "beginner" | "roadmap">("explore");
  const [activeBeginnerProblemId, setActiveBeginnerProblemId] = useState<string | null>(null);
  const [activeRoadmapStepIndex, setActiveRoadmapStepIndex] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [tourStep, setTourStep] = useState(0); // Onboarding Guided Tour active step (0 = off, 1-5 = active step)

  // Auto-advance guided tour Step 1 to Step 2 if any filter or search is active
  useEffect(() => {
    if (tourStep === 1 && (searchQuery || activeGroup || activeBeginnerProblemId)) {
      setTourStep(2);
    }
  }, [searchQuery, activeGroup, activeBeginnerProblemId, tourStep]);

  const handleTourAction = (actionType: "copy" | "related") => {
    if (actionType === "copy" && tourStep === 3) {
      setTourStep(4);
    } else if (actionType === "related" && tourStep === 4) {
      setTourStep(5);
    }
  };

  // Modal system states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"about" | "howto" | "dev">("about");

  // 4. Fetch Active Selected Node info
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Handle active search highlight counting
  const matchingCount = useMemo(() => {
    if (!searchQuery) return 0;
    if (isAiSearch && aiSearchMatches) {
      return aiSearchMatches.length;
    }
    const lower = searchQuery.toLowerCase();
    return nodes.filter(
      (n) =>
        n.label.toLowerCase().includes(lower) ||
        n.group.toLowerCase().includes(lower) ||
        n.description.toLowerCase().includes(lower)
    ).length;
  }, [searchQuery, nodes, isAiSearch, aiSearchMatches]);

  // 5. Layout Transition dispatching
  const handleSelectNode = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    
    // Auto-advance onboarding tour if user selects a node
    if (nodeId && tourStep === 2) {
      setTourStep(3);
    }
    
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
    setAiSearchMatches(null);
    setAiSearchSummary(null);
    setAiError(null);

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

  // Handle active category changes vs selected node focus compatibility
  useEffect(() => {
    if (activeGroup && selectedNodeId) {
      const currentlySelectedNode = nodes.find((n) => n.id === selectedNodeId);
      if (currentlySelectedNode && currentlySelectedNode.group !== activeGroup) {
        // If the selected node does not belong to the newly selected category, we check bypasses
        let bypassReset = false;
        
        if (sidebarTab === "beginner" && activeBeginnerProblemId) {
          const activeProb = BEGINNER_PROBLEMS.find((p) => p.id === activeBeginnerProblemId);
          if (activeProb && activeProb.focusedKeywordId === selectedNodeId) {
            bypassReset = true;
          }
        } else if (sidebarTab === "roadmap" && activeRoadmapStepIndex !== null) {
          const activeStep = ROADMAP_STEPS[activeRoadmapStepIndex];
          if (activeStep && activeStep.keyId === selectedNodeId) {
            bypassReset = true;
          }
        }

        if (!bypassReset) {
          // Release target focus but keep the active category filter active so all matching elements are highlighted
          setSelectedNodeId(null);
          setHoveredNodeId(null);
          setViewMode("chaos");

          const nextNodes = [...nodes];
          calculateChaosLayout(nextNodes);
          setNodes(nextNodes);
        }
      }
    }
  }, [activeGroup, selectedNodeId, sidebarTab, activeBeginnerProblemId, activeRoadmapStepIndex]);

  return (
    <div className="relative h-screen bg-[#050508] text-[#E0D8D0] flex flex-col overflow-hidden font-sans select-none selection:bg-white/10 selection:text-white">
      {/* Background radial starry gradient overlays - Cinematic Atmospheric */}
      <div className="absolute inset-0 sphere-gradient pointer-events-none z-0" />

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
            <p className="text-[10px] text-white/60 tracking-[0.05em] uppercase mt-1 font-mono">
              Interaktív tudástérkép kezdő AI-kódolóknak, amely megmutatja, milyen fogalmakkal kell gondolkodnod, amikor AI-val appot építesz.
            </p>
          </div>
        </div>

      </header>

      {/* Core Onboarding Highlight Banner Ribbon */}
      {showOnboarding && (
        <div id="onboarding-banner" className="relative z-20 bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-md animate-fade-in shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </div>
            <p className="text-xs text-[#E0D8D0] leading-relaxed">
              <span className="text-amber-400 font-sans font-bold uppercase tracking-wider text-[9px] mr-2">Interaktív Bemutató:</span>
              <strong>Ismerd meg az alkalmazást az interaktív vezetett túrával 5 lépésben!</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="start-tour-btn"
              onClick={() => {
                setTourStep(1);
                setShowOnboarding(false);
              }}
              className="px-3.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[9px] font-mono font-bold rounded-full transition-all cursor-pointer shadow-md shadow-amber-500/10"
            >
              [ TÚRA INDÍTÁSA ]
            </button>
            <button
              id="dismiss-onboarding-btn"
              onClick={() => setShowOnboarding(false)}
              className="px-3.5 py-1 bg-white/5 hover:bg-white/10 text-[9px] font-mono font-bold text-white/60 hover:text-white rounded-full border border-white/10 transition-all cursor-pointer"
            >
              [ Bezárás ]
            </button>
          </div>
        </div>
      )}

      {/* Main Core Layout Deck */}
      <main className="flex-1 relative z-10 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* Left Side: Controls, Searches and Categories Badges */}
        <section
          id="left-control-sidebar"
          className="w-full md:w-[325px] shrink-0 border-r border-white/5 bg-[#050508]/40 backdrop-blur-md p-4 overflow-hidden space-y-4 flex flex-col order-2 md:order-1 select-none h-full md:h-auto"
        >
          {/* Main Sidebar Modes Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 shrink-0">
            <button
              onClick={() => {
                setSidebarTab("explore");
                handleResetView();
              }}
              className={`py-2 text-[9px] font-sans font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center ${
                sidebarTab === "explore"
                  ? "bg-white text-black font-extrabold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              Böngészés
            </button>
            <button
              onClick={() => {
                setSidebarTab("beginner");
                handleResetView();
              }}
              className={`py-2 text-[9px] font-sans font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center ${
                sidebarTab === "beginner"
                  ? "bg-amber-400 text-black font-extrabold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              Kezdő Mód
            </button>
            <button
              onClick={() => {
                setSidebarTab("roadmap");
                handleResetView();
              }}
              className={`py-2 text-[9px] font-sans font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center ${
                sidebarTab === "roadmap"
                  ? "bg-sky-400 text-black font-extrabold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              Tanulási Út
            </button>
          </div>

          {/* Unified Middle Scroll Viewport Container */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-white/10">
            {/* Tab View Conditionals */}
            {sidebarTab === "explore" && (
              <div className="space-y-4 flex flex-col pb-4">
                {/* Module 1: Searching Input with rounded-full design layout mapping */}
                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-3 backdrop-blur-xl glass-panel">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <label id="search-input-label" htmlFor="search-input" className="block text-[10px] font-semibold text-white/50 uppercase tracking-[0.2em]">
                      Intelligens kereső
                    </label>
                    <button
                      onClick={() => {
                        const nextVal = !isAiSearch;
                        setIsAiSearch(nextVal);
                        if (!nextVal) {
                          setAiSearchMatches(null);
                          setAiSearchSummary(null);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono cursor-pointer transition-all flex items-center gap-1 ${
                        isAiSearch
                          ? "bg-sky-500/20 text-sky-300 border border-sky-400/35 shadow-[0_0_10px_rgba(14,165,233,0.15)] animate-pulse"
                          : "bg-white/5 text-white/40 border border-white/10"
                      }`}
                    >
                      <Brain className="w-2.5 h-2.5" />
                      {isAiSearch ? "🧠 AI Aktív" : "Normál"}
                    </button>
                  </div>

                  {/* BYOK Configuration Form or Key Status Overlay */}
                  {isAiSearch && (
                    <div className="pb-2 border-b border-white/5 space-y-2">
                      {/* 1. Show system key status if available */}
                      {hasSystemKey && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl p-2.5 text-[11px] font-sans flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                            Rendszer AI kulcs elérhető és aktív!
                          </span>
                          {!byokKey && (
                            <span className="text-[9px] text-emerald-400/70 font-mono bg-emerald-400/10 px-1.5 py-0.5 rounded">
                              Auto-aktív
                            </span>
                          )}
                        </div>
                      )}

                      {!byokKey ? (
                        /* If we don't have a custom key, but if the system has no key or user wants custom entry */
                        (!hasSystemKey || showByokForm) ? (
                          <div className="bg-amber-500/10 border border-amber-500/25 rounded-md p-3 space-y-2.5 text-[11px] animate-fade-in">
                            <div className="flex items-start justify-between">
                              <div className="space-y-0.5">
                                <p className="text-amber-200 font-sans font-semibold">
                                  🔑 Gemini API Kulcs (BYOK)
                                </p>
                                <p className="text-[10px] text-white/50 leading-relaxed font-sans">
                                  {hasSystemKey 
                                    ? "Megadhatsz saját API kulcsot is az alapértelmezetten felül:"
                                    : "Adj meg egy saját kulcsot az intelligens AI keresés feloldásához:"}
                                </p>
                              </div>
                            </div>

                            {/* How-to helper prompt */}
                            <div className="bg-black/40 border border-white/5 rounded-lg p-2.5 text-[10px] space-y-1.5 text-white/70 pb-3">
                              <div className="flex items-center justify-between font-bold text-white/90">
                                <span>Hogyan szerezhetsz kulcsot?</span>
                                <a
                                  href="https://aistudio.google.com/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 underline cursor-pointer"
                                >
                                  Google AI Studio
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                              <ol className="list-decimal pl-3.5 font-sans space-y-0.5 text-white/60">
                                <li>Kattints a fenti Google AI Studio linkre (ingyenes)</li>
                                <li>Nyomj a <strong className="text-white/85">"Get API key"</strong> gombra</li>
                                <li>Másold ki a kulcsot (<code className="text-amber-300 font-mono text-[9px]">AIzaSy...</code>) és illeszd be ide:</li>
                              </ol>
                            </div>

                            <div className="flex gap-1.5 items-center">
                              <input
                                type="text"
                                placeholder="Kezdődjön ezzel: AIzaSy..."
                                value={tempKey}
                                onChange={(e) => {
                                  setTempKey(e.target.value);
                                  if (validationError) setValidationError(null);
                                }}
                                className="flex-1 bg-black/50 border border-amber-500/20 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-400 font-mono min-w-0"
                              />
                              <button
                                onClick={handleSaveKey}
                                title="Kulcs mentése"
                                className="bg-amber-400 hover:bg-amber-300 text-black w-8 h-8 rounded-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Validation Error reporting block */}
                            {validationError && (
                              <div className="text-[10px] text-red-300 bg-red-950/25 border border-red-500/20 rounded-lg p-2.5 flex items-start gap-1.5 font-sans">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                <span>{validationError}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <p className="text-[9px] text-white/30 font-mono italic">
                                A kulcs a böngésződben tárolódik; AI kereséskor a saját backendnek elküldjük, adatbázisba nem mentjük.
                              </p>
                              {hasSystemKey && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowByokForm(false);
                                    setValidationError(null);
                                  }}
                                  className="text-amber-400/60 hover:text-amber-300 text-[10px] underline font-sans font-medium"
                                >
                                  Mégse
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* If has private server-side key but no custom user override entered yet, provide a toggle button to show form */
                          <div className="bg-white/3 border border-white/5 rounded-xl p-2.5 text-[10px] flex items-center justify-between font-sans">
                            <span className="text-white/45">Egyéni API kulcs felülbírálás megadása:</span>
                            <button
                              onClick={() => {
                                setTempKey("");
                                setShowByokForm(true);
                              }}
                              className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer text-[10px]"
                            >
                              Kulcs beírása
                            </button>
                          </div>
                        )
                      ) : (
                        /* If custom key is specified and validated */
                        <div className="flex items-center justify-between text-[11px] bg-sky-950/20 border border-sky-500/15 rounded-xl px-3 py-2 font-mono">
                          <div className="text-sky-300 flex flex-col gap-1">
                            <span className="flex items-center gap-1.5">
                              <Key className="w-3.5 h-3.5 text-sky-400 font-normal" />
                              <span>Egyedi kulcs: <strong className="text-white">••••••••{byokKey.slice(-4)}</strong></span>
                            </span>
                            <span className="text-[9px] text-white/35 font-sans">
                              Kereséskor a backendnek továbbítva, mentés nélkül.
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              localStorage.removeItem("BYOK_GEMINI_API_KEY");
                              setByokKey("");
                              setTempKey("");
                              setAiSearchMatches(null);
                              setAiSearchSummary(null);
                              setValidationError(null);
                            }}
                            className="text-white/40 hover:text-red-400 font-bold underline cursor-pointer transition-colors"
                          >
                            Törlés
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-white/30 absolute left-4 top-3.5" />
                    <input
                      id="search-input"
                      type="text"
                      placeholder={
                        isAiSearch
                          ? (hasSystemKey || byokKey)
                            ? "Próbáld: nem működik a bejelentkezés, hogyan mentsek adatot..."
                            : "Adjon meg egy API kulcsot feljebb..."
                          : "Search knowledge..."
                      }
                      disabled={isAiSearch && !hasSystemKey && !byokKey}
                      maxLength={AI_SEARCH_MAX_QUERY_LENGTH}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full bg-black/40 border border-white/10 rounded-full pl-9 pr-9 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all font-mono ${
                        isAiSearch && !hasSystemKey && !byokKey ? "opacity-50 cursor-not-allowed" : ""
                      }`}
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

                  {/* AI Loading State */}
                  {isAiLoading && (
                    <div className="flex items-center justify-center gap-2 py-3 text-sky-400 text-xs font-mono animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                      <span>Gemini gondolkodik a kereséseden...</span>
                    </div>
                  )}

                  {/* AI Error Fallback State */}
                  {aiError && (
                    <div className="text-[10px] text-amber-300 bg-amber-950/25 border border-amber-500/20 rounded-xl p-3 font-mono leading-normal">
                      ⚠ {aiError} (Normál szövegkeresést használunk)
                    </div>
                  )}

                  {/* AI Conceptual Intent Summary */}
                  {isAiSearch && aiSearchSummary && !isAiLoading && (
                    <div className="text-[11px] text-sky-200 bg-sky-950/20 border border-sky-500/10 rounded-xl p-3 leading-relaxed font-sans shadow-inner">
                      <div className="flex items-center gap-1 mb-1 text-sky-400 font-bold uppercase tracking-wider text-[8px] font-mono">
                        <HelpCircle className="w-3 h-3" />
                        AI Értelmezés / Kontextus
                      </div>
                      {aiSearchSummary}
                    </div>
                  )}

                  {searchQuery && (
                    <div id="search-matches-badge" className="text-[10px] bg-sky-950/20 text-sky-300 px-3 py-1.5 rounded-full border border-sky-500/10 font-mono flex items-center justify-between animate-fade-in">
                      <span>Találati lista:</span>
                      <span className="font-bold bg-sky-500/25 px-2 py-0.5 rounded-full text-white text-[11px]">{matchingCount} szó</span>
                    </div>
                  )}

                  {/* AI Semantic Matches List with Reasons */}
                  {isAiSearch && aiSearchMatches && aiSearchMatches.length > 0 && !isAiLoading && (
                    <div className="space-y-1.5 mt-2 pt-2 border-t border-white/5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                      <div className="text-[9px] font-bold text-white/30 uppercase tracking-wider font-sans mb-1.5 pl-1">
                        Szemantikus egyezések (kattints a fókuszhoz):
                      </div>
                      {aiSearchMatches.map((match) => {
                        const fullNode = nodes.find((n) => n.id === match.id);
                        if (!fullNode) return null;
                        const isCurrent = selectedNodeId === match.id;
                        return (
                          <button
                            key={match.id}
                            onClick={() => handleSelectNode(match.id)}
                            className={`w-full text-left p-2 rounded-xl transition-all border text-xs cursor-pointer flex flex-col gap-1 ${
                              isCurrent
                                ? "bg-sky-500/15 border-sky-500/40 text-white"
                                : "bg-black/35 border-white/5 hover:border-white/15 text-white/80 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-mono font-bold text-sky-300 text-[11px]">
                                {fullNode.label}
                              </span>
                              <span
                                className="text-[9px] uppercase tracking-wider px-1.5 py-px rounded bg-white/5 font-mono"
                                style={{ color: fullNode.color }}
                              >
                                {GROUPS[fullNode.group]?.name || fullNode.group}
                              </span>
                            </div>
                            {match.matchReason && (
                              <p className="text-[10px] text-white/50 leading-normal font-sans italic">
                                {match.matchReason}
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Module B: Quick Simplified Tags */}
                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-2.5 backdrop-blur-xl glass-panel">
                  <h3 className="font-sans text-[10px] font-semibold text-white/50 uppercase tracking-[0.2em] flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    Gyorsszűrő Címkék
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TAGS.map((tag) => {
                      const isTagSelected = activeGroup === tag.group;
                      return (
                        <button
                          key={tag.label}
                          onClick={() => {
                            setActiveGroup(isTagSelected ? null : tag.group);
                            setSearchQuery("");
                          }}
                          className={`px-2.5 py-1 text-[10px] font-mono rounded-lg border transition-all cursor-pointer select-none ${
                            isTagSelected
                              ? "bg-sky-500/25 border-sky-400 text-white font-bold shadow-[0_0_8px_rgba(56,189,248,0.2)]"
                              : "bg-black/45 border-white/5 text-[#E0D8D0]/60 hover:text-white hover:border-white/20"
                          }`}
                        >
                          #{tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Module 2: Category Badge Filtering */}
                <GroupFilter
                  activeGroup={activeGroup}
                  onSelectGroup={setActiveGroup}
                />
              </div>
            )}

            {sidebarTab === "beginner" && (
              <div className="space-y-4 animate-fade-in pb-4">
                <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 space-y-1.5 backdrop-blur-xl">
                  <h3 className="text-xs text-amber-400 uppercase tracking-wider font-semibold font-sans flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Kezdő Elakadások
                  </h3>
                  <p className="text-[11px] leading-relaxed text-[#E0D8D0]/80 font-sans">
                    Nem elméleti szavakban gondolkodsz? Válaszd ki, milyen gyakorlati kihívással vagy elakadással küzdesz éppen, és kattints egy fogalomra tippekért!
                  </p>
                </div>

                <div className="space-y-2.5">
                  {BEGINNER_PROBLEMS.map((prob) => {
                    const isSelected = activeBeginnerProblemId === prob.id;
                    return (
                      <div
                        key={prob.id}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-400 shadow-lg"
                            : "bg-black/30 border-white/5 hover:border-white/20"
                        }`}
                        onClick={() => {
                          const nextSelect = isSelected ? null : prob.id;
                          setActiveBeginnerProblemId(nextSelect);
                          if (nextSelect) {
                            // Filter view to focus the relevant elements
                            setActiveGroup(prob.relatedGroups[0]);
                            handleSelectNode(prob.focusedKeywordId);
                          } else {
                            handleResetView();
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-serif text-xs font-semibold text-white tracking-wide">
                            {prob.title}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-amber-400 animate-pulse" : "bg-white/20"}`} />
                        </div>
                        
                        <p className="text-[11px] leading-relaxed text-[#E0D8D0]/70 mt-1.5 font-sans pl-2 border-l border-white/10">
                          {prob.description}
                        </p>

                        {isSelected && (
                          <div className="mt-3 pt-2.5 border-t border-amber-500/20 space-y-1.5">
                            <div className="text-[9px] uppercase tracking-wider text-amber-400/80 font-mono font-bold">
                              Alapvető megoldások itt:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {nodes.filter(n => prob.relatedGroups.includes(n.group)).slice(0, 5).map(node => (
                                <button
                                  key={node.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectNode(node.id);
                                  }}
                                  className="px-2 py-0.5 text-[9px] font-mono bg-black/50 hover:bg-amber-500/20 text-[#E0D8D0] hover:text-white rounded border border-white/10 transition-all"
                                >
                                  {node.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {sidebarTab === "roadmap" && (
              <div className="space-y-4 animate-fade-in pb-4">
                <div className="bg-sky-500/5 border border-sky-500/15 rounded-2xl p-4 space-y-1.5 backdrop-blur-xl">
                  <h3 className="text-xs text-sky-400 uppercase tracking-wider font-semibold font-sans flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5" />
                    AI Kóder Útiterv
                  </h3>
                  <p className="text-[11px] leading-relaxed text-[#E0D8D0]/80 font-sans">
                    Kövesd ezt a lineáris tanulási utat lépésről lépésre, így megbízható rendszerben építhetsz alkalmazásokat a semmiből a produkciós élesítésig!
                  </p>
                </div>

                {/* Vertical connected timeline */}
                <div className="relative pl-4 space-y-3 pt-2 pb-6">
                  {/* Connected Line overlay */}
                  <div className="absolute left-1.5 top-0 bottom-8 w-0.5 bg-gradient-to-b from-sky-400/40 via-sky-400/20 to-transparent pointer-events-none" />

                  {ROADMAP_STEPS.map((step, idx) => {
                    const isSelected = activeRoadmapStepIndex === idx;
                    return (
                      <div
                        key={idx}
                        className={`relative p-3 rounded-xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? "bg-sky-500/10 border-sky-400 shadow-lg"
                            : "bg-black/30 border-white/5 hover:border-white/20"
                        }`}
                        onClick={() => {
                          const nextSelect = isSelected ? null : idx;
                          setActiveRoadmapStepIndex(nextSelect);
                          if (nextSelect !== null) {
                            setActiveGroup(step.group);
                            handleSelectNode(step.keyId);
                          } else {
                            handleResetView();
                          }
                        }}
                      >
                        {/* Connection bullet */}
                        <div className="absolute left-[-21px] top-[18px] w-3 h-3 rounded-full border-2 border-[#050508] flex items-center justify-center transition-all bg-sky-950"
                          style={{
                            borderColor: isSelected ? "#38bdf8" : "#1e293b",
                            backgroundColor: isSelected ? "#38bdf8" : "transparent"
                          }}
                        />

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-mono text-sky-400 font-bold tracking-widest uppercase">
                            Lépés {step.step}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400/20" />
                        </div>

                        <h4 className="font-serif text-xs font-semibold text-white tracking-wide mt-0.5">
                          {step.label}
                        </h4>

                        <p className="text-[10px] leading-normal text-[#E0D8D0]/70 mt-1 font-sans">
                          {step.desc}
                        </p>

                        {isSelected && (
                          <div className="mt-2.5 pt-2 border-t border-sky-500/15 flex items-center justify-between text-[9px] font-mono">
                            <span className="text-sky-400">Fókuszban:</span>
                            <span className="font-bold underline text-white uppercase">{step.keyId.split(".")[1]}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Module 3: Active Layout Mode state display in glass-panel format */}
          <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-4 backdrop-blur-xl glass-panel shrink-0">
            <div>
              <h3 id="layout-title" className="text-[10px] font-semibold text-white/50 uppercase tracking-[0.2em]">
                Nézet és mozgás
              </h3>
              <p className="text-[10px] text-white/40 font-mono mt-1">
                Aktuális nézet: <span className="text-sky-400 capitalize font-medium">{viewMode}</span>
              </p>
            </div>

            <div className="space-y-2 pt-1 border-t border-white/5">
              {/* Reset to chaos button */}
              {(viewMode === "focused" || activeGroup !== null) && (
                <button
                  id="reset-chaos-btn"
                  onClick={handleResetView}
                  className="w-full flex items-center justify-center gap-2 bg-[#E0D8D0]/5 hover:bg-[#E0D8D0]/10 border border-white/10 text-[#E0D8D0] text-[10px] font-semibold py-2 px-3 rounded-full cursor-pointer active:scale-95 transition-all text-center uppercase tracking-widest"
                >
                  <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" />
                  Nézet Visszaállítása
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
            sidebarTab={sidebarTab}
            aiSearchActiveMatches={aiSearchMatches ? aiSearchMatches.map(m => m.id) : null}
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
            onTourAction={handleTourAction}
            onStartTour={() => setTourStep(1)}
          />
        </section>

      </main>

      {/* Bottom Status Bar from the Design HTML */}
      <footer className="relative z-10 shrink-0 border-t border-white/5 bg-[#050508]/40 backdrop-blur-md px-8 py-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-white/40 tracking-[0.22em] uppercase">
        <div className="flex space-x-8 mb-2 md:mb-0">
          <span>Nodes: {nodes.length}</span>
          <span>Relations: {links.length}</span>
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
      
      {/* Onboarding Tour Overlay Component */}
      {tourStep > 0 && (
        <OnboardingTour
          step={tourStep}
          onSetStep={setTourStep}
          onClose={() => setTourStep(0)}
        />
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
