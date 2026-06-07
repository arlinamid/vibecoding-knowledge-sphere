/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RawKeywordNode, KeywordNode, KeywordLink, GroupConfig } from "../types";
import rawData from "./dictionary.json";

export const META = rawData.meta;
export const GROUPS: Record<string, GroupConfig> = rawData.main_groups;
export const RAW_NODES: RawKeywordNode[] = rawData.keywords as RawKeywordNode[];

// Pre-generated colors or color fallback
export function getGroupColor(group: string): string {
  return GROUPS[group]?.color || "#FFFFFF";
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
      
      // Match with simple word boundary / substring checking
      // Using a regex to check if the word exists
      const escapedLabel = targetLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedLabel}\\b`, "i");
      
      if (regex.test(allText) || allText.includes(targetLabel)) {
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
