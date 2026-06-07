/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ViewMode =
  | "intro"
  | "chaos"
  | "focused"
  | "insideSphere"
  | "resetting";

export interface GroupConfig {
  name: string;
  color: string;
}

export interface RawKeywordNode {
  id: string;
  label: string;
  group: string;
  description: string;
  type: string;
  prompt_phrases: string[];
  anti_patterns: string[];
  checklist: string[];
  relations?: string[];
}

export interface KeywordNode extends RawKeywordNode {
  // Coordinates in 3D Space
  x: number;
  y: number;
  z: number;
  // Current target positions for GSAP animations
  tx: number;
  ty: number;
  tz: number;
  // Visual state
  color: string;
  // Connection counts
  deg?: number;
}

export interface KeywordLink {
  source: string; // Node ID
  target: string; // Node ID
  type: "group" | "reference" | "manual";
}

export interface AppState {
  viewMode: ViewMode;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  activeGroup: string | null;
  searchQuery: string;
  showRelations: boolean;
  showChecklist: boolean;
  showAntiPatterns: boolean;
  reducedMotion: boolean;
  performanceMode: boolean; // limit rendering if passive
}
