"use client";

import { Fragment, useEffect, useMemo, useRef } from "react";
import { createPortal, createRoot, events, extend, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useSpring } from "@react-spring/three";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EffectComposer, EffectPass, KawaseBlurPass, KernelSize, RenderPass, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import * as THREE from "three";

extend({ Group: THREE.Group });

export type FeatureId = "coaching" | "curriculum" | "scheduling" | "coaching-right" | "meetings" | "presentations" | "vocabulary" | "negotiation" | "career";
export type FeatureInfo = { title: string; description: string };
export type MeshTarget = {
  id: FeatureId;
  object: THREE.Group;
  anchor: [number, number, number];
  book?: { body: THREE.Group; leftCover: THREE.Group; rightCover: THREE.Group };
};
export type ExperienceProps = {
  activeId: FeatureId | null;
  info: Record<FeatureId, FeatureInfo>;
  kicker: string;
  closeLabel: string;
  ctaLabel: string;
  diagnosticLabel: string;
  direction: "rtl" | "ltr";
  onHover: (id: FeatureId | null) => void;
  onSelect: (id: FeatureId) => void;
  onDismiss: () => void;
  onEnquire: (id: FeatureId) => void;
};

function InteractiveObject({ target, ...props }: ExperienceProps & { target: MeshTarget }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const active = props.activeId === target.id;
  const reducedMotion = useReducedMotion();
  const reveal = useRef(0);
  const orientation = useMemo(() => ({
    parent: new THREE.Quaternion(), facing: new THREE.Quaternion(), rest: new THREE.Quaternion(),
    pages: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI),
  }), []);
  useFrame(({ camera }) => {
    if (!target.book) return;
    target.object.getWorldQuaternion(orientation.parent);
    camera.getWorldQuaternion(orientation.facing);
    orientation.facing.multiply(orientation.pages);
    orientation.facing.premultiply(orientation.parent.invert());
    target.book.body.quaternion.slerpQuaternions(
      orientation.rest, orientation.facing, THREE.MathUtils.smoothstep(reveal.current, 0.5, 0.8),
    );
  });
  useSpring({
    scale: active ? (target.book ? 1.35 : 1.15) : 1,
    reveal: active ? 1 : 0,
    config: { duration: target.book ? 850 : 500 },
    onChange: ({ value }: { value: { scale: number; reveal: number } }) => {
      target.object.scale.setScalar(value.scale);
      reveal.current = value.reveal;
      if (target.book) {
        const { body, leftCover, rightCover } = target.book;
        const opening = THREE.MathUtils.smoothstep(value.reveal, 0.8, 1);
        const travel = THREE.MathUtils.smoothstep(value.reveal, 0, 0.5);
        body.position.set(0, travel * 0.08, travel * 1.05);
        leftCover.rotation.set(0, opening * 1.35, 0);
        rightCover.rotation.set(0, -opening * 1.35, 0);
      }
    },
  });
  const { size, gl } = useThree();
  const portal = useMemo(() => {
    const parent = gl.domElement.parentElement;
    if (!parent) throw new Error("NEXUS: The scene canvas must be mounted before attaching information cards.");
    return { current: parent };
  }, [gl]);
  const projection = useMemo(() => new THREE.Vector3(), []);
  const bounds = useMemo(() => new THREE.Box3(), []);
  function hover(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    if (event.pointerType !== "touch") props.onHover(target.id);
  }
  return (
    <primitive
      object={target.object}
      onPointerOver={hover}
      onPointerOut={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        props.onHover(null);
      }}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        props.onSelect(target.id);
      }}
    >
        <Html
          portal={portal}
          wrapperClass="scene-html-anchor"
          style={{ direction: "ltr" }}
          center
          position={target.anchor}
          zIndexRange={[8, 4]}
          calculatePosition={(object, camera, viewport) => {
            projection.setFromMatrixPosition(object.matrixWorld).project(camera);
            const halfWidth = Math.min(160, (viewport.width - 24) / 2);
            const halfHeight = (cardRef.current?.offsetHeight ?? 260) / 2;
            const x = (projection.x + 1) * viewport.width / 2;
            const y = (1 - projection.y) * viewport.height / 2;
            bounds.setFromObject(target.object);
            let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
            for (const px of [bounds.min.x, bounds.max.x]) {
              for (const py of [bounds.min.y, bounds.max.y]) {
                for (const pz of [bounds.min.z, bounds.max.z]) {
                  projection.set(px, py, pz).project(camera);
                  const sx = (projection.x + 1) * viewport.width / 2;
                  const sy = (1 - projection.y) * viewport.height / 2;
                  left = Math.min(left, sx); right = Math.max(right, sx);
                  top = Math.min(top, sy); bottom = Math.max(bottom, sy);
                }
              }
            }
            const sides = [[left - halfWidth - 24, y], [right + halfWidth + 24, y]];
            if (x >= viewport.width / 2) sides.reverse();
            const vertical = [[x, bottom + halfHeight + 24], [x, top - halfHeight - 24]];
            const candidates = viewport.width > 760 ? [...sides, ...vertical] : [...vertical, ...sides];
            const clamped = candidates.map(([cx, cy]) => [
              THREE.MathUtils.clamp(cx, halfWidth + 12, viewport.width - halfWidth - 12),
              THREE.MathUtils.clamp(cy, halfHeight + 12, viewport.height - halfHeight - 12),
            ]);
            return clamped.reduce((best, candidate) => {
              const overlap = ([cx, cy]: number[]) =>
                Math.max(0, Math.min(cx + halfWidth, right) - Math.max(cx - halfWidth, left)) *
                Math.max(0, Math.min(cy + halfHeight, bottom) - Math.max(cy - halfHeight, top));
              return overlap(candidate) < overlap(best) ? candidate : best;
            });
          }}
        >
          <AnimatePresence>
          {active && <motion.div
            key={target.id}
            ref={cardRef}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0, pointerEvents: "auto" }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : 8, pointerEvents: "none" }}
            transition={{ duration: reducedMotion ? 0 : 0.65, ease: "easeOut" }}
            onAnimationStart={(animation) => {
              if (cardRef.current && typeof animation === "object" && !Array.isArray(animation)) {
                cardRef.current.inert = animation.opacity === 0;
              }
            }}
            className="scene-information mesh-information rounded-2xl border border-white/30 p-5 shadow-xl backdrop-blur-xl"
            style={{ width: Math.min(320, size.width - 24), maxHeight: Math.min(320, size.height - 24) }}
            role="region"
            dir={props.direction}
            aria-label={props.info[target.id].title}
            onPointerEnter={() => props.onHover(target.id)}
            onPointerLeave={() => props.onHover(null)}
            onFocusCapture={() => props.onHover(target.id)}
            onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) props.onHover(null); }}
            onKeyDown={(event) => { if (event.key === "Escape") props.onDismiss(); }}
          >
            <button className="scene-information-close" aria-label={props.closeLabel} onClick={props.onDismiss}>×</button>
            <p className="scene-information-kicker">{props.kicker}</p>
            <h2>{props.info[target.id].title}</h2>
            <p>{props.info[target.id].description}</p>
            <p className="scene-diagnostic-note">{props.diagnosticLabel}</p>
            <button className="scene-information-cta" onClick={() => props.onEnquire(target.id)}>
              {props.ctaLabel}<span aria-hidden="true">↗</span>
            </button>
          </motion.div>}
          </AnimatePresence>
        </Html>
    </primitive>
  );
}

function SelectiveBlur({ targets, activeId, onReady }: { targets: MeshTarget[]; activeId: FeatureId | null; onReady: () => void }) {
  const ready = useRef(false);
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const result = new EffectComposer(gl, { frameBufferType: THREE.HalfFloatType });
    result.addPass(new RenderPass(scene, camera));
    result.addPass(new EffectPass(camera, new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })));
    // Tone-map highlights before spreading pixels so HDR lights cannot bloom through blur.
    result.addPass(new KawaseBlurPass({ kernelSize: KernelSize.SMALL }));
    return result;
  }, [gl, scene, camera]);
  useEffect(() => { composer.setSize(size.width, size.height); }, [composer, size]);
  useEffect(() => () => composer.dispose(), [composer]);
  useFrame(({ gl: renderer, camera: view }, delta) => {
    const selected = targets.find(target => target.id === activeId)?.object;
    if (!selected) {
      renderer.render(scene, view);
      if (!ready.current) { ready.current = true; onReady(); }
      return;
    }
    // Exclude the entire selection from the blur input to avoid a blurred duplicate
    // bleeding around its edges, then render all its parts together in sharp focus.
    const selection: { object: THREE.Object3D; mask: number }[] = [];
    selected.traverse(object => {
      selection.push({ object, mask: object.layers.mask });
      object.layers.set(1);
    });
    scene.traverse(object => { if (object instanceof THREE.Light) object.layers.enable(1); });
    composer.render(delta);
    const autoClear = renderer.autoClear;
    const mask = view.layers.mask;
    renderer.autoClear = false;
    renderer.clearDepth();
    view.layers.set(1);
    renderer.render(scene, view);
    view.layers.mask = mask;
    renderer.autoClear = autoClear;
    selection.forEach(({ object, mask: originalMask }) => { object.layers.mask = originalMask; });
  }, 1);
  return null;
}

function RoomContents({ workspace, targets, onReady, ...props }: ExperienceProps & { workspace: THREE.Group; targets: MeshTarget[]; onReady: () => void }) {
  const parents = useMemo(() => targets.map(target => {
    if (!target.object.parent) throw new Error("NEXUS: Interactive objects must belong to the room.");
    return target.object.parent;
  }), [targets]);
  return (
    <>
      <primitive object={workspace} dispose={null} />
      {targets.map((target, index) => (
        <Fragment key={target.object.uuid}>
          {createPortal(<InteractiveObject target={target} {...props} />, parents[index])}
        </Fragment>
      ))}
      <SelectiveBlur targets={targets} activeId={props.activeId} onReady={onReady} />
    </>
  );
}

export async function createMeshExperience(
  canvas: HTMLCanvasElement,
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  workspace: THREE.Group,
  targets: MeshTarget[],
  onReady: () => void,
) {
  const root = createRoot(canvas);
  try {
    await root.configure({
      gl: renderer, scene, camera, events, frameloop: "never", dpr: renderer.getPixelRatio(),
      shadows: "soft",
      size: { width: canvas.clientWidth || 1, height: canvas.clientHeight || 1, top: 0, left: 0 },
    });
  } catch (error) {
    root.unmount();
    throw error;
  }
  const store = root.render(null);
  return {
    update(props: ExperienceProps) { root.render(<RoomContents workspace={workspace} targets={targets} onReady={onReady} {...props} />); },
    advance(time: number) { store.getState().advance(time); },
    resize(width: number, height: number) { store.getState().setSize(width, height); },
    dispose() { root.unmount(); },
  };
}

export type MeshExperience = Awaited<ReturnType<typeof createMeshExperience>>;
