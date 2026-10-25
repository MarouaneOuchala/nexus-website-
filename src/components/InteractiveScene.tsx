"use client";

import { useEffect, useRef } from "react";

export default function InteractiveScene() {
  const haloRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = document.querySelector<HTMLElement>(".scene-mount");
    const halo = haloRef.current;
    if (!mount || !halo) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let cancelled = false;
    let disposeScene: (() => void) | undefined;
    let hovered: HTMLElement | null = null;
    const pointer = { x: 0, y: 0 };

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
        ? event.target.closest<HTMLElement>(".program-item, .executive-brief, .button, .getting-started-step")
        : null;
      if (target !== hovered) resetHover();
      hovered = target;
      halo!.dataset.interactive = String(!!target);
      if (!target) return;
      const bounds = target.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      target.style.setProperty("--pointer-x", `${x * 100}%`);
      target.style.setProperty("--pointer-y", `${y * 100}%`);
      target.style.setProperty("--tilt-x", `${(0.5 - y) * 6}deg`);
      target.style.setProperty("--tilt-y", `${(x - 0.5) * 6}deg`);
      target.dataset.pointer = "true";
    }

    async function startScene() {
      if (reducedMotion.matches || cancelled || disposeScene) return;
      try {
        const THREE = await import("three");
        if (cancelled || reducedMotion.matches || disposeScene) return;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("webgl2", { alpha: true, antialias: true });
        if (!context) {
          mount!.dataset.renderer = "fallback";
          console.warn("NEXUS: WebGL2 is unavailable; displaying the static scene.");
          return;
        }
        const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
        camera.position.set(0, 3.5, 8.8);
        camera.lookAt(0, 0.3, 0);
        const workspace = new THREE.Group();
        scene.add(workspace);
        const geometries: InstanceType<typeof THREE.BufferGeometry>[] = [];
        const materials: InstanceType<typeof THREE.Material>[] = [];
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
        function box(parent: InstanceType<typeof THREE.Group>, size: [number, number, number], position: [number, number, number], surface: InstanceType<typeof THREE.Material>) {
          const geometry = new THREE.BoxGeometry(...size);
          geometries.push(geometry);
          const mesh = new THREE.Mesh(geometry, surface);
          mesh.position.set(...position);
          parent.add(mesh);
          return mesh;
        }
        box(workspace, [4.8, 0.12, 3.6], [0, -0.85, 0], dark);
        const wall = material(0xe9bea9);
        const curtainMaterial = material(0xb6636c);
        box(workspace, [5.2, 3.5, 0.12], [0, 0.8, -1.7], wall);
        box(workspace, [5.3, 0.15, 0.24], [0, 2.58, -1.6], lime);
        for (const x of [-2.2, 2.2]) {
          box(workspace, [0.65, 2.9, 0.12], [x, 0.95, -1.55], screen);
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
        presentation.position.set(0, 0.85, -1.4);
        workspace.add(presentation);
        box(presentation, [3.3, 1.9, 0.13], [0, 0, 0], violet);
        box(presentation, [3.1, 1.7, 0.04], [0, 0, 0.09], screen);
        box(presentation, [1.15, 0.06, 0.03], [-0.7, 0.56, 0.13], paper);
        box(presentation, [0.7, 0.035, 0.03], [-0.92, 0.38, 0.13], blue);
        box(presentation, [0.06, 0.65, 0.1], [0, -1.2, 0], dark);
        const clockFaceGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.05, 32);
        geometries.push(clockFaceGeometry);
        const clockFace = new THREE.Mesh(clockFaceGeometry, paper);
        clockFace.rotation.x = Math.PI / 2;
        clockFace.position.set(0, 2.13, -1.52);
        workspace.add(clockFace);
        const clockHand = new THREE.Group();
        clockHand.position.set(0, 2.13, -1.47);
        workspace.add(clockHand);
        box(clockHand, [0.018, 0.17, 0.018], [0, 0.065, 0], dark);
        box(workspace, [0.12, 0.018, 0.018], [0.05, 2.13, -1.46], dark);
        const chart = [0.38, 0.62, 0.85, 1.05].map((height, index) => {
          const bar = box(presentation, [0.3, height, 0.04], [-0.85 + index * 0.55, -0.65 + height / 2, 0.14], index === 3 ? lime : blue);
          return { bar, height };
        });
        const laptops: InstanceType<typeof THREE.Group>[] = [];
        for (const x of [-1.05, 1.05]) {
          const laptop = new THREE.Group();
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
        notebook.position.set(0, 0.06, 0.65);
        notebook.rotation.y = -0.12;
        workspace.add(notebook);
        box(notebook, [0.55, 0.045, 0.65], [0, 0, 0], paper);
        box(notebook, [0.025, 0.015, 0.65], [-0.18, 0.03, 0], violet);
        for (let row = 0; row < 4; row++) {
          box(notebook, [0.28, 0.01, 0.016], [0.03, 0.03, -0.18 + row * 0.1], dark);
        }
        const notes = new THREE.Group();
        notes.position.set(-2.05, 1.15, -0.15);
        notes.rotation.set(0, 0.2, -0.12);
        workspace.add(notes);
        box(notes, [0.65, 0.8, 0.04], [0, 0, 0], paper);
        for (let row = 0; row < 4; row++) {
          box(notes, [0.36, 0.025, 0.02], [0, 0.22 - row * 0.14, 0.04], row === 0 ? violet : dark);
        }
        scene.add(new THREE.AmbientLight(0xffefd7, 2.4));
        const key = new THREE.PointLight(0xffedd0, 45);
        key.position.set(3, 3, 4);
        const rim = new THREE.PointLight(0xffd6c2, 25);
        rim.position.set(-3, -1, 2);
        scene.add(key, rim);
        let visible = false;
        let frame = 0;
        let previousTime = 0;
        let elapsed = 0;
        function render(time: number) {
          frame = 0;
          const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
          previousTime = time;
          elapsed += delta;
          workspace.rotation.y += (pointer.x * 0.12 - workspace.rotation.y) * 0.06;
          workspace.rotation.x += (pointer.y * 0.06 - workspace.rotation.x) * 0.06;
          const theatreTime = Math.floor(elapsed * 12) / 12;
          notes.position.y = 1.15 + Math.sin(theatreTime * 1.2) * 0.07;
          notes.rotation.z = -0.12 + Math.sin(theatreTime * 0.7) * 0.025;
          curtains.forEach((curtain, index) => { curtain.rotation.y = Math.sin(theatreTime * 0.65) * (index ? -0.06 : 0.06); });
          clockHand.rotation.z = -Math.floor(elapsed) * Math.PI / 30;
          laptops.forEach((lid, index) => { lid.rotation.x = -0.15 + Math.sin(elapsed * 0.6 + index) * 0.06; });
          chart.forEach(({ bar, height }, index) => {
            const scale = 0.65 + Math.sin(elapsed * 1.1 + index * 0.55) * 0.2;
            bar.scale.y = scale;
            bar.position.y = -0.65 + height * scale / 2;
          });
          key.position.x = 3 + pointer.x * 2;
          renderer.render(scene, camera);
          frame = requestAnimationFrame(render);
        }
        function syncPlayback() {
          if (visible && !document.hidden && !reducedMotion.matches) {
            if (!frame) { previousTime = 0; frame = requestAnimationFrame(render); }
          } else {
            cancelAnimationFrame(frame);
            frame = 0;
          }
        }
        const resize = new ResizeObserver(() => {
          const { width, height } = mount!.getBoundingClientRect();
          if (!width || !height) return;
          renderer.setSize(width, height);
          camera.aspect = width / height;
          camera.position.set(0, 3.5, 8.8).multiplyScalar(camera.aspect < 1.25 ? 1.22 : 1);
          camera.lookAt(0, 0.3, 0);
          camera.updateProjectionMatrix();
          renderer.render(scene, camera);
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
          console.warn("NEXUS: WebGL context lost; displaying the static scene.");
        }
        disposeScene = () => {
          cancelAnimationFrame(frame);
          resize.disconnect();
          observer.disconnect();
          document.removeEventListener("visibilitychange", syncPlayback);
          canvas.removeEventListener("webglcontextlost", onContextLost);
          geometries.forEach(geometry => geometry.dispose());
          materials.forEach(surface => surface.dispose());
          renderer.dispose();
          canvas.remove();
          mount!.dataset.renderer = "fallback";
        };
        canvas.addEventListener("webglcontextlost", onContextLost);
        document.addEventListener("visibilitychange", syncPlayback);
        mount!.appendChild(canvas);
        mount!.dataset.renderer = "webgl";
        resize.observe(mount!);
        observer.observe(mount!);
      } catch (error) {
        disposeScene?.();
        disposeScene = undefined;
        console.warn("NEXUS: Unable to initialize the 3D scene; displaying the static scene.", error);
        mount!.dataset.renderer = "fallback";
      }
    }

    function onMotionChange() {
      resetPointer();
      if (reducedMotion.matches) {
        disposeScene?.();
        disposeScene = undefined;
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
      resetPointer();
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", resetPointer);
      window.removeEventListener("blur", resetPointer);
      reducedMotion.removeEventListener("change", onMotionChange);
      finePointer.removeEventListener("change", resetPointer);
    };
  }, []);

  return <div ref={haloRef} className="cursor-halo" aria-hidden="true" />;
}
