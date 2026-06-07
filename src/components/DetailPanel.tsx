/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { KeywordNode, KeywordLink } from "../types";
import { GROUPS } from "../data/dictionaryService";
import {
  ChevronDown,
  ChevronUp,
  Terminal,
  AlertTriangle,
  CheckSquare,
  Network,
  X,
  Compass,
  Copy,
  Check
} from "lucide-react";

interface DetailPanelProps {
  selectedNode: KeywordNode | null;
  allNodes: KeywordNode[];
  links: KeywordLink[];
  onSelectNode: (id: string | null) => void;
  onClose: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  selectedNode,
  allNodes,
  links,
  onSelectNode,
  onClose,
}) => {
  // Collapsible accordion states
  const [showPrompts, setShowPrompts] = useState(false);
  const [showAntiPatterns, setShowAntiPatterns] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  // Copy-to-clipboard tracking states
  const [copiedPhraseIdx, setCopiedPhraseIdx] = useState<number | null>(null);
  const [copiedSteps, setCopiedSteps] = useState(false);
  const [copiedAnti, setCopiedAnti] = useState(false);

  // Reset collapse views when node changes
  useEffect(() => {
    setShowPrompts(false);
    setShowAntiPatterns(false);
    setShowChecklist(false);
    setCopiedPhraseIdx(null);
    setCopiedSteps(false);
    setCopiedAnti(false);
  }, [selectedNode]);

  // Copy helper functions
  const copyPhrase = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedPhraseIdx(index);
    setTimeout(() => setCopiedPhraseIdx(null), 1500);
  };

  const copyAllSteps = () => {
    if (!selectedNode) return;
    const text = `Megvalósítási lépések - [${selectedNode.label}]:\n` + 
      selectedNode.checklist.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedSteps(true);
    setTimeout(() => setCopiedSteps(false), 1500);
  };

  const copyAllAntiPatterns = () => {
    if (!selectedNode) return;
    const text = `Anti-Patternök - [${selectedNode.label}]:\n` + 
      selectedNode.anti_patterns.map((item) => {
        const parts = item.split(":");
        const title = parts[0] || "";
        const desc = parts.slice(1).join(":") || "";
        return `- ${title.trim()}${desc ? `: ${desc.trim()}` : ""}`;
      }).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedAnti(true);
    setTimeout(() => setCopiedAnti(false), 1500);
  };

  if (!selectedNode) {
    // Show high-end Atmospheric / Immersive Media "Exploring / Instructions" guide
    return (
      <div 
        id="explore-guide-panel"
        className="flex flex-col gap-5 bg-white/3 border border-white/5 rounded-2xl p-6 backdrop-blur-xl text-[#E0D8D0] h-full justify-between glass-panel overflow-y-auto"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-white/20 rounded-full flex items-center justify-center">
              <Compass className="w-4 h-4 text-white/70 animate-spin-slow" />
            </div>
            <h2 className="text-xs uppercase tracking-[0.3em] font-sans font-semibold opacity-70">
              Térbeli Felfedezés
            </h2>
          </div>
          
          <div className="space-y-1">
            <p className="font-serif text-base italic leading-relaxed opacity-80 pl-3 border-l border-white/10">
              Isten hozott az AI fejlesztői tudásgömb interaktív 3D birodalmában! Itt a szoftveres és prompt fogalmak egy összefüggő gondolati térképet alkotnak.
            </p>
          </div>

          <div className="space-y-3 pt-3 border-t border-white/5">
            <h4 className="text-[10px] font-sans font-semibold text-white/50 uppercase tracking-[0.2em]">
              Interakciós Útmutató
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-xs leading-normal text-[#E0D8D0]/80">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 font-mono text-[10px] text-white/70 border border-white/10">
                  1
                </span>
                <span>
                  <strong>Forgatás</strong>: Kattints és húzd az egérrel a gömb megpörgetéséhez a 3D térben.
                </span>
              </li>
              <li className="flex items-start gap-3 text-xs leading-normal text-[#E0D8D0]/80">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 font-mono text-[10px] text-white/70 border border-white/10">
                  2
                </span>
                <span>
                  <strong>Zoom</strong>: Görgess a szavak közé való mély behatoláshoz vagy tágabb szemléléséhez.
                </span>
              </li>
              <li className="flex items-start gap-3 text-xs leading-normal text-[#E0D8D0]/80">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/5 font-mono text-[10px] text-white/70 border border-white/10">
                  3
                </span>
                <span>
                  <strong>Kiválasztás</strong>: Kattints egy lebegő tokenre! Ekkor a kaotikus gömb egy precíz <strong>csillagképszerű struktúrába</strong> rendeződik.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 text-[10px] text-white/30 font-mono tracking-widest uppercase flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-pulse" />
            <span>Rendszerállapot: STABLE</span>
          </div>
          <div>Adatbázis sűrűség: {allNodes.length} kulcsszó</div>
        </div>
      </div>
    );
  }

  const groupMeta = GROUPS[selectedNode.group];
  const accentColor = selectedNode.color || "#FFFFFF";

  // Gather actual connected keywords
  const connectedIds = new Set<string>();
  links.forEach((l) => {
    if (l.source === selectedNode.id) connectedIds.add(l.target);
    if (l.target === selectedNode.id) connectedIds.add(l.source);
  });

  const relatedNodes = allNodes.filter(
    (n) => n.id !== selectedNode.id && connectedIds.has(n.id)
  );

  return (
    <div
      id="detail-panel-root"
      className="flex flex-col h-full bg-white/3 border rounded-2xl overflow-hidden backdrop-blur-xl transition-all duration-300 glass-panel"
      style={{ borderColor: `${accentColor}33` }} // subtle glowing color border
    >
      {/* Top Header Information */}
      <div 
        className="p-6 border-b border-white/5 relative bg-gradient-to-r from-white/1 to-transparent"
        style={{ borderBottomColor: `${accentColor}20` }}
      >
        <button
          id="close-detail-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/55 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Group specifier badge */}
        <span
          className="mb-3 text-[10px] uppercase tracking-[0.2em] font-sans font-bold flex items-center gap-1.5"
          style={{ color: accentColor }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
          {groupMeta?.name || selectedNode.group}
        </span>

        {/* Word Title - lowercase serif displaying top media aesthetic */}
        <h2 className="font-serif text-4xl italic font-normal tracking-wide text-[#E0D8D0] mt-1 select-text lowercase scrollbar-none overflow-x-auto whitespace-pre">
          {selectedNode.label}
        </h2>
      </div>

      {/* Accordion List Body Scroll */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pr-3 scrolling-mask scrollbar-thin scrollbar-thumb-white/10">
        
        {/* Hungarian Description with serif quote display */}
        <div className="space-y-1">
          <h4 className="text-[9px] uppercase tracking-[0.2em] opacity-40 font-sans font-semibold">
            Magyarázat / Fogalom
          </h4>
          <p 
            className="font-serif text-base italic leading-relaxed text-[#E0D8D0] opacity-85 pl-4 border-l-2"
            style={{ borderLeftColor: `${accentColor}50` }}
          >
            &ldquo;{selectedNode.description}&rdquo;
          </p>
        </div>

        {/* Floating Related Connections Links on structure diagram */}
        {relatedNodes.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-white/5">
            <h4 className="text-[9px] uppercase tracking-[0.2em] opacity-40 font-sans font-semibold flex items-center gap-1.5">
              <Network className="w-3 h-3" style={{ color: accentColor }} />
              Kapcsolati Háló ({relatedNodes.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {relatedNodes.map((rn) => (
                <button
                  key={rn.id}
                  id={`jump-node-${rn.id}`}
                  onClick={() => onSelectNode(rn.id)}
                  className="px-2.5 py-1 text-[10px] font-mono rounded-lg border hover:bg-white/5 hover:text-white transition-all cursor-pointer font-medium"
                  style={{
                    backgroundColor: "rgba(15,23,42,0.45)",
                    borderColor: `${rn.color}25`,
                    color: rn.color,
                  }}
                >
                  {rn.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Checklist Section in elegant serif aesthetic */}
        {selectedNode.checklist.length > 0 && (
          <div className="border border-white/5 rounded-xl overflow-hidden bg-white/2">
            <div className="w-full flex items-center justify-between p-3.5 font-sans font-semibold text-[10px] text-[#E0D8D0]/80 uppercase tracking-widest hover:bg-white/5 transition-colors">
              <button
                id="check-section-header"
                onClick={() => setShowChecklist(!showChecklist)}
                className="flex items-center gap-2 flex-1 text-left cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" style={{ color: accentColor }} />
                Megvalósítási lépések
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyAllSteps();
                  }}
                  className="p-1 px-2.5 text-[9px] font-mono font-bold tracking-wider text-white/55 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Összes lépés másolása"
                >
                  {copiedSteps ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      MÁSOLVA
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-white/60" />
                      MÁSOL
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowChecklist(!showChecklist)}
                  className="p-1.5 text-white/45 hover:text-white transition-colors cursor-pointer"
                >
                  {showChecklist ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            {showChecklist && (
              <div id="check-section-body" className="p-3.5 pt-0 border-t border-white/5">
                <ul className="space-y-2.5">
                  {selectedNode.checklist.map((item, idx) => (
                    <li key={idx} className="flex gap-3 items-start text-xs text-[#E0D8D0] opacity-80 leading-relaxed">
                      <span className="font-mono text-sm leading-none shrink-0" style={{ color: accentColor }}>□</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Section: Anti-Patterns in media style warning box */}
        {selectedNode.anti_patterns.length > 0 && (
          <div className="border border-white/5 rounded-xl overflow-hidden bg-white/2">
            <div className="w-full flex items-center justify-between p-3.5 font-sans font-semibold text-[10px] text-[#E0D8D0]/80 uppercase tracking-widest hover:bg-white/5 transition-colors">
              <button
                id="anti-section-header"
                onClick={() => setShowAntiPatterns(!showAntiPatterns)}
                className="flex items-center gap-2 flex-1 text-left cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                Anti-Patternök
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyAllAntiPatterns();
                  }}
                  className="p-1 px-2.5 text-[9px] font-mono font-bold tracking-wider text-white/55 hover:text-white bg-white/5 hover:bg-white/10 rounded border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Összes anti-pattern másolása"
                >
                  {copiedAnti ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      MÁSOLVA
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-white/60" />
                      MÁSOL
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowAntiPatterns(!showAntiPatterns)}
                  className="p-1.5 text-white/45 hover:text-white transition-colors cursor-pointer"
                >
                  {showAntiPatterns ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            {showAntiPatterns && (
              <div id="anti-section-body" className="p-3.5 pt-0 border-t border-white/5 space-y-2.5">
                {selectedNode.anti_patterns.map((item, idx) => {
                  const parts = item.split(":");
                  const title = parts[0] || "";
                  const desc = parts.slice(1).join(":") || "";

                  return (
                    <div key={idx} className="text-xs bg-black/20 p-3 rounded-lg border border-red-500/10 space-y-1">
                      {title && (
                        <div className="font-mono font-bold text-red-400 text-[10px] uppercase tracking-wider">
                          ❌ {title.trim()}
                        </div>
                      )}
                      {desc && (
                        <p className="text-[#E0D8D0] opacity-75 text-[11px] leading-relaxed font-sans pl-1">
                          {desc.trim()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Collapsible Section: Prompt Phrases styled like design mock's Useful Prompt Phrases */}
        {selectedNode.prompt_phrases.length > 0 && (
          <div className="border border-white/5 rounded-xl overflow-hidden bg-white/2">
            <button
              id="prompt-section-header"
              onClick={() => setShowPrompts(!showPrompts)}
              className="w-full flex items-center justify-between p-3.5 text-left font-sans font-semibold text-[10px] text-[#E0D8D0]/80 uppercase tracking-widest hover:bg-white/5 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                Mintamondatok
              </span>
              {showPrompts ? (
                <ChevronUp className="w-3.5 h-3.5 text-white/45" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-white/45" />
              )}
            </button>
            {showPrompts && (
              <div id="prompt-section-body" className="p-3.5 pt-0 border-t border-white/5 space-y-2.5">
                {selectedNode.prompt_phrases.map((phrase, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-white/3 rounded-xl border-l-2 opacity-85 font-serif italic text-xs leading-relaxed flex items-center justify-between gap-3 group/phrase hover:bg-white/5 transition-all" 
                    style={{ borderLeftColor: accentColor }}
                  >
                    <span className="flex-1 select-all">&ldquo;{phrase}&rdquo;</span>
                    <button
                      onClick={() => copyPhrase(phrase, idx)}
                      className="p-1.5 rounded-lg bg-white/5 text-white/45 hover:text-white hover:bg-white/10 shrink-0 transition-all cursor-pointer"
                      title="Mondat másolása"
                    >
                      {copiedPhraseIdx === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 opacity-60 group-hover/phrase:opacity-100" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
