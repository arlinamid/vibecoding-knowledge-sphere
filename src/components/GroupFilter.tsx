/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { GROUPS } from "../data/dictionaryService";

interface GroupFilterProps {
  activeGroup: string | null;
  onSelectGroup: (group: string | null) => void;
}

export const GroupFilter: React.FC<GroupFilterProps> = ({
  activeGroup,
  onSelectGroup,
}) => {
  return (
    <div className="flex flex-col gap-2 bg-white/3 border border-white/5 rounded-2xl p-4 backdrop-blur-xl glass-panel">
      <div className="flex items-center justify-between">
        <h3 id="group-filter-title" className="font-sans text-[10px] font-semibold text-white/60 uppercase tracking-[0.2em]">
          Kategóriák / Csoportok
        </h3>
        {activeGroup && (
          <button
            id="clear-filter-btn"
            onClick={() => onSelectGroup(null)}
            className="font-sans text-[10px] text-sky-400 hover:text-sky-300 underline underline-offset-2 transition-colors cursor-pointer"
          >
            Szűrő törlése
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {Object.entries(GROUPS).map(([key, config]) => {
          const isActive = activeGroup === key;
          const dotColor = config.color;

          return (
            <button
              key={key}
              id={`filter-btn-${key}`}
              onClick={() => onSelectGroup(isActive ? null : key)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] transition-all duration-150 cursor-pointer select-none border"
              style={{
                borderColor: isActive ? dotColor : "rgba(255,255,255,0.05)",
                backgroundColor: isActive ? `${dotColor}20` : "rgba(15,23,42,0.4)",
              }}
              title={config.name}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: dotColor }}
              />
              <span
                className="font-sans truncate max-w-[120px]"
                style={{
                  color: isActive ? "#FFFFFF" : "rgba(148,163,184,0.85)",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {config.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
