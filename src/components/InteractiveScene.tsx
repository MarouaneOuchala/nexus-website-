"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { useEnquiry } from "@/components/EnquiryProvider";
import type { ExperienceProps, FeatureId, MeshExperience, MeshTarget } from "@/components/MeshExperience";

const hotspotIds = ["coaching", "curriculum", "scheduling", "coaching-right", "meetings", "presentations", "vocabulary", "negotiation", "career"] as const;
type HotspotId = FeatureId;
const moroccoClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Casablanca", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

function clockAngles() {
  const parts = moroccoClock.formatToParts(new Date());
  const hours = Number(parts.find(part => part.type === "hour")!.value);
  const minutes = Number(parts.find(part => part.type === "minute")!.value);
  const seconds = Number(parts.find(part => part.type === "second")!.value);
  return {
    hour: -(hours % 12 + minutes / 60 + seconds / 3600) * Math.PI / 6,
    minute: -(minutes + seconds / 60) * Math.PI / 30,
    second: -seconds * Math.PI / 30,
  };
}

export default function InteractiveScene() {
  const { t, isRtl } = useSettings();
  const openEnquiry = useEnquiry();
  const h = t.hero;
  const haloRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const fallbackHourRef = useRef<SVGPathElement>(null);
  const fallbackMinuteRef = useRef<SVGPathElement>(null);
  const markerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const experienceRef = useRef<MeshExperience | null>(null);
  const [webgl, setWebgl] = useState(false);
  const [hoveredId, setHoveredId] = useState<HotspotId | null>(null);
  const [focusedId, setFocusedId] = useState<HotspotId | null>(null);
  const [selectedId, setSelectedId] = useState<HotspotId | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showHover = useCallback((id: HotspotId | null) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (id) setHoveredId(id);
    else hoverTimer.current = setTimeout(() => {
      const card = stageRef.current?.querySelector(".mesh-information:not([inert])");
      if (card?.matches(":hover, :focus-within")) return;
      setHoveredId(null);
    }, 250);
  }, []);
  const activeId = focusedId ?? hoveredId ?? selectedId;
  const activeRef = useRef<HotspotId | null>(null);
  const positionPanelRef = useRef<(() => void) | null>(null);
  const coaching = { title: h.coachingLabel, description: h.formatLabel };
  const curriculum = { title: h.curriculumLabel, description: h.curriculumDescription };
  const scheduling = { title: h.schedulingLabel, description: h.schedulingDescription };
  const meetings = { title: h.meetingsLabel, description: h.meetingsDescription };
  const presentations = { title: h.presentationsLabel, description: h.presentationsDescription };
  const vocabulary = { title: h.vocabularyLabel, description: h.vocabularyDescription };
  const negotiation = { title: h.negotiationLabel, description: h.negotiationDescription };
  const career = { title: h.careerLabel, description: h.careerDescription };
  const hotspotInfo = [coaching, curriculum, scheduling, coaching, meetings, presentations, vocabulary, negotiation, career];
  const activeIndex = activeId ? hotspotIds.indexOf(activeId) : -1;

  function dismiss() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (document.activeElement?.closest(".mesh-information")) {
      const index = activeId === "coaching-right" ? 0 : activeIndex;
      markerRefs.current[index]?.focus();
    }
    setHoveredId(null);
    setFocusedId(null);
    setSelectedId(null);
  }
  const experienceProps: ExperienceProps = {
    activeId,
    info: { coaching, curriculum, scheduling, "coaching-right": coaching, meetings, presentations, vocabulary, negotiation, career },
    kicker: h.agendaLabel, closeLabel: h.sceneClose, ctaLabel: h.consultation,
    diagnosticLabel: h.diagnosticLabel,
    direction: isRtl ? "rtl" : "ltr",
    onHover: showHover,
    onSelect: (id) => { setFocusedId(null); setHoveredId(null); setSelectedId(previous => previous === id ? null : id); },
    onDismiss: dismiss,
    onEnquire: (id) => {
      setSelectedId(id);
      openEnquiry({ goal: hotspotInfo[hotspotIds.indexOf(id)].title });
    },
  };
  const experiencePropsRef = useRef(experienceProps);

  useEffect(() => {
    function updateClock() {
      const angles = clockAngles();
      fallbackHourRef.current?.setAttribute("transform", `rotate(${-angles.hour * 180 / Math.PI} 300 32)`);
      fallbackMinuteRef.current?.setAttribute("transform", `rotate(${-angles.minute * 180 / Math.PI} 300 32)`);
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    activeRef.current = activeId;
    experiencePropsRef.current = experienceProps;
    experienceRef.current?.update(experienceProps);
    positionPanelRef.current?.();
  });

  useEffect(() => {
    const mount = mountRef.current;
    const stage = stageRef.current;
    const halo = haloRef.current;
    if (!mount || !stage || !halo) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let cancelled = false;
    let disposeScene: (() => void) | undefined;
    let hovered: HTMLElement | null = null;
    const pointer = { x: 0, y: 0 };
    function positionPanel() {
      const panel = panelRef.current;
      const id = activeRef.current;
      if (!panel || !id) return;
      const marker = markerRefs.current[hotspotIds.indexOf(id)];
      if (!marker) return;
      const bounds = stage!.getBoundingClientRect();
      const point = marker.getBoundingClientRect();
      const x = point.left + point.width / 2 - bounds.left;
      const y = point.top + point.height / 2 - bounds.top;
      const left = Math.max(12, Math.min(x - panel.offsetWidth / 2, bounds.width - panel.offsetWidth - 12));
      const top = y + 32 + panel.offsetHeight < bounds.height - 12
        ? y + 32 : Math.max(12, y - panel.offsetHeight - 32);
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    }
    positionPanelRef.current = positionPanel;
    const panelResize = new ResizeObserver(() => {
      positionPanel();
    });
    panelResize.observe(stage);
    function restoreFallback() {
      stage!.dataset.sceneReady = "true";
      positionPanel();
    }
    if (reducedMotion.matches) restoreFallback();

    function resetHover() {
      hovered?.style.removeProperty("--tilt-x");
      hovered?.style.removeProperty("--tilt-y");
      hovered?.removeAttribute("data-pointer");
      hovered = null;
    }

    function resetPointer() {
      resetHover();
      pointer.x = 0;
      pointer.y = 0;
      halo!.dataset.active = "false";
    }

    function onPointerMove(event: PointerEvent) {
      if (reducedMotion.matches || !finePointer.matches || event.pointerType === "touch") return;
      halo!.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      halo!.dataset.active = "true";
      const sceneBounds = mount!.getBoundingClientRect();
      pointer.x = Math.max(-1, Math.min(1, (event.clientX - sceneBounds.left) / sceneBounds.width * 2 - 1));
      pointer.y = Math.max(-1, Math.min(1, (event.clientY - sceneBounds.top) / sceneBounds.height * 2 - 1));
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>(".program-item, .scene-feature-control, .button, .getting-started-step")
        : null;
      if (target !== hovered) resetHover();
      hovered = target;
      halo!.dataset.interactive = String(!!target);
      if (!target) return;
      const bounds = target.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      target.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
      target.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
      target.style.setProperty("--tilt-x", `${(0.5 - y) * 6}deg`);
      target.style.setProperty("--tilt-y", `${(x - 0.5) * 6}deg`);
      target.dataset.pointer = "true";
    }

    async function startScene() {
      if (reducedMotion.matches || cancelled || disposeScene) return;
      let disposePending: (() => void) | undefined;
      try {
        const THREE = await import("three");
        if (cancelled || reducedMotion.matches || disposeScene) return;
        const canvas = document.createElement("canvas");
        canvas.setAttribute("aria-hidden", "true");
        const context = canvas.getContext("webgl2", { alpha: true, antialias: true });
        if (!context) {
          mount!.dataset.renderer = "fallback";
          console.warn("NEXUS: WebGL2 is unavailable; displaying the static scene.");
          restoreFallback();
          return;
        }
        const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const scene = new THREE.Scene();
        const targets: MeshTarget[] = [];
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
        camera.position.set(0, 3.5, 8.8);
        camera.lookAt(0, 0.3, 0);
        const workspace = new THREE.Group();
        scene.add(workspace);
        const geometries: InstanceType<typeof THREE.BufferGeometry>[] = [];
        const materials: InstanceType<typeof THREE.Material>[] = [];
        disposePending = () => {
          geometries.forEach(geometry => geometry.dispose());
          materials.forEach(surface => surface.dispose());
          renderer.dispose();
          canvas.remove();
        };
        function material(color: number, emissive = false) {
          const result = new THREE.MeshStandardMaterial({
            color, roughness: 0.8, metalness: 0.05,
            emissive: emissive ? color : 0x000000, emissiveIntensity: emissive ? 0.12 : 0,
          });
          materials.push(result);
          return result;
        }
        const violet = material(0xc98288);
        const dark = material(0x4f6a61);
        const lime = material(0xe4b653, true);
        const paper = material(0xffefce);
        const screen = material(0x30564e);
        const blue = material(0xaecabc, true);
        const windowGlass = material(0xaecabc, true);
        function box(parent: InstanceType<typeof THREE.Group>, size: [number, number, number], position: [number, number, number], surface: InstanceType<typeof THREE.Material>) {
          const geometry = new THREE.BoxGeometry(...size);
          geometries.push(geometry);
          const mesh = new THREE.Mesh(geometry, surface);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.position.set(...position);
          parent.add(mesh);
          return mesh;
        }
        const wall = material(0xe9bea9);
        const curtainMaterial = material(0xb6636c);
        const scenery = new THREE.Group();
        workspace.add(scenery);
        const carpet = new THREE.Group();
        carpet.name = "woven-carpet";
        carpet.position.set(0, -0.94, -0.05);
        workspace.add(carpet);
        const carpetField = material(0x702b3d);
        const carpetBorder = material(0x242d48);
        const carpetGold = material(0xb58a4e);
        const carpetThread = material(0xb8a184);
        for (const surface of [carpetField, carpetBorder, carpetGold, carpetThread]) {
          surface.roughness = 1;
          surface.metalness = 0;
        }
        const base = box(carpet, [10.2, 0.075, 4.8], [0, 0, 0], carpetBorder);
        base.castShadow = false;
        box(carpet, [9.9, 0.018, 4.5], [0, 0.045, 0], carpetGold).castShadow = false;
        box(carpet, [9.68, 0.016, 4.28], [0, 0.06, 0], carpetBorder).castShadow = false;
        box(carpet, [9.1, 0.014, 3.7], [0, 0.073, 0], carpetField).castShadow = false;
        const weaveVertices: number[] = [];
        for (let row = 0; row < 95; row++) {
          const z = -1.9 + row * 0.04;
          weaveVertices.push(-4.6, 0.083, z, 4.6, 0.083, z);
        }
        const weaveGeometry = new THREE.BufferGeometry();
        weaveGeometry.setAttribute("position", new THREE.Float32BufferAttribute(weaveVertices, 3));
        geometries.push(weaveGeometry);
        const weaveMaterial = new THREE.LineBasicMaterial({ color: 0xc1a17d, transparent: true, opacity: 0.12 });
        materials.push(weaveMaterial);
        carpet.add(new THREE.LineSegments(weaveGeometry, weaveMaterial));
        const motifVertices: number[] = [];
        function diamond(x: number, z: number, width: number, depth: number) {
          const points = [[x, z - depth], [x + width, z], [x, z + depth], [x - width, z]];
          points.forEach(([px, pz], index) => {
            const next = points[(index + 1) % points.length];
            motifVertices.push(px, 0.089, pz, next[0], 0.089, next[1]);
          });
        }
        for (let column = -3; column <= 3; column++) {
          for (const z of [-1.15, 0, 1.15]) {
            diamond(column * 1.2, z, 0.43, 0.46);
            diamond(column * 1.2, z, 0.34, 0.37);
            diamond(column * 1.2, z, 0.17, 0.19);
            for (const side of [-1, 1]) {
              diamond(column * 1.2 + side * 0.48, z, 0.055, 0.07);
            }
          }
        }
        for (const side of [-1, 1]) {
          for (let index = -12; index <= 12; index++) {
            diamond(index * 0.37, side * 2, 0.11, 0.1);
          }
          for (let index = -4; index <= 4; index++) {
            diamond(side * 4.7, index * 0.4, 0.1, 0.13);
          }
        }
        for (const x of [-2.4, 0, 2.4]) {
          const medallion = new THREE.Shape();
          medallion.moveTo(0, -0.43);
          medallion.lineTo(0.14, -0.23);
          medallion.lineTo(0.3, -0.23);
          medallion.lineTo(0.3, -0.1);
          medallion.lineTo(0.45, 0);
          medallion.lineTo(0.3, 0.1);
          medallion.lineTo(0.3, 0.23);
          medallion.lineTo(0.14, 0.23);
          medallion.lineTo(0, 0.43);
          medallion.lineTo(-0.14, 0.23);
          medallion.lineTo(-0.3, 0.23);
          medallion.lineTo(-0.3, 0.1);
          medallion.lineTo(-0.45, 0);
          medallion.lineTo(-0.3, -0.1);
          medallion.lineTo(-0.3, -0.23);
          medallion.lineTo(-0.14, -0.23);
          medallion.closePath();
          const geometry = new THREE.ShapeGeometry(medallion);
          geometries.push(geometry);
          const motif = new THREE.Mesh(geometry, carpetGold);
          motif.rotation.x = -Math.PI / 2;
          motif.position.set(x, 0.087, 1.15);
          carpet.add(motif);
        }
        const motifGeometry = new THREE.BufferGeometry();
        motifGeometry.setAttribute("position", new THREE.Float32BufferAttribute(motifVertices, 3));
        geometries.push(motifGeometry);
        const motifMaterial = new THREE.LineBasicMaterial({ color: 0xd3b47b });
        materials.push(motifMaterial);
        carpet.add(new THREE.LineSegments(motifGeometry, motifMaterial));
        for (const side of [-1, 1]) {
          for (let knot = 0; knot < 40; knot++) {
            const fringe = box(carpet, [0.25 + (knot % 3) * 0.025, 0.018, 0.033], [side * 5.2, 0.01, -2.24 + knot * 0.115], carpetThread);
            fringe.rotation.y = Math.sin(knot * 2.4) * 0.08;
            fringe.castShadow = false;
          }
        }
        const foliage = material(0x58765b);
        const terracotta = material(0xb97460);
        const lampGlow = material(0xffe3a0, true);
        const shelf = new THREE.Group();
        const bookPages = material(0xfffcf3);
        const pageInk = material(0x7d857d);
        const bookColors = [0xb77c99, 0x759fa8, 0xd99a73, 0xa49bc3, 0x91ac83, 0xd3ad60];
        for (let index = bookColors.length - 1; index > 0; index--) {
          const other = Math.floor(Math.random() * (index + 1));
          [bookColors[index], bookColors[other]] = [bookColors[other], bookColors[index]];
        }
        const bookHitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
        materials.push(bookHitMaterial);
        shelf.position.set(-3.65, -0.85, -0.8);
        scenery.add(shelf);
        box(shelf, [1.35, 2.55, 0.16], [0, 1.27, -0.3], terracotta);
        for (const x of [-0.68, 0.68]) box(shelf, [0.1, 2.65, 0.6], [x, 1.3, 0], paper);
        for (let row = 0; row < 4; row++) {
          box(shelf, [1.45, 0.09, 0.65], [0, row * 0.78, 0], paper);
          if (row === 3) continue;
          for (let book = 0; book < 6; book++) {
            const height = 0.39 + (book % 3) * 0.085;
            const volume = new THREE.Group();
            volume.position.set(-0.49 + book * 0.19, row * 0.78 + height / 2 + 0.05, 0.07);
            volume.rotation.z = book === 5 ? -0.12 : 0;
            shelf.add(volume);
            if (book === 2) {
              const id = (["vocabulary", "negotiation", "career"] as const)[row];
              volume.name = `book-${id}`;
              const body = new THREE.Group();
              volume.add(body);
              const coverMaterial = material(bookColors[row]);
              box(body, [0.104, height, 0.035], [0, 0, 0.18], coverMaterial);
              const bindingGeometry = new THREE.CylinderGeometry(0.018, 0.018, height - 0.035, 16);
              geometries.push(bindingGeometry);
              const binding = new THREE.Mesh(bindingGeometry, bookPages);
              binding.name = "book-binding";
              binding.position.z = 0.17;
              body.add(binding);
              const covers = [-1, 1].map(side => {
                const hinge = new THREE.Group();
                hinge.position.set(0, 0, 0.18);
                body.add(hinge);
                const cover = box(hinge, [0.014, height, 0.36], [side * 0.045, 0, -0.18], coverMaterial);
                cover.name = "book-cover";
                const pageGeometry = new THREE.BoxGeometry(0.024, height - 0.035, 0.34, 1, 1, 18);
                const vertices = pageGeometry.attributes.position;
                for (let index = 0; index < vertices.count; index++) {
                  const depth = vertices.getZ(index) - 0.17;
                  const t = -depth / 0.34;
                  const curve = -side * (0.006 + Math.sin(t * Math.PI) * 0.018);
                  vertices.setXYZ(index, curve + vertices.getX(index) * t, vertices.getY(index), depth);
                }
                pageGeometry.computeVertexNormals();
                geometries.push(pageGeometry);
                const pages = new THREE.Mesh(pageGeometry, bookPages);
                hinge.add(pages);
                pages.name = "book-pages";
                for (let edge = 0; edge < 3; edge++) {
                  box(hinge, [0.002, height - 0.05, 0.002], [-side * (0.003 + edge * 0.005), 0, -0.339], pageInk);
                }
                for (let line = 0; line < 5; line++) {
                  const inkGeometry = new THREE.BufferGeometry().setFromPoints(
                    Array.from({ length: 13 }, (_, index) => {
                      const t = 0.2 + index / 12 * (line === 4 ? 0.42 : 0.64);
                      return new THREE.Vector3(
                        -side * (0.006 + Math.sin(t * Math.PI) * 0.018 + 0.013 * t),
                        height / 2 - 0.1 - line * 0.065, -t * 0.34,
                      );
                    }),
                  );
                  geometries.push(inkGeometry);
                  const inkMaterial = new THREE.LineBasicMaterial({ color: 0x899087 });
                  materials.push(inkMaterial);
                  const ink = new THREE.Line(inkGeometry, inkMaterial);
                  ink.raycast = () => {};
                  hinge.add(ink);
                }
                return hinge;
              });
              // Keep the shelf slot hittable as the visible book slides out.
              const hit = box(volume, [0.15, height, 0.38], [0, 0, 0], bookHitMaterial);
              hit.castShadow = false;
              hit.receiveShadow = false;
              targets.push({
                id, object: volume, anchor: [0, height / 2 + 0.15, 0.6],
                book: { body, leftCover: covers[0], rightCover: covers[1] },
              });
            } else {
              box(volume, [0.13, height, 0.36], [0, 0, 0], [violet, dark, lime, blue][book % 4]);
              box(volume, [0.09, 0.025, 0.015], [0, 0.13 - height / 2, 0.19], paper);
            }
          }
        }
        const plant = new THREE.Group();
        plant.name = "olive-tree";
        plant.position.set(3.7, -0.85, 0.1);
        scenery.add(plant);
        const potGeometry = new THREE.CylinderGeometry(0.38, 0.25, 0.65, 32, 1, true);
        geometries.push(potGeometry);
        const pot = new THREE.Mesh(potGeometry, terracotta);
        pot.position.y = 0.33;
        pot.castShadow = true;
        pot.receiveShadow = true;
        terracotta.side = THREE.DoubleSide;
        plant.add(pot);
        const soilMaterial = material(0x49392d);
        const bark = material(0x74614b);
        foliage.side = THREE.DoubleSide;
        const soilGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.035, 32);
        geometries.push(soilGeometry);
        const soil = new THREE.Mesh(soilGeometry, soilMaterial);
        soil.position.y = 0.625;
        soil.receiveShadow = true;
        plant.add(soil);
        for (const [radius, y, thickness] of [[0.375, 0.64, 0.035], [0.28, 0.1, 0.012], [0.33, 0.39, 0.01]]) {
          const ringGeometry = new THREE.TorusGeometry(radius, thickness, 8, 40);
          geometries.push(ringGeometry);
          const ring = new THREE.Mesh(ringGeometry, terracotta);
          ring.rotation.x = Math.PI / 2;
          ring.position.y = y;
          ring.castShadow = true;
          plant.add(ring);
        }
        const trunkCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(-0.04, 1.05, 0.02),
          new THREE.Vector3(0.06, 1.65, -0.03), new THREE.Vector3(0, 2.35, 0),
        ]);
        const trunkGeometry = new THREE.TubeGeometry(trunkCurve, 18, 0.045, 8, false);
        const trunkVertices = trunkGeometry.attributes.position;
        for (let index = 0; index < trunkVertices.count; index++) {
          const y = trunkVertices.getY(index);
          const t = THREE.MathUtils.clamp((y - 0.6) / 1.75, 0, 1);
          const center = trunkCurve.getPointAt(t);
          const taper = 1 - t * 0.65;
          trunkVertices.setX(index, center.x + (trunkVertices.getX(index) - center.x) * taper);
          trunkVertices.setZ(index, center.z + (trunkVertices.getZ(index) - center.z) * taper);
        }
        trunkGeometry.computeVertexNormals();
        geometries.push(trunkGeometry);
        const trunk = new THREE.Mesh(trunkGeometry, bark);
        trunk.castShadow = true;
        plant.add(trunk);
        const oliveLeafGeometry = new THREE.PlaneGeometry(1, 1, 4, 10);
        const leafVertices = oliveLeafGeometry.attributes.position;
        for (let index = 0; index < leafVertices.count; index++) {
          const x = leafVertices.getX(index), y = leafVertices.getY(index), t = y + 0.5;
          leafVertices.setXYZ(index, x * Math.sin(Math.PI * t) * 0.95, y, Math.sin(t * Math.PI) * 0.12 - Math.abs(x) * 0.08);
        }
        oliveLeafGeometry.computeVertexNormals();
        const leafTones = new Float32Array(leafVertices.count * 3);
        for (let index = 0; index < leafVertices.count; index++) {
          const vein = Math.abs(leafVertices.getX(index)) < 0.001;
          leafTones.set(vein ? [1, 1, 0.85] : [0.78, 0.88, 0.72], index * 3);
        }
        oliveLeafGeometry.setAttribute("color", new THREE.BufferAttribute(leafTones, 3));
        foliage.vertexColors = true;
        geometries.push(oliveLeafGeometry);
        const canopy = new THREE.InstancedMesh(oliveLeafGeometry, foliage, 324);
        canopy.name = "olive-leaves";
        canopy.castShadow = true;
        canopy.receiveShadow = true;
        const leafTransform = new THREE.Object3D();
        const leafColor = new THREE.Color();
        let leafIndex = 0;
        for (let branch = 0; branch < 18; branch++) {
          const angle = branch * 2.4;
          const start = new THREE.Vector3(0.02, 1.05 + branch * 0.062, 0);
          const reach = 0.55 + Math.sin(branch * 1.7) * 0.16;
          const tip = new THREE.Vector3(Math.cos(angle) * reach, 1.8 + branch * 0.043, Math.sin(angle) * reach * 0.75);
          const curve = new THREE.QuadraticBezierCurve3(start, new THREE.Vector3(tip.x * 0.65, tip.y - 0.2, tip.z * 0.65), tip);
          const geometry = new THREE.TubeGeometry(curve, 8, 0.012, 5, false);
          geometries.push(geometry);
          const stem = new THREE.Mesh(geometry, bark);
          stem.castShadow = true;
          plant.add(stem);
          for (let pair = 0; pair < 9; pair++) {
            const point = curve.getPoint(0.3 + pair * 0.085);
            for (const side of [-1, 1]) {
              const leafAngle = angle + side * 0.75;
              leafTransform.position.set(point.x + Math.cos(leafAngle) * 0.075, point.y + 0.045, point.z + Math.sin(leafAngle) * 0.075);
              leafTransform.rotation.set(0.35 + Math.sin(branch + pair) * 0.55, -leafAngle, side * (0.65 + pair * 0.06));
              leafTransform.scale.set(0.075, 0.23 + (pair % 3) * 0.025, 0.13);
              leafTransform.updateMatrix();
              canopy.setMatrixAt(leafIndex, leafTransform.matrix);
              leafColor.setHex((branch + pair) % 3 === 0 ? 0xc4d1b6 : (pair % 2 ? 0x9bb78c : 0x718c65));
              canopy.setColorAt(leafIndex++, leafColor);
            }
          }
        }
        plant.add(canopy);
        const releaseTree = disposePending;
        disposePending = () => { canopy.dispose(); releaseTree(); };
        const leafGeometry = new THREE.SphereGeometry(1, 16, 12);
        geometries.push(leafGeometry);
        for (let index = 0; index < 14; index++) {
          const pebble = new THREE.Mesh(leafGeometry, bark);
          const angle = index * 2.4;
          pebble.position.set(Math.cos(angle) * 0.22, 0.65, Math.sin(angle) * 0.22);
          pebble.scale.set(0.025, 0.012, 0.018);
          plant.add(pebble);
        }
        const lamp = new THREE.Group();
        lamp.position.set(4.65, -0.85, -1.2);
        scenery.add(lamp);
        box(lamp, [0.6, 0.08, 0.6], [0, 0, 0], dark);
        box(lamp, [0.045, 2.25, 0.045], [0, 1.13, 0], lime);
        const shadeGeometry = new THREE.CylinderGeometry(0.25, 0.52, 0.55, 32, 1, true);
        geometries.push(shadeGeometry);
        const shade = new THREE.Mesh(shadeGeometry, material(0xffefce));
        shade.material.side = THREE.DoubleSide;
        shade.position.y = 2.35;
        lamp.add(shade);
        const bulb = new THREE.Mesh(leafGeometry, lampGlow);
        bulb.scale.setScalar(0.12);
        bulb.position.y = 2.16;
        lamp.add(bulb);
        const lampLight = new THREE.PointLight(0xffcf83, 0, 5, 2);
        lampLight.position.set(4.65, 1.2, -1.2);
        scenery.add(lampLight);
        box(workspace, [5.2, 3.5, 0.12], [0, 0.8, -1.7], wall);
        box(workspace, [5.3, 0.15, 0.24], [0, 2.58, -1.6], lime);
        for (const x of [-2.2, 2.2]) {
          box(workspace, [0.65, 2.9, 0.12], [x, 0.95, -1.55], windowGlass);
          box(workspace, [0.72, 0.09, 0.23], [x, 2.42, -1.45], paper);
          box(workspace, [0.04, 2.8, 0.06], [x, 0.95, -1.44], paper);
          box(workspace, [0.65, 0.04, 0.06], [x, 0.95, -1.43], paper);
        }
        const curtains = [-1, 1].map(side => {
          const curtain = new THREE.Group();
          curtain.position.set(side * 2.55, 0.95, -1.2);
          workspace.add(curtain);
          for (let fold = 0; fold < 4; fold++) {
            box(curtain, [0.13, 3.1, 0.13], [side * fold * 0.1, 0, fold % 2 * 0.08], curtainMaterial);
          }
          return curtain;
        });
        box(workspace, [3.8, 0.18, 1.85], [0, -0.1, 0.25], violet);
        for (const x of [-1.45, 1.45]) {
          for (const z of [-0.35, 0.85]) box(workspace, [0.12, 0.7, 0.12], [x, -0.5, z], dark);
        }
        // Presentation screen faces the viewer; chart bars grow from a shared baseline.
        const presentation = new THREE.Group();
        targets.push({ id: "curriculum", object: presentation, anchor: [0, 0.6, 0.3] });
        presentation.position.set(0, 0.85, -1.4);
        workspace.add(presentation);
        box(presentation, [3.3, 1.9, 0.13], [0, 0, 0], violet);
        box(presentation, [3.1, 1.7, 0.04], [0, 0, 0.09], screen);
        box(presentation, [1.15, 0.06, 0.03], [-0.7, 0.56, 0.13], paper);
        box(presentation, [0.7, 0.035, 0.03], [-0.92, 0.38, 0.13], blue);
        const clock = new THREE.Group();
        clock.name = "schedule-clock";
        clock.position.set(0, 2.13, -1.47);
        workspace.add(clock);
        targets.push({ id: "scheduling", object: clock, anchor: [0, -0.3, 0.25] });
        const clockFaceGeometry = new THREE.CylinderGeometry(0.27, 0.27, 0.05, 32);
        geometries.push(clockFaceGeometry);
        const clockFace = new THREE.Mesh(clockFaceGeometry, paper);
        clockFace.rotation.x = Math.PI / 2;
        clockFace.position.set(0, 0, -0.05);
        clock.add(clockFace);
        for (let tick = 0; tick < 12; tick++) {
          const angle = tick * Math.PI / 6;
          const mark = box(clock, [0.012, tick % 3 === 0 ? 0.035 : 0.022, 0.008], [Math.sin(angle) * 0.225, Math.cos(angle) * 0.225, -0.014], dark);
          mark.rotation.z = -angle;
        }
        const hourHand = new THREE.Group();
        hourHand.name = "clock-hour";
        const minuteHand = new THREE.Group();
        minuteHand.name = "clock-minute";
        const secondHand = new THREE.Group();
        secondHand.name = "clock-second";
        clock.add(hourHand, minuteHand, secondHand);
        box(hourHand, [0.02, 0.13, 0.012], [0, 0.05, 0], dark);
        box(minuteHand, [0.014, 0.2, 0.01], [0, 0.08, 0.014], dark);
        box(secondHand, [0.006, 0.24, 0.008], [0, 0.075, 0.026], violet);
        box(clock, [0.025, 0.025, 0.016], [0, 0, 0.035], violet);
        let clockSecond = -1;
        function syncClock() {
          const second = Math.floor(Date.now() / 1000);
          if (second === clockSecond) return;
          clockSecond = second;
          const angles = clockAngles();
          hourHand.rotation.z = angles.hour;
          minuteHand.rotation.z = angles.minute;
          secondHand.rotation.z = angles.second;
        }
        syncClock();
        const chart = [0.38, 0.62, 0.85, 1.05].map((height, index) => {
          const bar = box(presentation, [0.3, height, 0.04], [-0.85 + index * 0.55, -0.65 + height / 2, 0.14], index === 3 ? lime : blue);
          return { bar, height };
        });
        const laptops: InstanceType<typeof THREE.Group>[] = [];
        for (const x of [-1.05, 1.05]) {
          const laptop = new THREE.Group();
          targets.push({ id: x < 0 ? "coaching" : "coaching-right", object: laptop, anchor: [0, 0.8, 0] });
          laptop.position.set(x, 0.04, 0.5);
          laptop.rotation.y = x < 0 ? 0.16 : -0.16;
          workspace.add(laptop);
          box(laptop, [0.9, 0.055, 0.65], [0, 0, 0], paper);
          const lid = new THREE.Group();
          lid.position.set(0, 0, -0.3);
          laptop.add(lid);
          box(lid, [0.9, 0.6, 0.045], [0, 0.3, 0], violet);
          box(lid, [0.78, 0.47, 0.02], [0, 0.31, 0.035], screen);
          for (let row = 0; row < 3; row++) {
            box(lid, [0.45 - row * 0.08, 0.025, 0.015], [-0.08, 0.42 - row * 0.1, 0.052], row === 0 ? lime : blue);
          }
          laptops.push(lid);
          const chair = new THREE.Group();
          chair.position.set(x, -0.45, 1.45);
          workspace.add(chair);
          box(chair, [0.68, 0.1, 0.62], [0, 0, 0], dark);
          box(chair, [0.68, 0.65, 0.1], [0, 0.3, 0.28], violet);
          box(chair, [0.1, 0.4, 0.1], [0, -0.2, 0], dark);
        }
        const notebook = new THREE.Group();
        notebook.name = "desk-notebook";
        notebook.position.set(0, 0.06, 0.65);
        notebook.rotation.y = -0.12;
        workspace.add(notebook);
        box(notebook, [0.55, 0.045, 0.65], [0, 0, 0], paper);
        box(notebook, [0.025, 0.015, 0.65], [-0.18, 0.03, 0], violet);
        for (let row = 0; row < 4; row++) {
          box(notebook, [0.28, 0.01, 0.016], [0.03, 0.03, -0.18 + row * 0.1], dark);
        }
        const turningPage = new THREE.Group();
        turningPage.name = "notebook-turning-page";
        turningPage.position.set(-0.18, 0.045, 0);
        notebook.add(turningPage);
        box(turningPage, [0.42, 0.008, 0.6], [0.21, 0, 0], paper);
        for (let row = 0; row < 4; row++) {
          box(turningPage, [0.26, 0.01, 0.014], [0.21, 0.01, -0.18 + row * 0.1], dark);
        }
        const notes = new THREE.Group();
        notes.name = "meeting-notes";
        targets.push({ id: "meetings", object: notes, anchor: [0, 0.55, 0.1] });
        notes.position.set(-2.05, 1.15, -0.15);
        notes.rotation.set(0, 0.2, -0.12);
        workspace.add(notes);
        box(notes, [0.65, 0.8, 0.04], [0, 0, 0], paper);
        for (let row = 0; row < 4; row++) {
          box(notes, [0.36, 0.025, 0.02], [0, 0.22 - row * 0.14, 0.04], row === 0 ? violet : dark);
        }
        const flashcards = new THREE.Group();
        flashcards.name = "presentation-cards";
        targets.push({ id: "presentations", object: flashcards, anchor: [0, 0.4, 0.1] });
        workspace.add(flashcards);
        box(flashcards, [0.55, 0.4, 0.035], [0.08, -0.07, -0.06], violet);
        box(flashcards, [0.55, 0.4, 0.035], [0, 0, 0], paper);
        box(flashcards, [0.32, 0.025, 0.02], [0, 0.06, 0.03], dark);
        box(flashcards, [0.23, 0.025, 0.02], [0, -0.06, 0.03], violet);
        const celestial = new THREE.Group();
        celestial.name = "celestial";
        workspace.add(celestial);
        const sun = new THREE.Group();
        sun.name = "sun";
        const moon = new THREE.Group();
        moon.name = "moon";
        celestial.add(sun, moon);
        const orbGeometry = new THREE.SphereGeometry(0.38, 32, 24);
        geometries.push(orbGeometry);
        const sunlight = new THREE.MeshBasicMaterial({ color: 0xffcc60 });
        const moonlight = new THREE.MeshStandardMaterial({
          color: 0xf4efff, roughness: 0.95, emissive: 0xc3ceff, emissiveIntensity: 0.75,
        });
        const craterMaterial = new THREE.MeshStandardMaterial({
          color: 0xa5accd, roughness: 1, emissive: 0x7e88b4, emissiveIntensity: 0.35,
        });
        materials.push(sunlight, moonlight, craterMaterial);
        sun.add(new THREE.Mesh(orbGeometry, sunlight));
        const lunarSurface = new THREE.Group();
        moon.add(lunarSurface);
        lunarSurface.add(new THREE.Mesh(orbGeometry, moonlight));
        const craterGeometry = new THREE.SphereGeometry(1, 16, 12);
        geometries.push(craterGeometry);
        for (const [x, y, radius] of [[-0.14, 0.13, 0.08], [0.13, -0.1, 0.1], [-0.14, -0.18, 0.045], [0.19, 0.17, 0.04], [0.02, 0.25, 0.035]]) {
          const normal = new THREE.Vector3(x, y, Math.sqrt(0.38 ** 2 - x ** 2 - y ** 2)).normalize();
          const crater = new THREE.Mesh(craterGeometry, craterMaterial);
          crater.position.copy(normal).multiplyScalar(0.375);
          crater.scale.set(radius, radius, 0.012);
          crater.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
          lunarSurface.add(crater);
        }
        const rays = new THREE.Group();
        sun.add(rays);
        for (let index = 0; index < 12; index++) {
          const ray = new THREE.Group();
          ray.rotation.z = index * Math.PI / 6;
          rays.add(ray);
          const beam = box(ray, [0.025, 0.15, 0.025], [0, 0.57, 0], sunlight);
          beam.castShadow = false;
          beam.receiveShadow = false;
        }
        // A camera-facing radial sprite gives both solid orbs a soft, depth-scaled glow.
        const glowPixels = new Uint8Array(64 * 64 * 4);
        for (let y = 0; y < 64; y++) {
          for (let x = 0; x < 64; x++) {
            const offset = (y * 64 + x) * 4;
            const distance = Math.hypot((x - 31.5) / 31.5, (y - 31.5) / 31.5);
            glowPixels[offset] = glowPixels[offset + 1] = glowPixels[offset + 2] = 255;
            glowPixels[offset + 3] = Math.round(Math.max(0, 1 - distance) ** 2 * 125);
          }
        }
        const glowTexture = new THREE.DataTexture(glowPixels, 64, 64);
        const releaseGeometry = disposePending;
        disposePending = () => { glowTexture.dispose(); releaseGeometry(); };
        glowTexture.needsUpdate = true;
        const glowMaterial = new THREE.SpriteMaterial({
          map: glowTexture, color: 0xffd06a, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        materials.push(glowMaterial);
        const glow = new THREE.Sprite(glowMaterial);
        glow.scale.set(2.1, 2.1, 1);
        celestial.add(glow);
        const celestialLight = new THREE.PointLight(0xffd06a, 2, 6, 2);
        celestial.add(celestialLight);
        const celestialOrigin = new THREE.Vector3(3.75, 2.2, -0.45);
        celestial.position.copy(celestialOrigin);
        const ambient = new THREE.AmbientLight(0xffefd7, 2.4);
        scene.add(ambient);
        const key = new THREE.PointLight(0xffedd0, 45);
        key.position.set(3, 3, 4);
        const rim = new THREE.PointLight(0xffd6c2, 25);
        rim.position.set(-3, -1, 2);
        scene.add(key, rim);
        const daylight = new THREE.DirectionalLight(0xffe6b3, 1.8);
        daylight.position.set(-3, 7, 5);
        daylight.castShadow = true;
        daylight.shadow.mapSize.set(1024, 1024);
        daylight.shadow.camera.left = -7;
        daylight.shadow.camera.right = 7;
        daylight.shadow.camera.top = 6;
        daylight.shadow.camera.bottom = -5;
        daylight.shadow.normalBias = 0.035;
        daylight.shadow.bias = -0.0002;
        daylight.shadow.radius = 4;
        scene.add(daylight);
        const interactionTrims = targets.map(target => {
          const trim = new THREE.LineBasicMaterial({
            color: 0xa84955, transparent: true, opacity: 0.75, depthWrite: false,
          });
          materials.push(trim);
          const surfaces: InstanceType<typeof THREE.Mesh>[] = [];
          target.object.traverse(object => {
            if (object instanceof THREE.Mesh && object.material !== bookHitMaterial && object.name !== "book-pages") surfaces.push(object);
          });
          for (const surface of surfaces) {
            surface.geometry.computeBoundingBox();
            const dimensions = new THREE.Vector3();
            surface.geometry.boundingBox!.getSize(dimensions);
            if ([dimensions.x, dimensions.y, dimensions.z].filter(size => size >= 0.25).length < 2) continue;
            const edges = new THREE.EdgesGeometry(surface.geometry, 35);
            geometries.push(edges);
            const outline = new THREE.LineSegments(edges, trim);
            outline.name = "interactive-trim";
            outline.scale.setScalar(1.006);
            outline.raycast = () => {};
            surface.add(outline);
          }
          return { id: target.id, material: trim };
        });
        const { createMeshExperience } = await import("@/components/MeshExperience");
        if (cancelled || reducedMotion.matches) {
          disposePending();
          return;
        }
        mount!.appendChild(canvas);
        const experience = await createMeshExperience(canvas, renderer, scene, camera, workspace, targets, () => {
          stage!.dataset.sceneReady = "true";
        });
        if (cancelled || reducedMotion.matches) {
          experience.dispose();
          disposePending();
          return;
        }
        experienceRef.current = experience;
        experience.update(experiencePropsRef.current);
        let activeObject: HotspotId | null = null;
        let visible = false;
        let frame = 0;
        let previousTime = 0;
        let elapsed = 0;
        function syncTheme() {
          const night = document.documentElement.dataset.theme === "dark";
          interactionTrims.forEach(({ material: trim }) => trim.color.setHex(night ? 0xffba9e : 0xa84955));
          sun.visible = !night;
          moon.visible = night;
          glowMaterial.color.setHex(night ? 0xaec8ff : 0xffd06a);
          celestialLight.color.copy(glowMaterial.color);
          celestialLight.intensity = night ? 1.2 : 2;
          for (const [surface, day, evening] of [
            [violet, 0xc98288, 0xa26273],
            [dark, 0x4f6a61, 0x30453e],
            [wall, 0xe9bea9, 0x384b49],
            [curtainMaterial, 0xb6636c, 0x633a50],
            [screen, 0x30564e, 0x132e2b],
            [windowGlass, 0xaecabc, 0x304c70],
            [carpetField, 0x702b3d, 0x512737],
            [carpetBorder, 0x242d48, 0x20273d],
            [foliage, 0x58765b, 0x395d56],
            [terracotta, 0xb97460, 0x785063],
          ] as const) {
            surface.color.setHex(night ? evening : day);
          }
          windowGlass.emissive.setHex(night ? 0x517db3 : 0xaecabc);
          windowGlass.emissiveIntensity = night ? 0.5 : 0.12;
          ambient.color.setHex(night ? 0xb6c9e3 : 0xffefd7);
          ambient.intensity = night ? 1.1 : 2.4;
          key.intensity = night ? 32 : 45;
          rim.color.setHex(night ? 0x93b8ee : 0xffd6c2);
          rim.intensity = night ? 16 : 25;
          daylight.color.setHex(night ? 0xaac5ff : 0xffe6b3);
          daylight.intensity = night ? 0.65 : 1.8;
          lampLight.intensity = night ? 9 : 0;
          lampGlow.emissiveIntensity = night ? 1.5 : 0.15;
          experience.advance(elapsed);
        }
        const themeObserver = new MutationObserver(syncTheme);
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        syncTheme();
        function render(time: number) {
          frame = 0;
          const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
          previousTime = time;
          elapsed += delta;
          const nextActive = activeRef.current;
          if (nextActive !== activeObject) {
            activeObject = nextActive;
            canvas.style.cursor = activeObject ? "pointer" : "";
          }
          interactionTrims.forEach(({ id, material: trim }) => {
            trim.opacity = activeObject ? (activeObject === id ? 0.95 : 0) : 0.65 + Math.sin(elapsed * 1.6) * 0.15;
          });
          workspace.rotation.y += (pointer.x * 0.16 + Math.sin(elapsed * 0.35) * 0.055 - workspace.rotation.y) * 0.06;
          workspace.rotation.x += (pointer.y * 0.07 + Math.sin(elapsed * 0.45) * 0.018 - workspace.rotation.x) * 0.06;
          workspace.position.y = Math.sin(elapsed * 0.6) * 0.045;
          scenery.rotation.y = -workspace.rotation.y * 0.45;
          celestial.position.copy(celestialOrigin);
          celestial.position.y += Math.sin(elapsed * 0.8) * 0.1;
          celestial.position.x += Math.sin(elapsed * 0.45) * 0.06;
          rays.rotation.z = elapsed * 0.18;
          sun.scale.setScalar(1 + Math.sin(elapsed * 1.3) * 0.035);
          lunarSurface.rotation.set(Math.sin(elapsed * 0.55) * 0.08, Math.sin(elapsed * 0.4) * 0.2, Math.sin(elapsed * 0.65) * 0.09);
          glowMaterial.opacity = 0.85 + Math.sin(elapsed * 0.9) * 0.15;
          plant.rotation.z = Math.sin(elapsed * 0.65) * 0.018;
          const theatreTime = Math.floor(elapsed * 12) / 12;
          if (activeObject !== "meetings") {
            notes.position.y = 1.15 + Math.sin(theatreTime * 1.4) * 0.2;
            notes.rotation.z = -0.12 + Math.sin(theatreTime * 0.9) * 0.12;
          }
          if (activeObject !== "presentations") {
            flashcards.position.set(2.05 + Math.sin(theatreTime * 0.8) * 0.13, 1.05 + Math.sin(theatreTime * 1.3 + 2) * 0.24, -0.1);
            flashcards.rotation.set(0.08, Math.sin(theatreTime * 0.7) * 0.3, Math.sin(theatreTime * 0.9) * 0.16);
          }
          const opening = 1 - Math.pow(1 - Math.min(elapsed / 2.4, 1), 3);
          curtains.forEach((curtain, index) => {
            const side = index ? 1 : -1;
            curtain.position.x = side * (1.25 + opening * 1.3);
            curtain.rotation.y = Math.sin(theatreTime * 0.9) * side * 0.16;
          });
          const pageCycle = (theatreTime + 15) % 45;
          turningPage.rotation.z = pageCycle < 2.5 ? Math.sin(pageCycle / 2.5 * Math.PI) * 2.6 : 0;
          syncClock();
          laptops.forEach((lid, index) => { lid.rotation.x = -0.25 + Math.sin(theatreTime * 0.8 + index) * 0.18; });
          chart.forEach(({ bar, height }, index) => {
            const scale = 0.65 + Math.sin(theatreTime * 1.5 + index * 0.8) * 0.33;
            bar.scale.y = scale;
            bar.position.y = -0.65 + height * scale / 2;
          });
          key.position.x = 3 + pointer.x * 2;
          experience.advance(elapsed);
          if (!document.hidden && (visible || stage!.dataset.sceneReady !== "true")) frame = requestAnimationFrame(render);
        }
        function syncPlayback() {
          stage!.dataset.playing = String(visible && !document.hidden && !reducedMotion.matches);
          if ((visible || stage!.dataset.sceneReady !== "true") && !document.hidden && !reducedMotion.matches) {
            if (!frame) { previousTime = 0; frame = requestAnimationFrame(render); }
          } else {
            cancelAnimationFrame(frame);
            frame = 0;
          }
        }
        const resize = new ResizeObserver(() => {
          const { width, height } = mount!.getBoundingClientRect();
          if (!width || !height) return;
          experience.resize(width, height);
          camera.aspect = width / height;
          scenery.visible = camera.aspect > 1.3;
          const compact = camera.aspect <= 1.3;
          celestialOrigin.set(compact ? 2.05 : 3.75, compact ? 2.45 : 2.2, compact ? 0.5 : -0.45);
          celestial.position.copy(celestialOrigin);
          celestial.scale.setScalar(compact ? 0.72 : 1);
          camera.position.set(0, 3.5, 8.8).multiplyScalar(Math.max(1, 1.25 / camera.aspect));
          camera.lookAt(0, 0.3, 0);
          camera.updateProjectionMatrix();
          experience.advance(elapsed);
        });
        const observer = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          syncPlayback();
        });
        function onContextLost(event: Event) {
          event.preventDefault();
          disposeScene?.();
          disposeScene = undefined;
          mount!.dataset.renderer = "fallback";
          restoreFallback();
          stage!.dataset.playing = "false";
          console.warn("NEXUS: WebGL context lost; displaying the static scene.");
        }
        disposeScene = () => {
          stage!.dataset.playing = "false";
          cancelAnimationFrame(frame);
          resize.disconnect();
          observer.disconnect();
          themeObserver.disconnect();
          document.removeEventListener("visibilitychange", syncPlayback);
          canvas.removeEventListener("webglcontextlost", onContextLost);
          experience.dispose();
          experienceRef.current = null;
          setWebgl(false);
          geometries.forEach(geometry => geometry.dispose());
          materials.forEach(surface => surface.dispose());
          glowTexture.dispose();
          canopy.dispose();
          renderer.dispose();
          daylight.shadow.dispose();
          canvas.remove();
          mount!.dataset.renderer = "fallback";
          restoreFallback();
        };
        disposePending = undefined;
        canvas.addEventListener("webglcontextlost", onContextLost);
        document.addEventListener("visibilitychange", syncPlayback);
        mount!.dataset.renderer = "webgl";
        setWebgl(true);
        resize.observe(mount!);
        observer.observe(mount!);
      } catch (error) {
        disposePending?.();
        disposeScene?.();
        disposeScene = undefined;
        console.warn("NEXUS: Unable to initialize the 3D scene; displaying the static scene.", error);
        mount!.dataset.renderer = "fallback";
        restoreFallback();
      }
    }

    function onMotionChange() {
      resetPointer();
      if (reducedMotion.matches) {
        disposeScene?.();
        disposeScene = undefined;
        restoreFallback();
      } else {
        void startScene();
      }
    }

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", resetPointer);
    window.addEventListener("blur", resetPointer);
    reducedMotion.addEventListener("change", onMotionChange);
    finePointer.addEventListener("change", resetPointer);
    void startScene();
    return () => {
      cancelled = true;
      disposeScene?.();
      panelResize.disconnect();
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      positionPanelRef.current = null;
      resetPointer();
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", resetPointer);
      window.removeEventListener("blur", resetPointer);
      reducedMotion.removeEventListener("change", onMotionChange);
      finePointer.removeEventListener("change", resetPointer);
    };
  }, [showHover]);

  return (
    <>
      <div
        ref={stageRef}
        className="hero-visual immersive-room"
        data-focused={activeId ? "true" : "false"}
        role="group"
        aria-label={h.agendaLabel}
        aria-describedby="scene-instruction"
        onPointerLeave={() => showHover(null)}
        onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); dismiss(); } }}
      >
        <div className="room-atmosphere" aria-hidden="true">
          <div className="room-arch room-arch-left" />
          <div className="room-arch room-arch-right" />
          <div className="room-light-pattern" />
          <div className="room-celestial">
            <svg className="room-sun" viewBox="0 0 120 120" fill="none">
              <g className="sun-rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {Array.from({ length: 12 }, (_, index) => (
                  <path key={index} d="M60 9V20" transform={`rotate(${index * 30} 60 60)`} />
                ))}
              </g>
              <circle className="sun-disc" cx="60" cy="60" r="29" fill="currentColor" />
            </svg>
            <svg className="room-moon" viewBox="0 0 120 120" fill="none">
              <circle cx="60" cy="60" r="33" fill="#f4efff" />
              <g fill="#c9c9df">
                <circle cx="47" cy="44" r="8" />
                <circle cx="73" cy="70" r="10" />
                <circle cx="45" cy="76" r="5" />
                <circle cx="76" cy="43" r="4" />
              </g>
              <path d="M40 34a32 32 0 0 1 43 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div ref={mountRef} className="scene-mount">
          <svg className="scene-fallback" viewBox="0 0 600 360" fill="none" aria-hidden="true">
            <g className="fallback-carpet">
              <path d="m30 275 460-45 100 100-460 28Z" fill="#242d48" stroke="#b58a4e" strokeWidth="4" />
              <path d="m62 282 419-38 79 76-419 24Z" fill="#702b3d" stroke="#d3b47b" strokeWidth="2" />
              <path d="m110 290 25-15 28 13-25 16Zm95-8 25-15 28 13-25 16Zm95-8 25-15 28 13-25 16Zm95-8 25-15 28 13-25 16Zm-200 57 25-15 28 13-25 16Zm95-6 25-15 28 13-25 16Zm95-6 25-15 28 13-25 16Z" stroke="#d3b47b" strokeWidth="2" />
              <path d="m25 283-14 2m20 8-14 2m20 8-14 2m20 8-14 2m20 8-14 2m20 8-14 2m20 8-14 2" stroke="#b8a184" strokeWidth="4" />
            </g>
            <g className="fallback-furnishings">
              <rect x="0" y="130" width="65" height="185" rx="3" fill="#b97460" />
              <path d="M0 185h65M0 245h65M0 307h65" stroke="#fff0d0" strokeWidth="7" />
              <path d="M12 175v-32m13 32v-36m14 36v-29m13 29v-35M12 235v-32m13 32v-36m14 36v-29m13 29v-35M12 297v-32m13 32v-36m14 36v-29m13 29v-35" stroke="#e4b653" strokeWidth="8" />
              <path d="M550 270h38l-6 44h-26Z" fill="#b97460" />
              <path d="M551 272h36M555 282h29" stroke="#d29972" strokeWidth="3" />
              <ellipse cx="569" cy="271" rx="16" ry="3" fill="#49392d" />
              <path d="M569 275q-5-55 2-108m-3 69-24-39m25 23 21-37m-20 14-16-29m16 15 13-23" stroke="#74614b" strokeWidth="3" />
              {Array.from({ length: 64 }, (_, index) => {
                const side = index % 2 ? 1 : -1;
                const y = 173 + Math.floor(index / 2) * 2;
                const x = 570 + side * (8 + Math.sin(index * 1.7) * 12);
                return <path key={index} d="M0 0Q-5-7 0-16Q5-7 0 0Z" transform={`translate(${x} ${y}) rotate(${side * 48})`} fill={index % 3 ? "#58765b" : "#91a58b"} />;
              })}
            </g>
            <rect x="36" y="10" width="528" height="310" fill="#e9bea9" stroke="#b6636c" strokeWidth="8" />
            <path d="M80 50h55v135H80Zm385 0h55v135h-55Z" fill="#aecabc" stroke="#fff0d0" strokeWidth="6" />
            <circle cx="300" cy="32" r="15" fill="#fff0d0" stroke="#934e55" strokeWidth="2" />
            <path ref={fallbackHourRef} d="M300 32v-7" stroke="#49695c" strokeWidth="2" />
            <path ref={fallbackMinuteRef} d="M300 32v-11" stroke="#49695c" strokeWidth="1.5" />
            <rect x="170" y="60" width="260" height="135" fill="#30564e" stroke="#e4b653" strokeWidth="4" />
            <path d="M195 85h100M195 103h65" stroke="#fff0d0" strokeWidth="5" />
            <path d="M210 170v-30m45 30v-45m45 45v-60m45 60V100" stroke="#e4b653" strokeWidth="18" />
            <path d="M105 250 290 185 510 260 325 335Z" fill="#c98288" stroke="#934e55" strokeWidth="3" />
            <path d="M125 260v40m360-30v35m-160 10v30" stroke="#49695c" strokeWidth="9" />
            <path d="m160 235 55-17 40 18-55 17Z" fill="#fff0d0" />
            <path d="m160 235-6-48 58-17 3 48Z" fill="#30564e" stroke="#c98288" strokeWidth="3" />
            <path d="m340 250 55-17 40 18-55 17Z" fill="#fff0d0" />
            <path d="m340 250-6-48 58-17 3 48Z" fill="#30564e" stroke="#c98288" strokeWidth="3" />
            <path d="m263 263 26-9 30 11-26 10Z" fill="#fff0d0" />
          </svg>
        </div>
        <p id="scene-instruction" className="sr-only">{h.sceneInstruction}</p>
        {!webgl && activeIndex >= 0 && (
          <div
            ref={panelRef}
            id="scene-information"
            className="scene-information rounded-2xl border border-white/30 p-5 shadow-xl backdrop-blur-xl"
            role="region"
            aria-labelledby="scene-information-title"
            onPointerEnter={() => { if (hoverTimer.current) clearTimeout(hoverTimer.current); setHoveredId(activeId); }}
            onPointerLeave={() => showHover(null)}
            onFocusCapture={() => setFocusedId(activeId)}
            onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusedId(null); }}
          >
            <button className="scene-information-close" type="button" aria-label={h.sceneClose} onClick={() => {
              markerRefs.current[activeIndex]?.focus();
              dismiss();
            }}>×</button>
            <p className="scene-information-kicker">{h.agendaLabel}</p>
            <h2 id="scene-information-title">{hotspotInfo[activeIndex].title}</h2>
            <p>{hotspotInfo[activeIndex].description}</p>
            <p className="scene-diagnostic-note">{h.diagnosticLabel}</p>
            <button className="scene-information-cta" type="button" onClick={() => {
              setSelectedId(activeId);
              openEnquiry({ goal: hotspotInfo[activeIndex].title });
            }}>{h.consultation}<span aria-hidden="true">↗</span></button>
          </div>
        )}
      </div>
      <div className="scene-feature-controls" role="group" aria-label={h.agendaLabel}
        onKeyDown={(event) => { if (event.key === "Escape") dismiss(); }}>
        {hotspotIds.map((id, index) => id === "coaching-right" ? null : (
          <button key={id} ref={(element) => { markerRefs.current[index] = element; }}
            className="scene-feature-control" type="button" aria-expanded={activeId === id}
            onFocus={() => { setFocusedId(id); setHoveredId(null); }}
            onBlur={() => setFocusedId(null)}
            onClick={() => { setFocusedId(null); setHoveredId(null); setSelectedId(previous => previous === id ? null : id); }}>
            {hotspotInfo[index].title}
          </button>
        ))}
      </div>
      <div ref={haloRef} className="cursor-halo" aria-hidden="true" />
    </>
  );
}
