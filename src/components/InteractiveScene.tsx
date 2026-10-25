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
        camera.position.z = 7;
        const sculpture = new THREE.Group();
        scene.add(sculpture);
        const geometry = new THREE.TorusKnotGeometry(1.05, 0.23, 180, 24, 2, 3);
        const material = new THREE.MeshPhysicalMaterial({
          color: 0x9868ff, metalness: 0.65, roughness: 0.24, clearcoat: 1,
        });
        const knot = new THREE.Mesh(geometry, material);
        sculpture.add(knot);
        const ringGeometry = new THREE.TorusGeometry(1.9, 0.012, 8, 160);
        const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xb6ff72, transparent: true, opacity: 0.65 });
        const rings = [new THREE.Mesh(ringGeometry, ringMaterial), new THREE.Mesh(ringGeometry, ringMaterial)];
        rings[0].rotation.x = 1.1;
        rings[1].rotation.y = 1.1;
        rings.forEach(ring => sculpture.add(ring));
        const positions = new Float32Array(240 * 3);
        for (let i = 0; i < positions.length; i++) positions[i] = (Math.random() - 0.5) * 10;
        const particlesGeometry = new THREE.BufferGeometry();
        particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const particlesMaterial = new THREE.PointsMaterial({ color: 0x8deaff, size: 0.025, transparent: true, opacity: 0.65 });
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles, new THREE.AmbientLight(0xa4b8ff, 2));
        const key = new THREE.PointLight(0xa8f5ff, 65);
        key.position.set(3, 3, 4);
        const rim = new THREE.PointLight(0xd0ff8a, 55);
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
          knot.rotation.y = elapsed * 0.24;
          knot.rotation.z = Math.sin(elapsed * 0.3) * 0.18;
          sculpture.rotation.y += (pointer.x * 0.45 - sculpture.rotation.y) * 0.06;
          sculpture.rotation.x += (pointer.y * 0.25 - sculpture.rotation.x) * 0.06;
          sculpture.position.y = Math.sin(elapsed * 0.65) * 0.13;
          rings[0].rotation.z = elapsed * 0.15;
          rings[1].rotation.z = -elapsed * 0.12;
          particles.rotation.y = elapsed * 0.025;
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
          geometry.dispose();
          material.dispose();
          ringGeometry.dispose();
          ringMaterial.dispose();
          particlesGeometry.dispose();
          particlesMaterial.dispose();
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
