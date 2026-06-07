/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KeywordNode, KeywordLink } from "../types";

/**
 * Calculates the coordinates for the chaotic sphere layout.
 * Each node gets positioned on a sphere of a given radius.
 */
export function calculateChaosLayout(
  nodes: KeywordNode[],
  radius: number = 22
): void {
  const count = nodes.length;
  for (let i = 0; i < count; i++) {
    const node = nodes[i];
    
    // Fibonacci distribution for even spread
    const offset = 2 / count;
    const increment = Math.PI * (3 - Math.sqrt(5));
    
    const y = ((i * offset) - 1) + (offset / 2);
    const r = Math.sqrt(1 - y * y);
    const phi = i * increment;
    
    const x = Math.cos(phi) * r;
    const z = Math.sin(phi) * r;

    node.tx = x * radius;
    node.ty = y * radius;
    node.tz = z * radius;
  }
}

/**
 * Calculates the coordinates for the structured layout centered around a focused node.
 * Ring 1: Directly connected nodes (orbital)
 * Ring 2: Same-category nodes (orbital)
 * Ring 3: All other nodes (loose outer shell or faded)
 */
export function calculateStructuredLayout(
  nodes: KeywordNode[],
  links: KeywordLink[],
  focusedId: string,
  baseRadius: number = 10
): void {
  const focusedNode = nodes.find(n => n.id === focusedId);
  if (!focusedNode) return;

  // 1. Center node
  focusedNode.tx = 0;
  focusedNode.ty = 0;
  focusedNode.tz = 0;

  // 2. Identify relations
  const directRelations = new Set<string>();
  for (const link of links) {
    if (link.source === focusedId) {
      directRelations.add(link.target);
    } else if (link.target === focusedId) {
      directRelations.add(link.source);
    }
  }

  const directList = nodes.filter(n => n.id !== focusedId && directRelations.has(n.id));
  const sameGroupList = nodes.filter(n => n.id !== focusedId && !directRelations.has(n.id) && n.group === focusedNode.group);
  const othersList = nodes.filter(n => n.id !== focusedId && !directRelations.has(n.id) && n.group !== focusedNode.group);

  // Layout Ring 1: Direct Relations
  // Position them evenly on a flat horizontal outer circle/ring (with slight vertical jitter)
  const r1 = baseRadius * 1.3; // e.g. 13 units
  directList.forEach((node, idx) => {
    const angle = (idx / directList.length) * Math.PI * 2;
    // Distribute on an orchid planar or dome shell
    node.tx = Math.cos(angle) * r1;
    node.ty = (Math.sin(idx * 7) * 2); // subtle offset for elevation
    node.tz = Math.sin(angle) * r1;
  });

  // Layout Ring 2: Same Category Peers
  // Position them on a second outer ring or sphere layer
  const r2 = baseRadius * 2.3; // e.g. 23 units
  sameGroupList.forEach((node, idx) => {
    // Spread in spherical ring
    const angle = (idx / sameGroupList.length) * Math.PI * 2;
    const yVal = Math.sin(idx * 3) * (r2 * 0.4);
    const planeR = Math.sqrt(r2 * r2 - yVal * yVal);
    node.tx = Math.cos(angle) * planeR;
    node.ty = yVal;
    node.tz = Math.sin(angle) * planeR;
  });

  // Layout Ring 3: Other Nodes (Distant orbit)
  // Spread widely as a background starfield constellation to highlight the focus
  const r3 = baseRadius * 3.6; // e.g. 36 units
  othersList.forEach((node, idx) => {
    const offset = 2 / othersList.length;
    const increment = Math.PI * (3 - Math.sqrt(5));
    const yFraction = ((idx * offset) - 1) + (offset / 2);
    const rLocal = Math.sqrt(1 - yFraction * yFraction);
    const phi = idx * increment;

    node.tx = Math.cos(phi) * rLocal * r3;
    node.ty = yFraction * r3;
    node.tz = Math.sin(phi) * rLocal * r3;
  });
}
