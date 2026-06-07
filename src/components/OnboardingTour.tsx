/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight, ArrowLeft, X, CheckCircle } from "lucide-react";

const translations = new Map<string, string>([
  ["back", "Vissza"],
  ["next", "Tovább"],
  ["start", "Indítás"]
]);
const t = (key: string) => translations.get(key) || key;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface OnboardingTourProps {
  step: number;
  onSetStep: (step: number) => void;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  step,
  onSetStep,
  onClose,
}) => {
  const [rect, setRect] = useState<Rect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Monitor target elements and update position bounding rect dynamically
  useEffect(() => {
    let active = true;

    const getTargetId = (currentStep: number) => {
      switch (currentStep) {
        case 1:
          return "left-control-sidebar";
        case 2:
          return "three-stage";
        case 3:
          return "detail-panel-root";
        case 4:
          return "related-nodes-section";
        default:
          return null;
      }
    };

    const update = () => {
      if (!active) return;
      const targetId = getTargetId(step);
      const el = targetId ? document.getElementById(targetId) : null;
      if (el) {
        const r = el.getBoundingClientRect();
        setRect((prev) => {
          if (
            prev &&
            prev.x === r.x &&
            prev.y === r.y &&
            prev.width === r.width &&
            prev.height === r.height
          ) {
            return prev;
          }
          return { x: r.x, y: r.y, width: r.width, height: r.height };
        });
      } else {
        setRect(null);
      }
      requestAnimationFrame(update);
    };

    update();
    return () => {
      active = false;
    };
  }, [step]);

  // Handle responsive layout checks
  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  if (step < 1 || step > 5) return null;

  const getTooltipStyle = (): React.CSSProperties => {
    if (isMobile) {
      return {
        position: "fixed",
        left: "16px",
        right: "16px",
        bottom: "80px",
        zIndex: 100,
      };
    }

    if (!rect || step === 5) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 100,
      };
    }

    const margin = 16;
    const tooltipWidth = 340;

    switch (step) {
      case 1: // Sidebar on the left
        return {
          position: "fixed",
          left: `${rect.x + rect.width + margin}px`,
          top: `${rect.y + 120}px`,
          width: `${tooltipWidth}px`,
          zIndex: 100,
        };
      case 2: // Canvas in the center
        return {
          position: "fixed",
          left: "50%",
          bottom: "100px",
          transform: "translateX(-50%)",
          width: `${tooltipWidth}px`,
          zIndex: 100,
        };
      case 3: // Detail Panel
      case 4: // Related Nodes Section
        return {
          position: "fixed",
          left: `${rect.x - tooltipWidth - margin}px`,
          top: `${rect.y + (step === 4 ? 240 : 120)}px`,
          width: `${tooltipWidth}px`,
          zIndex: 100,
        };
      default:
        return {
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 100,
        };
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return {
          title: "1. Keresés és Elakadások",
          desc: "A kódolás megkezdéséhez válassz egy gyakorlati problémát a „Kezdő Mód” fülön, írj be egy kérdést a keresőbe, vagy szűrj kategóriák szerint a gyors gombokkal!",
        };
      case 2:
        return {
          title: "2. Csomópont Kiválasztása",
          desc: "Kattints a lebegő 3D csomópontok egyikére a gömbben (például a #tailwind_css-re vagy #jwt-re) a részletes adatlap megnyitásához!",
        };
      case 3:
        return {
          title: "3. Mintamondat Másolása",
          desc: "Itt láthatod a fogalom leírását. Nyisd meg a „Mintamondatok” szekciót a gombjára kattintva, és másolj ki egy promptot a vágólapra!",
        };
      case 4:
        return {
          title: "4. Kapcsolódó Fogalom",
          desc: "A gömbben a szavak gondolati csillagképként kapcsolódnak egymáshoz. Kattints egy szóra a „Kapcsolati Háló” résznél, hogy közvetlenül odaugorj!",
        };
      case 5:
        default:
        return {
          title: "🎉 Onboarding sikeresen teljesítve!",
          desc: "Gratulálunk! Elsajátítottad az interaktív 3D tudástérkép használatát. Most már készen állsz a hatékony, szakszerű vibe codingra!",
        };
    }
  };

  const content = getStepContent();

  return (
    <>
      {/* Dark backdrop panels leaving a transparent cutout spotlight */}
      {rect && step !== 5 ? (
        <>
          <div
            className="fixed top-0 left-0 w-full bg-[#050508]/75 z-[80] transition-all duration-150 pointer-events-auto"
            style={{ height: `${Math.max(0, rect.y)}px` }}
          />
          <div
            className="fixed left-0 bg-[#050508]/75 z-[80] transition-all duration-150 pointer-events-auto"
            style={{
              top: `${rect.y}px`,
              height: `${rect.height}px`,
              width: `${Math.max(0, rect.x)}px`,
            }}
          />
          <div
            className="fixed bg-[#050508]/75 z-[80] transition-all duration-150 pointer-events-auto"
            style={{
              top: `${rect.y}px`,
              height: `${rect.height}px`,
              left: `${rect.x + rect.width}px`,
              right: 0,
            }}
          />
          <div
            className="fixed left-0 w-full bg-[#050508]/75 z-[80] transition-all duration-150 pointer-events-auto"
            style={{
              top: `${rect.y + rect.height}px`,
              bottom: 0,
            }}
          />
          <div
            className="fixed rounded-2xl border-2 border-amber-400 pointer-events-none z-[85] transition-all duration-150 shadow-[0_0_25px_rgba(245,158,11,0.4)]"
            style={{
              left: `${rect.x - 4}px`,
              top: `${rect.y - 4}px`,
              width: `${rect.width + 8}px`,
              height: `${rect.height + 8}px`,
            }}
          />
        </>
      ) : (
        <div
          className="fixed inset-0 bg-[#050508]/80 z-[80] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Floating interactive guide card */}
      <div
        style={getTooltipStyle()}
        className="bg-[#0b0c10]/95 border border-amber-500/30 rounded-2xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-fade-in text-[#E0D8D0]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {step === 5 ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
            )}
            <h3 className="font-serif text-sm font-semibold tracking-wider text-white">
              {content.title}
            </h3>
          </div>

          <p className="text-xs leading-relaxed text-[#E0D8D0]/80">
            {content.desc}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-150 ${
                    s === step
                      ? "bg-amber-400 scale-125 shadow-[0_0_4px_#f59e0b]"
                      : s < step
                      ? "bg-amber-400/40"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {step > 1 && step < 5 && (
                <button
                  onClick={() => onSetStep(step - 1)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                  title={t("back")}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}

              {step < 5 ? (
                <button
                  onClick={() => onSetStep(step + 1)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-sans font-bold text-[10px] rounded-lg tracking-wider uppercase flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-amber-500/10"
                >
                  {t("next")}
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-bold text-[10px] rounded-lg tracking-wider uppercase transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  {t("start")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
