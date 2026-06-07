/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RawKeywordNode, KeywordNode, KeywordLink, GroupConfig } from "../types";
import legacyDictionary from "./user_dictionary.json";

interface DictionaryCategoryFile {
  group: string;
  keywords: RawKeywordNode[];
}

interface DictionaryCategoryEntry {
  group: string;
  file: string;
  keyword_count: number;
}

interface DictionaryManifest {
  meta?: Record<string, unknown>;
  main_groups?: Record<string, GroupConfig>;
  category_files?: DictionaryCategoryEntry[];
}

interface LegacyDictionaryGroup {
  description?: string;
  keywords?: Record<string, string>;
  prompt_phrases?: string[];
  anti_patterns?: Record<string, string> | string[];
  checklist?: string[];
}

interface LegacyDictionaryRoot {
  meta?: Record<string, unknown>;
  main_groups?: {
    groups?: string[];
  };
  [key: string]: unknown;
}

interface ResolvedDictionaryCategory extends DictionaryCategoryFile {
  file: string;
  source: "split" | "legacy";
}

const legacyDictionaryRoot = legacyDictionary as LegacyDictionaryRoot;
const categoryModules = import.meta.glob("./dictionary/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;
const dictionaryManifest = isDictionaryManifest(categoryModules["./dictionary/manifest.json"])
  ? categoryModules["./dictionary/manifest.json"]
  : null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isGroupConfig(value: unknown): value is GroupConfig {
  if (!isRecord(value)) return false;
  return typeof value.name === "string" && typeof value.color === "string";
}

function isDictionaryManifest(value: unknown): value is DictionaryManifest {
  if (!isRecord(value)) return false;

  const hasValidMeta = value.meta === undefined || isRecord(value.meta);
  const hasValidGroups =
    value.main_groups === undefined ||
    (isRecord(value.main_groups) && Object.values(value.main_groups).every(isGroupConfig));
  const hasValidEntries =
    value.category_files === undefined ||
    (Array.isArray(value.category_files) &&
      value.category_files.every(
        (entry) =>
          isRecord(entry) &&
          typeof entry.group === "string" &&
          typeof entry.file === "string" &&
          typeof entry.keyword_count === "number",
      ));

  return hasValidMeta && hasValidGroups && hasValidEntries;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function isRawKeywordNode(value: unknown): value is RawKeywordNode {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.group === "string" &&
    typeof value.description === "string" &&
    typeof value.type === "string" &&
    Array.isArray(value.prompt_phrases) &&
    Array.isArray(value.anti_patterns) &&
    Array.isArray(value.checklist)
  );
}

function isDictionaryCategoryFile(value: unknown, expectedGroup?: string): value is DictionaryCategoryFile {
  if (!isRecord(value) || typeof value.group !== "string" || !Array.isArray(value.keywords)) {
    return false;
  }
  if (expectedGroup && value.group !== expectedGroup) {
    return false;
  }
  return value.keywords.every(isRawKeywordNode);
}

function getFileName(modulePath: string): string {
  return modulePath.split("/").pop() || modulePath;
}

function getLegacyGroupNames(): string[] {
  return toStringArray(legacyDictionaryRoot.main_groups?.groups);
}

function getLegacyAntiPatterns(group: LegacyDictionaryGroup): string[] {
  if (Array.isArray(group.anti_patterns)) {
    return toStringArray(group.anti_patterns);
  }
  if (isRecord(group.anti_patterns)) {
    return Object.entries(group.anti_patterns)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([key, value]) => `${key}: ${value}`);
  }
  return [];
}

function buildLegacyCategory(groupName: string, file: string): ResolvedDictionaryCategory | null {
  const group = legacyDictionaryRoot[groupName];
  if (!isRecord(group) || !isRecord(group.keywords)) {
    return null;
  }

  const legacyGroup = group as LegacyDictionaryGroup;
  const legacyKeywords = group.keywords as Record<string, string>;
  const promptPhrases = toStringArray(legacyGroup.prompt_phrases);
  const antiPatterns = getLegacyAntiPatterns(legacyGroup);
  const checklist = toStringArray(legacyGroup.checklist);
  const keywords = Object.entries(legacyKeywords)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([label, description]) => ({
      id: `${groupName}.${label}`,
      label,
      group: groupName,
      description,
      type: "keyword",
      prompt_phrases: promptPhrases,
      anti_patterns: antiPatterns,
      checklist,
      relations: [],
    }));

  return keywords.length > 0
    ? {
        group: groupName,
        file,
        source: "legacy",
        keywords,
      }
    : null;
}

function getSplitCategoryEntries(): DictionaryCategoryEntry[] {
  const entries = new Map<string, DictionaryCategoryEntry>();

  for (const entry of dictionaryManifest?.category_files || []) {
    entries.set(entry.group, entry);
  }

  for (const [modulePath, moduleData] of Object.entries(categoryModules)) {
    const file = getFileName(modulePath);
    if (file === "manifest.json" || !isDictionaryCategoryFile(moduleData)) {
      continue;
    }
    if (!entries.has(moduleData.group)) {
      entries.set(moduleData.group, {
        group: moduleData.group,
        file,
        keyword_count: moduleData.keywords.length,
      });
    }
  }

  for (const group of getLegacyGroupNames()) {
    if (!entries.has(group)) {
      entries.set(group, {
        group,
        file: `${group}.json`,
        keyword_count: 0,
      });
    }
  }

  return Array.from(entries.values());
}

function resolveCategory(entry: DictionaryCategoryEntry): ResolvedDictionaryCategory | null {
  const splitModule = categoryModules[`./dictionary/${entry.file}`];
  if (
    isDictionaryCategoryFile(splitModule, entry.group) &&
    splitModule.keywords.length > 0
  ) {
    return {
      ...splitModule,
      file: entry.file,
      source: "split",
    };
  }

  return buildLegacyCategory(entry.group, entry.file);
}

const CATEGORY_DATA = getSplitCategoryEntries()
  .map(resolveCategory)
  .filter((category): category is ResolvedDictionaryCategory => category !== null);

const FALLBACK_GROUP_COLORS = [
  "#F59E0B",
  "#D946EF",
  "#06B6D4",
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#14B8A6",
  "#EF4444",
  "#B91C1C",
  "#EAB308",
  "#84CC16",
  "#64748B",
  "#7C3AED",
  "#22C55E",
  "#0EA5E9",
  "#D97706",
  "#94A3B8",
];

function formatGroupName(group: string): string {
  if (group === "ui_ux") return "UI/UX";
  if (group === "ai_agentic") return "AI & Agentic";
  if (group === "devops_deploy") return "DevOps & Deploy";
  if (group === "testing_qa") return "Tesztelés & QA";

  return group
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildFallbackGroups(groups: string[]): Record<string, GroupConfig> {
  const uniqueGroups = Array.from(new Set(groups));
  return Object.fromEntries(
    uniqueGroups.map((group, index) => [
      group,
      {
        name: formatGroupName(group),
        color: FALLBACK_GROUP_COLORS[index % FALLBACK_GROUP_COLORS.length],
      },
    ]),
  );
}

export const META = dictionaryManifest?.meta || legacyDictionaryRoot.meta || {};
export const GROUPS: Record<string, GroupConfig> = {
  ...buildFallbackGroups([...getLegacyGroupNames(), ...CATEGORY_DATA.map((category) => category.group)]),
  ...(dictionaryManifest?.main_groups || {}),
};
export const DICTIONARY_CATEGORIES = CATEGORY_DATA.map((category) => ({
  group: category.group,
  file: category.file,
  keyword_count: category.keywords.length,
  source: category.source,
}));
export const RAW_NODES: RawKeywordNode[] = CATEGORY_DATA.flatMap((category) => category.keywords);

// Pre-generated colors or color fallback
export function getGroupColor(group: string): string {
  const groupsMap = new Map<string, GroupConfig>(Object.entries(GROUPS));
  return groupsMap.get(group)?.color || "#FFFFFF";
}

function hasWord(text: string, word: string): boolean {
  let index = text.indexOf(word);
  while (index !== -1) {
    let beforeIsBoundary = true;
    let afterIsBoundary = true;
    
    if (index > 0) {
      const prevChar = text.charAt(index - 1);
      if (/[a-zA-Z0-9_]/.test(prevChar)) {
        beforeIsBoundary = false;
      }
    }
    
    const nextIndex = index + word.length;
    if (nextIndex < text.length) {
      const nextChar = text.charAt(nextIndex);
      if (/[a-zA-Z0-9_]/.test(nextChar)) {
        afterIsBoundary = false;
      }
    }
    
    if (beforeIsBoundary && afterIsBoundary) {
      return true;
    }
    
    index = text.indexOf(word, index + 1);
  }
  return false;
}

/**
 * Builds all links (relations) between nodes using the rules defined in the production brief.
 */
export function buildLinks(nodes: RawKeywordNode[]): KeywordLink[] {
  const linksMap = new Map<string, KeywordLink>();

  const addLink = (source: string, target: string, type: "group" | "reference" | "manual") => {
    if (source === target) return;
    // Keep it ordered to avoid duplicate reciprocal relationships (undirected graph)
    const key = [source, target].sort().join("<->");
    
    // Manual takes precedence, then reference, then group
    const existing = linksMap.get(key);
    if (!existing) {
      linksMap.set(key, { source, target, type });
    } else if (type === "manual" || (type === "reference" && existing.type === "group")) {
      linksMap.set(key, { source, target, type });
    }
  };

  // Rule 1: group_relation (all keywords inside the same main group are optionally loosely coupled)
  // Let's connect each node to its neighbor in the same group to form a circle/clique
  const groupsMap: Record<string, string[]> = {};
  for (const node of nodes) {
    if (!groupsMap[node.group]) {
      groupsMap[node.group] = [];
    }
    groupsMap[node.group].push(node.id);
  }

  // Connect peers in the same group as a ring/circle to represent loose coupling elegantly without overlapping spiderwebs
  for (const groupName in groupsMap) {
    const ids = groupsMap[groupName];
    if (ids.length > 1) {
      for (let i = 0; i < ids.length; i++) {
        const nextIdx = (i + 1) % ids.length;
        addLink(ids[i], ids[nextIdx], "group");
      }
    }
  }

  // Rule 2: text_reference_relation
  // If description, prompt_phrases, anti_patterns or checklist contains another node's label/word
  const labelsMap = new Map<string, string>(); // label -> ID
  for (const node of nodes) {
    labelsMap.set(node.label.toLowerCase(), node.id);
  }

  for (const node of nodes) {
    // Collect all text from this node
    const allText = [
      node.description,
      ...node.prompt_phrases,
      ...node.anti_patterns,
      ...node.checklist
    ].join(" ").toLowerCase();

    // Check if other node labels are referenced in this text
    for (const [targetLabel, targetId] of labelsMap.entries()) {
      if (node.id === targetId) continue;
      
      if (hasWord(allText, targetLabel)) {
        addLink(node.id, targetId, "reference");
      }
    }
  }

  // Rule 3: semantic_manual_relation
  // Connected via manual relations
  for (const node of nodes) {
    if (node.relations && Array.isArray(node.relations)) {
      for (const targetId of node.relations) {
        // Verify target exists
        const exists = nodes.some(n => n.id === targetId);
        if (exists) {
          addLink(node.id, targetId, "manual");
        } else {
          // If specified without group prefix (e.g. "access_token" instead of "authentication.jwt")
          // let's search if any node's label matches the semantic reference
          const found = nodes.find(n => n.label === targetId || n.id.endsWith("." + targetId));
          if (found) {
            addLink(node.id, found.id, "manual");
          }
        }
      }
    }
  }

  // Add manually predefined critical links from brief (if and where applicable)
  // jwt -> access_token etc. If they already match, fine. Otherwise, inject manually.
  const manualShortcuts = [
    ["authentication.jwt", "access_token"],
    ["authentication.jwt", "refresh_token"],
    ["authentication.jwt", "token_rotation"],
    ["authentication.jwt", "token_revocation"],
    ["authentication.jwt", "oauth2"],
    ["authentication.jwt", "rbac"],
    ["authentication.jwt", "passkey"],
    ["playwright", "e2e_test"],
    ["playwright", "unit_test"],
    ["playwright", "integration_test"],
    ["ai_agent", "function_calling"],
    ["ai_agent", "rag"],
    ["vibe_coding", "prompt_engineering"]
  ];

  for (const [sQuery, tQuery] of manualShortcuts) {
    const sourceNode = nodes.find(n => n.id === sQuery || n.label === sQuery);
    const targetNode = nodes.find(n => n.id === tQuery || n.label === tQuery);
    if (sourceNode && targetNode) {
      addLink(sourceNode.id, targetNode.id, "manual");
    }
  }

  return Array.from(linksMap.values());
}

/**
 * Initializes nodes with initial spatial locations (Fibonacci Sphere Distribution)
 */
export function initializeNodePositions(nodes: RawKeywordNode[], radius: number = 25): KeywordNode[] {
  const result: KeywordNode[] = [];
  const count = nodes.length;

  for (let i = 0; i < count; i++) {
    const raw = nodes[i];
    
    // Fibonacci Sphere Layout
    const offset = 2 / count;
    const increment = Math.PI * (3 - Math.sqrt(5));
    
    const y = ((i * offset) - 1) + (offset / 2);
    const r = Math.sqrt(1 - y * y);
    const phi = i * increment;
    
    const x = Math.cos(phi) * r;
    const z = Math.sin(phi) * r;

    const posX = x * radius;
    const posY = y * radius;
    const posZ = z * radius;

    result.push({
      ...raw,
      // Current 3D render loop reading values
      x: posX,
      y: posY,
      z: posZ,
      // Target values (GSAP will animate these)
      tx: posX,
      ty: posY,
      tz: posZ,
      color: getGroupColor(raw.group),
      deg: 0 // Will populate
    });
  }

  // Populate link degrees
  const links = buildLinks(nodes);
  for (const link of links) {
    const s = result.find(n => n.id === link.source);
    const t = result.find(n => n.id === link.target);
    if (s) s.deg = (s.deg || 0) + 1;
    if (t) t.deg = (t.deg || 0) + 1;
  }

  return result;
}
