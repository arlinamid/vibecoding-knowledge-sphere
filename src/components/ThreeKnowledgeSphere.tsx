/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import { KeywordNode, KeywordLink, ViewMode } from "../types";

interface ThreeKnowledgeSphereProps {
  nodes: KeywordNode[];
  links: KeywordLink[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  searchQuery: string;
  activeGroup: string | null;
  showRelations: boolean;
  viewMode: ViewMode;
  reducedMotion: boolean;
  onSelectNode: (id: string | null) => void;
  onHoverNode: (id: string | null) => void;
  cameraMode: "inside" | "outside";
  setCameraMode: (mode: "inside" | "outside") => void;
  sidebarTab: "explore" | "beginner" | "roadmap";
  aiSearchActiveMatches?: string[] | null;
}

export const ThreeKnowledgeSphere: React.FC<ThreeKnowledgeSphereProps> = ({
  nodes,
  links,
  selectedNodeId,
  hoveredNodeId,
  searchQuery,
  activeGroup,
  showRelations,
  viewMode,
  reducedMotion,
  onSelectNode,
  onHoverNode,
  cameraMode,
  sidebarTab,
  aiSearchActiveMatches = null,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep a mutable reference to nodes for real-time physics and GSAP tweens
  const nodesRef = useRef<KeywordNode[]>(nodes);

  // Maintain references of all active state props to prevent recreating the ThreeJS context
  const selectedNodeIdRef = useRef(selectedNodeId);
  const hoveredNodeIdRef = useRef(hoveredNodeId);
  const searchQueryRef = useRef(searchQuery);
  const activeGroupRef = useRef(activeGroup);
  const showRelationsRef = useRef(showRelations);
  const viewModeRef = useRef(viewMode);
  const linksRef = useRef(links);
  const cameraModeRef = useRef(cameraMode);
  const reducedMotionRef = useRef(reducedMotion);
  const sidebarTabRef = useRef(sidebarTab);
  const aiSearchActiveMatchesRef = useRef<string[] | null>(aiSearchActiveMatches);

  // Update refs reactively
  useEffect(() => { selectedNodeIdRef.current = selectedNodeId; }, [selectedNodeId]);
  useEffect(() => { hoveredNodeIdRef.current = hoveredNodeId; }, [hoveredNodeId]);
  useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { activeGroupRef.current = activeGroup; }, [activeGroup]);
  useEffect(() => { showRelationsRef.current = showRelations; }, [showRelations]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { linksRef.current = links; }, [links]);
  useEffect(() => { cameraModeRef.current = cameraMode; }, [cameraMode]);
  useEffect(() => { reducedMotionRef.current = reducedMotion; }, [reducedMotion]);
  useEffect(() => { sidebarTabRef.current = sidebarTab; }, [sidebarTab]);
  useEffect(() => { aiSearchActiveMatchesRef.current = aiSearchActiveMatches; }, [aiSearchActiveMatches]);

  // Sync external layout changes (structure vs chaos coordinates) smoothly using GSAP
  useEffect(() => {
    const duration = reducedMotion ? 0.1 : 1.25;
    const ease = "power2.inOut";

    nodes.forEach((updatedNode) => {
      const liveNode = nodesRef.current.find((n) => n.id === updatedNode.id);
      if (liveNode) {
        gsap.to(liveNode, {
          tx: updatedNode.tx,
          ty: updatedNode.ty,
          tz: updatedNode.tz,
          duration,
          ease,
          overwrite: "auto",
        });
      }
    });
  }, [nodes, reducedMotion]);

  // Maintain canvas, camera, scene, controls, and elements in refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const linesGeometryRef = useRef<THREE.BufferGeometry | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);

  const cameraTweenRef = useRef<any>(null);
  const controlsTargetTweenRef = useRef<any>(null);

  // Cache label element references to bypass expensive DOM queries in tick loop
  const labelRefs = useRef<Record<string, HTMLDivElement>>({});

  // Monitor Canvas Mounting and WebGL Context Initialization ONCE on mount
  useEffect(() => {
    if (!mountRef.current) return;

    // Retrieve container width and height initially
    const width = mountRef.current.clientWidth || 500;
    const height = mountRef.current.clientHeight || 500;
    const canvasSize = { width, height };

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 42); // Ideal viewing distance
    cameraRef.current = camera;

    // 3. WebGLRenderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // CRITICAL STYLING: Make the canvas block-aligned and absolutely positioned inside its container.
    // This removes baseline line-height padding behavior which causes circular infinite ResizeObserver triggers!
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    const centerLight = new THREE.PointLight(0xd946ef, 1.2, 50);
    centerLight.position.set(0, 0, 0);
    scene.add(centerLight);

    // 5. Starfield Particles for Depth
    const particleCount = 280;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const fallbackColors = [
      new THREE.Color("#06B6D4"), // cyan
      new THREE.Color("#F59E0B"), // amber
      new THREE.Color("#D946EF"), // magenta
      new THREE.Color("#3B82F6"), // blue
    ];

    for (let i = 0; i < particleCount; i++) {
      const r = 25 + Math.random() * 30; // outer constellation shell
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = fallbackColors[Math.floor(Math.random() * fallbackColors.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // 6. Relationship Lines Geometry
    const linesGeometry = new THREE.BufferGeometry();
    const maxLineSegments = 6000;
    const linePositions = new Float32Array(maxLineSegments * 6);
    const lineColors = new Float32Array(maxLineSegments * 6);

    linesGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    linesGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      linewidth: 1,
    });

    const lineSegments = new THREE.LineSegments(linesGeometry, lineMaterial);
    scene.add(lineSegments);
    linesGeometryRef.current = linesGeometry;

    // 7. OrbitControls initialization
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3.5;
    controls.maxDistance = 75;
    controls.enablePan = true;
    controls.zoomSpeed = 1.2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controlsRef.current = controls;

    // 8. Robust Resize Observer that passes updateStyle=false to block layout updates loop feedback
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(100, entry.contentRect.width);
      const h = Math.max(100, entry.contentRect.height || 500);

      // Track size locally for frame-rate optimization (reflow-free)
      canvasSize.width = w;
      canvasSize.height = h;

      window.requestAnimationFrame(() => {
        if (cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h, false); // CRITICAL: false suppresses style alterations and breaks formatting loop!
        }
      });
    });
    resizeObserver.observe(mountRef.current);

    // 9. Frame renderer tick loop
    let animationFrameId: number;
    const clock = new THREE.Clock();
    const tempV = new THREE.Vector3();

    const tick = () => {
      animationFrameId = requestAnimationFrame(tick);

      const elapsedTime = clock.getElapsedTime();

      // Update Orbit controls with smooth damping
      if (controls && controls.update) {
        controls.update();
      }

      const activeSceneCamera = cameraRef.current;
      const currentNodes = nodesRef.current;

      // Access high level ref values
      const currentViewMode = viewModeRef.current;
      const currentSelectedNodeId = selectedNodeIdRef.current;
      const currentHoveredNodeId = hoveredNodeIdRef.current;
      const currentSearchQuery = searchQueryRef.current.toLowerCase();
      const currentActiveGroup = activeGroupRef.current;
      const currentShowRelations = showRelationsRef.current;
      const currentLinks = linksRef.current;
      const currentAiSearchActiveMatches = aiSearchActiveMatchesRef.current;

      // 1. Organic wave drift relative to targeting anchors in chaos mode
      if (currentViewMode === "chaos") {
        currentNodes.forEach((node, i) => {
          const waveX = Math.sin(elapsedTime * 0.5 + i * 2.3) * 0.45;
          const waveY = Math.cos(elapsedTime * 0.4 + i * 1.7) * 0.45;
          const waveZ = Math.sin(elapsedTime * 0.6 + i * 3.1) * 0.45;

          node.x = node.tx + waveX;
          node.y = node.ty + waveY;
          node.z = node.tz + waveZ;
        });

        if (particles) {
          particles.rotation.y = elapsedTime * 0.012;
          particles.rotation.x = elapsedTime * 0.006;
        }
      } else {
        // Subtle suspension hover float in focused layout mode centered around targets
        currentNodes.forEach((node, i) => {
          if (node.id === currentSelectedNodeId) {
            node.x = node.tx;
            node.y = node.ty;
            node.z = node.tz;
            return; // parent anchor stays locked
          }
          const hoverWave = Math.sin(elapsedTime * 0.8 + i * 0.5) * 0.18;
          node.x = node.tx;
          node.y = node.ty + hoverWave;
          node.z = node.tz;
        });

        if (particles) {
          particles.rotation.y = elapsedTime * 0.003;
        }
      }

      // 2. Compute dynamic lines geometry update
      if (linesGeometryRef.current && activeSceneCamera) {
        const linePosAttr = linesGeometryRef.current.getAttribute("position") as THREE.BufferAttribute;
        const lineColAttr = linesGeometryRef.current.getAttribute("color") as THREE.BufferAttribute;

        let lineIdx = 0;

        currentLinks.forEach((link) => {
          if (lineIdx >= maxLineSegments) return;

          const sNode = currentNodes.find((n) => n.id === link.source);
          const tNode = currentNodes.find((n) => n.id === link.target);

          if (!sNode || !tNode) return;

          let drawLine = false;
          let colorStrength = 0.22;

          // 1. If "Show all relations" toggle is ON, always render all lines globally with lightweight atmospheric exposure
          if (currentShowRelations) {
            drawLine = true;
            colorStrength = 0.08;
          }

          // 2. Focused layout mode selected node's direct connection lines should pop out on foreground with maximum intensity
          if (currentSelectedNodeId && (link.source === currentSelectedNodeId || link.target === currentSelectedNodeId)) {
            drawLine = true;
            colorStrength = 0.65;
          }

          // 3. Hovering a node should dynamically trace and brightly highlight its immediate relations
          if (currentHoveredNodeId && (link.source === currentHoveredNodeId || link.target === currentHoveredNodeId)) {
            drawLine = true;
            // Protect and upgrade intensity for hover focal points
            colorStrength = Math.max(colorStrength, 0.45);
          }

          if (currentAiSearchActiveMatches) {
            const sMatch = currentAiSearchActiveMatches.includes(sNode.id);
            const tMatch = currentAiSearchActiveMatches.includes(tNode.id);
            if (!sMatch || !tMatch) {
              colorStrength *= 0.15;
            }
          } else if (currentSearchQuery) {
            const sMatch = sNode.label.toLowerCase().includes(currentSearchQuery) || sNode.group.toLowerCase().includes(currentSearchQuery);
            const tMatch = tNode.label.toLowerCase().includes(currentSearchQuery) || tNode.group.toLowerCase().includes(currentSearchQuery);
            if (!sMatch || !tMatch) {
              colorStrength *= 0.15;
            }
          }

          if (drawLine) {
            linePosAttr.setXYZ(lineIdx * 2, sNode.x, sNode.y, sNode.z);
            linePosAttr.setXYZ(lineIdx * 2 + 1, tNode.x, tNode.y, tNode.z);

            const cSrc = new THREE.Color(sNode.color);
            const _cTr = new THREE.Color(tNode.color);

            lineColAttr.setXYZ(lineIdx * 2, cSrc.r * colorStrength, cSrc.g * colorStrength, cSrc.b * colorStrength);
            lineColAttr.setXYZ(lineIdx * 2 + 1, _cTr.r * colorStrength, _cTr.g * colorStrength, _cTr.b * colorStrength);

            lineIdx++;
          }
        });

        for (let i = lineIdx; i < maxLineSegments; i++) {
          linePosAttr.setXYZ(i * 2, 0, 0, 0);
          linePosAttr.setXYZ(i * 2 + 1, 0, 0, 0);
          lineColAttr.setXYZ(i * 2, 0, 0, 0);
          lineColAttr.setXYZ(i * 2 + 1, 0, 0, 0);
        }

        linePosAttr.needsUpdate = true;
        lineColAttr.needsUpdate = true;
        linesGeometryRef.current.setDrawRange(0, lineIdx * 2);
      }

      // 3. Project 3D vector coordinates onto 2D viewport space for text labels (with LOD hemisphere filtering)
      if (activeSceneCamera && rendererRef.current && mountRef.current) {
        const w = canvasSize.width;
        const h = canvasSize.height;

        // Precalculate camera orientation relative to the look-at target
        const targetX = controls ? controls.target.x : 0;
        const targetY = controls ? controls.target.y : 0;
        const targetZ = controls ? controls.target.z : 0;

        const camDx = activeSceneCamera.position.x - targetX;
        const camDy = activeSceneCamera.position.y - targetY;
        const camDz = activeSceneCamera.position.z - targetZ;
        const camLen = Math.sqrt(camDx * camDx + camDy * camDy + camDz * camDz) || 1;
        
        const uCamX = camDx / camLen;
        const uCamY = camDy / camLen;
        const uCamZ = camDz / camLen;

        // Map nodes to compute high fidelity metrics
        const candidates = currentNodes.map((node) => {
          const isSelected = node.id === currentSelectedNodeId;
          const isHovered = node.id === currentHoveredNodeId;

          // Always display if selected, hovered, matched by active group, or matched by search query
          let alwaysShow = isSelected || isHovered;

          if (currentActiveGroup && node.group === currentActiveGroup) {
            alwaysShow = true;
          }

          if (currentAiSearchActiveMatches) {
            if (currentAiSearchActiveMatches.includes(node.id)) {
              alwaysShow = true;
            }
          } else if (currentSearchQuery) {
            const matchesQuery =
              node.label.toLowerCase().includes(currentSearchQuery) ||
              node.group.toLowerCase().includes(currentSearchQuery) ||
              node.description.toLowerCase().includes(currentSearchQuery);
            if (matchesQuery) {
              alwaysShow = true;
            }
          }

          // Position tracking relative to target center
          const nodeDx = node.x - targetX;
          const nodeDy = node.y - targetY;
          const nodeDz = node.z - targetZ;

          // Projection along the camera view direction vector (front hemisphere check)
          const proj = nodeDx * uCamX + nodeDy * uCamY + nodeDz * uCamZ;

          // Real distance to camera for Level-of-Detail proximity sorting
          const distDx = node.x - activeSceneCamera.position.x;
          const distDy = node.y - activeSceneCamera.position.y;
          const distDz = node.z - activeSceneCamera.position.z;
          const distance = Math.sqrt(distDx * distDx + distDy * distDy + distDz * distDz);

          return {
            node,
            proj,
            distance,
            alwaysShow
          };
        });

        // Split candidates to apply dynamic visibility limits
        const frontCandidates = candidates.filter((c) => !c.alwaysShow && c.proj > -5.0);

        // Sort front Candidates sorted by proximity (closest nodes first) to maximize FPS
        frontCandidates.sort((a, b) => a.distance - b.distance);

        // Retain specific elements dynamically based on rendering boundaries
        const visibleNodeIds = new Set<string>();

        const hasSelection = currentSelectedNodeId !== null;
        const connectedAtDepth2 = new Set<string>();

        if (hasSelection && currentSelectedNodeId !== null) {
          connectedAtDepth2.add(currentSelectedNodeId);
          const depth1 = new Set<string>();
          currentLinks.forEach((link) => {
            if (link.source === currentSelectedNodeId) {
              depth1.add(link.target);
              connectedAtDepth2.add(link.target);
            } else if (link.target === currentSelectedNodeId) {
              depth1.add(link.source);
              connectedAtDepth2.add(link.source);
            }
          });
          currentLinks.forEach((link) => {
            if (depth1.has(link.source)) {
              connectedAtDepth2.add(link.target);
            }
            if (depth1.has(link.target)) {
              connectedAtDepth2.add(link.source);
            }
          });
        }

        candidates.forEach((c) => {
          if (hasSelection) {
            if (connectedAtDepth2.has(c.node.id)) {
              visibleNodeIds.add(c.node.id);
            }
          } else {
            if (c.alwaysShow) {
              visibleNodeIds.add(c.node.id);
            }
          }
        });

        // Display closest N labels to the user during navigation
        if (!hasSelection) {
          const maxLazyLabels = 75;
          const visibleFrontCount = Math.min(maxLazyLabels, frontCandidates.length);
          for (let i = 0; i < visibleFrontCount; i++) {
            visibleNodeIds.add(frontCandidates[i][i % 1 === 0 ? "node" : "node"].id);
          }
        }

        // Loop and project the actual label elements that are active
        currentNodes.forEach((node) => {
          const el = labelRefs.current[node.id];
          if (!el) return;

          // If lazy filtered out, shut down straight away to bypass layout operations
          if (!visibleNodeIds.has(node.id)) {
            el.style.display = "none";
            return;
          }

          tempV.set(node.x, node.y, node.z);
          tempV.project(activeSceneCamera);

          const isBehind = tempV.z > 1.0;
          if (isBehind) {
            el.style.display = "none";
            return;
          }

          // Layout coordinates utilizing cached dimensions avoids any performance reflows!
          const posX = (tempV.x * 0.5 + 0.5) * w;
          const posY = (-(tempV.y * 0.5) + 0.5) * h;

          const distance = activeSceneCamera.position.distanceTo(new THREE.Vector3(node.x, node.y, node.z));
          const scale = Math.max(0.48, Math.min(1.4, 28 / distance));
          const zIndex = Math.round((100 - distance) * 10);

          let opacity = 1.0;
          let isDimmed = false;
          let sizeMultiplier = 1.0;

          if (currentViewMode === "focused" && currentSelectedNodeId) {
            const isSelf = node.id === currentSelectedNodeId;
            const isDirectRelation = currentLinks.some(
              (l) =>
                (l.source === currentSelectedNodeId && l.target === node.id) ||
                (l.target === currentSelectedNodeId && l.source === node.id)
            );

            if (isSelf) {
              opacity = 1.0;
              sizeMultiplier = 1.35;
            } else if (isDirectRelation) {
              opacity = 1.0;
              sizeMultiplier = 1.15;
            } else {
              opacity = 0.35;
              isDimmed = true;
            }
          }

          if (currentActiveGroup) {
            if (node.group === currentActiveGroup) {
              opacity = 1.0;
              isDimmed = false;
            } else {
              opacity = isDimmed ? opacity * 0.35 : 0.25;
              isDimmed = true;
            }
          }

          if (currentAiSearchActiveMatches) {
            const matchesQuery = currentAiSearchActiveMatches.includes(node.id);

            if (!matchesQuery) {
              opacity = isDimmed ? opacity * 0.25 : 0.2;
              isDimmed = true;
            } else {
              opacity = 1.0;
              sizeMultiplier *= 1.25;
              isDimmed = false;
            }
          } else if (currentSearchQuery) {
            const matchesQuery =
              node.label.toLowerCase().includes(currentSearchQuery) ||
              node.group.toLowerCase().includes(currentSearchQuery) ||
              node.description.toLowerCase().includes(currentSearchQuery);

            if (!matchesQuery) {
              opacity = isDimmed ? opacity * 0.25 : 0.2;
              isDimmed = true;
            } else {
              opacity = 1.0;
              sizeMultiplier *= 1.25;
              isDimmed = false;
            }
          }

          // Edge of sphere horizon fading for beautiful spherical scroll feeling
          const candidateData = candidates.find((c) => c.node.id === node.id);
          if (candidateData && !candidateData.alwaysShow) {
            const fadeStart = -2.5;
            const fadeEnd = -6.5;
            if (candidateData.proj < fadeStart) {
              const fadeRatio = Math.max(0, (candidateData.proj - fadeEnd) / (fadeStart - fadeEnd));
              opacity *= (0.35 + 0.65 * fadeRatio);
            }
          }

          el.style.display = "flex";
          el.style.transform = `translate3d(${posX}px, ${posY}px, 0) translate(-50%, -50%) scale(${scale * sizeMultiplier})`;
          el.style.zIndex = zIndex.toString();
          el.style.opacity = opacity.toString();

          if (isDimmed && opacity < 0.2) {
            el.classList.add("pointer-events-none");
            el.classList.remove("pointer-events-auto");
          } else {
            el.classList.add("pointer-events-auto");
            el.classList.remove("pointer-events-none");
          }
        });
      }

      if (rendererRef.current && sceneRef.current && activeSceneCamera) {
        rendererRef.current.render(sceneRef.current, activeSceneCamera);
      }
    };

    tick();

    // 10. Clear context handlers upon component unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (renderer && renderer.domElement && mountRef.current) {
        if (mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement);
        }
      }
      scene.clear();
    };
  }, []); // Run ONCE on mount to ensure persistent context, never flickering or resetting!

  // Orbit camera transition timelines on mode switch ("inside" vs "outside")
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (cameraTweenRef.current) cameraTweenRef.current.kill();
    if (controlsTargetTweenRef.current) controlsTargetTweenRef.current.kill();

    const duration = reducedMotion ? 0.1 : 1.4;

    if (cameraMode === "inside") {
      cameraTweenRef.current = gsap.to(camera.position, {
        x: 0,
        y: 2.5,
        z: 8.5,
        duration,
        ease: "power3.inOut",
        onUpdate: () => {
          controls.update();
        },
      });
      controlsTargetTweenRef.current = gsap.to(controls.target, {
        x: 0,
        y: 0,
        z: 0,
        duration,
        ease: "power3.inOut",
      });
    } else {
      cameraTweenRef.current = gsap.to(camera.position, {
        x: 0,
        y: 0,
        z: 42,
        duration,
        ease: "power3.out",
        onUpdate: () => {
          controls.update();
        },
      });
      controlsTargetTweenRef.current = gsap.to(controls.target, {
        x: 0,
        y: 0,
        z: 0,
        duration,
        ease: "power3.out",
      });
    }
  }, [cameraMode, reducedMotion]);

  // Adjust camera to look directly at target node when focus state triggered
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (viewMode === "focused" && selectedNodeId) {
      const selectedNode = nodes.find((n) => n.id === selectedNodeId);
      if (selectedNode) {
        const duration = reducedMotion ? 0.1 : 1.25;
        gsap.to(controls.target, {
          x: 0,
          y: 0,
          z: 0,
          duration,
          ease: "power2.inOut",
        });

        gsap.to(camera.position, {
          x: 0,
          y: 6,
          z: 26,
          duration,
          ease: "power2.inOut",
          onUpdate: () => {
            controls.update();
          },
        });
      }
    }
  }, [selectedNodeId, viewMode, reducedMotion, nodes]);

  // Physics impulse on tab switch and layout reset, launching a fresh rotation direction
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Reset controls auto-rotation active parameters
    controls.autoRotate = true;

    if (reducedMotion) {
      controls.autoRotateSpeed = 0.5;
      return;
    }

    // Determine random new rotation direction and push high initial spin speed
    const direction = Math.random() > 0.5 ? 1 : -1;
    const peakSpeed = direction * (4.5 + Math.random() * 3.5); // Fast rotation boost impulse
    const finalSpeed = direction * (viewMode === "chaos" ? 0.6 : 0.2); // Slower drifting spin for elegant focused layout

    controls.autoRotateSpeed = peakSpeed;

    gsap.killTweensOf(controls);
    gsap.to(controls, {
      autoRotateSpeed: finalSpeed,
      duration: 3.2,
      ease: "power2.out",
    });

    // Also push a gorgeous physical orbit pivot camera wobble to animate transition feel
    const camera = cameraRef.current;
    if (camera) {
      const currentPos = { ...camera.position };
      gsap.to(camera.position, {
        x: currentPos.x + (Math.random() - 0.5) * 6,
        y: currentPos.y + (Math.random() - 0.5) * 4,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => {
          controls.update();
        },
      });
    }
  }, [sidebarTab, viewMode, selectedNodeId, activeGroup, reducedMotion]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden" ref={containerRef}>
      {/* 3D Canvas Mount Point */}
      <div id="three-stage" className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing" ref={mountRef} />

      {/* 2D Projected Floating HTML Labels Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;
          const groupColor = node.color || "#FFFFFF";

          const borderStyle = isSelected
            ? `2px solid ${groupColor}`
            : isHovered
            ? `1px solid ${groupColor}`
            : "1px solid rgba(255, 255, 255, 0.15)";

          const shadowStyle = isSelected
            ? `0 0 25px ${groupColor}`
            : isHovered
            ? `0 0 10px ${groupColor}`
            : "0 4px 6px -1px rgba(0, 0, 0, 0.5)";

          return (
            <div
              key={node.id}
              id={`label-${node.id}`}
              ref={(el) => {
                if (el) {
                  labelRefs.current[node.id] = el;
                } else {
                  delete labelRefs.current[node.id];
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node.id);
              }}
              onMouseEnter={() => onHoverNode(node.id)}
              onMouseLeave={() => onHoverNode(null)}
              className="absolute pointer-events-auto cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl select-none transition-all duration-150 backdrop-blur-md"
              style={{
                border: borderStyle,
                boxShadow: shadowStyle,
                backgroundColor: isSelected
                  ? `${groupColor}24` // 14% opacity color tint
                  : isHovered
                  ? "rgba(15, 23, 42, 0.85)"
                  : "rgba(15, 23, 42, 0.6)",
                display: "none", // Updated dynamically inside the tick render loop
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0 animate-pulse"
                style={{ backgroundColor: groupColor }}
              />
              <span
                className="font-sans font-medium text-[11px] md:text-xs tracking-tight select-none"
                style={{
                  color: isSelected || isHovered ? "#FFFFFF" : "rgba(241, 245, 249, 0.9)",
                  textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                {node.label}
              </span>

              {node.deg && node.deg > 0 && !isSelected && (
                <span className="font-mono text-[9px] text-[#E0D8D0]/50 bg-black/40 border border-white/5 px-1 rounded ml-1 scale-90">
                  {node.deg}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
