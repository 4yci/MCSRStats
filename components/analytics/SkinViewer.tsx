"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Minecraft skin viewer. On capable devices it renders a self-contained
 * CSS-3D model (no three.js) the user can drag to rotate. On low-end / mobile
 * devices — where stacking dozens of 3D-transformed layers can drop frames —
 * it falls back to an equivalent 2D <canvas> renderer that composites the same
 * skin faces orthographically and rotates through four cardinal views on drag.
 */

const SKIN_URL = (uuid: string) => `https://mc-heads.net/skin/${uuid}`;
const SCALE = 4; // px per skin texel

type Face = "front" | "back" | "right" | "left" | "top" | "bottom";

/* ════════════════════════ shared skin loader ═════════════════════ */

type LoadState = "loading" | "ok" | "error";

function useSkin(uuid: string) {
  const [status, setStatus] = useState<LoadState>("loading");
  const [legacy, setLegacy] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setStatus("loading");
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setLegacy(img.naturalHeight === 32);
      setStatus("ok");
    };
    img.onerror = () => setStatus("error");
    img.src = SKIN_URL(uuid);
  }, [uuid]);

  return { status, legacy, img: imgRef };
}

/* ════════════════════════ device heuristic ══════════════════════ */

/** True on devices that should use the lighter 2D canvas renderer. */
function useLiteRenderer(): boolean {
  const [lite, setLite] = useState(false);
  useEffect(() => {
    // Manual overrides for testing: ?skin2d / ?skin3d
    const q = window.location.search;
    if (q.includes("skin2d")) return setLite(true);
    if (q.includes("skin3d")) return setLite(false);

    const mq = (s: string) => window.matchMedia(s).matches;
    const coarse = mq("(pointer: coarse)");
    const reduced = mq("(prefers-reduced-motion: reduce)");
    const tiny = mq("(max-width: 560px)");
    const fewCores =
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency <= 4;
    const lowMem =
      typeof (navigator as { deviceMemory?: number }).deviceMemory === "number" &&
      (navigator as { deviceMemory?: number }).deviceMemory! <= 4;

    setLite(reduced || (coarse && (fewCores || lowMem || tiny)));
  }, []);
  return lite;
}

/* ════════════════════════ CSS-3D renderer ═══════════════════════ */

interface Part {
  w: number;
  h: number;
  d: number;
  cx: number;
  cy: number;
  cz: number;
  uv: Record<Face, [number, number]>;
}

const PARTS_MODERN: Record<string, Part> = {
  head: { w: 8, h: 8, d: 8, cx: 0, cy: -12, cz: 0, uv: { top: [8, 0], bottom: [16, 0], right: [0, 8], front: [8, 8], left: [16, 8], back: [24, 8] } },
  body: { w: 8, h: 12, d: 4, cx: 0, cy: -2, cz: 0, uv: { top: [20, 16], bottom: [28, 16], right: [16, 20], front: [20, 20], left: [28, 20], back: [32, 20] } },
  rightArm: { w: 4, h: 12, d: 4, cx: -6, cy: -2, cz: 0, uv: { top: [44, 16], bottom: [48, 16], right: [40, 20], front: [44, 20], left: [48, 20], back: [52, 20] } },
  leftArm: { w: 4, h: 12, d: 4, cx: 6, cy: -2, cz: 0, uv: { top: [36, 48], bottom: [40, 48], right: [32, 52], front: [36, 52], left: [40, 52], back: [44, 52] } },
  rightLeg: { w: 4, h: 12, d: 4, cx: -2, cy: 10, cz: 0, uv: { top: [4, 16], bottom: [8, 16], right: [0, 20], front: [4, 20], left: [8, 20], back: [12, 20] } },
  leftLeg: { w: 4, h: 12, d: 4, cx: 2, cy: 10, cz: 0, uv: { top: [20, 48], bottom: [24, 48], right: [16, 52], front: [20, 52], left: [24, 52], back: [28, 52] } },
};
const PARTS_LEGACY: Record<string, Part> = {
  ...PARTS_MODERN,
  leftArm: { ...PARTS_MODERN.rightArm, cx: 6 },
  leftLeg: { ...PARTS_MODERN.rightLeg, cx: 2 },
};

const FACES: Face[] = ["front", "back", "right", "left", "top", "bottom"];

function faceEl(face: Face, part: Part, skinUrl: string): JSX.Element {
  const [u, v] = part.uv[face];
  const [fw, fh] =
    face === "top" || face === "bottom"
      ? [part.w, part.d]
      : face === "left" || face === "right"
        ? [part.d, part.h]
        : [part.w, part.h];
  const halfW = (part.w * SCALE) / 2;
  const halfH = (part.h * SCALE) / 2;
  const halfD = (part.d * SCALE) / 2;
  const transform: Record<Face, string> = {
    front: `translate(-50%,-50%) rotateY(0deg) translateZ(${halfD}px)`,
    back: `translate(-50%,-50%) rotateY(180deg) translateZ(${halfD}px)`,
    right: `translate(-50%,-50%) rotateY(90deg) translateZ(${halfW}px)`,
    left: `translate(-50%,-50%) rotateY(-90deg) translateZ(${halfW}px)`,
    top: `translate(-50%,-50%) rotateX(90deg) translateZ(${halfH}px)`,
    bottom: `translate(-50%,-50%) rotateX(-90deg) translateZ(${halfH}px)`,
  };
  return (
    <div
      key={face}
      style={{
        position: "absolute", left: "50%", top: "50%",
        width: fw * SCALE, height: fh * SCALE, transform: transform[face],
        backgroundImage: `url(${skinUrl})`,
        backgroundSize: `${64 * SCALE}px ${64 * SCALE}px`,
        backgroundPosition: `-${u * SCALE}px -${v * SCALE}px`,
        imageRendering: "pixelated", backfaceVisibility: "hidden",
      }}
    />
  );
}

function PartBox({ part, skinUrl }: { part: Part; skinUrl: string }) {
  return (
    <div style={{ position: "absolute", left: "50%", top: "50%", transformStyle: "preserve-3d", transform: `translate3d(${part.cx * SCALE}px, ${part.cy * SCALE}px, ${part.cz * SCALE}px)` }}>
      {FACES.map((f) => faceEl(f, part, skinUrl))}
    </div>
  );
}

function Skin3D({ uuid }: { uuid: string }) {
  const { status, legacy } = useSkin(uuid);
  const [angle, setAngle] = useState(-24);
  const drag = useRef<{ startX: number; startAngle: number } | null>(null);
  const skinUrl = SKIN_URL(uuid);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { startX: e.clientX, startAngle: angle };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setAngle(drag.current.startAngle + (e.clientX - drag.current.startX) * 0.6);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    drag.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const parts = legacy ? PARTS_LEGACY : PARTS_MODERN;
  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      title="Drag to rotate"
      className="relative shrink-0 cursor-ew-resize select-none touch-none"
      style={{ width: 96, height: 150, perspective: 600 }}
    >
      <div className="absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-accent-teal/20 blur-md" style={{ bottom: 6, width: 70, height: 14 }} />
      <div style={{ position: "absolute", left: "50%", top: "52%", transformStyle: "preserve-3d", transform: `rotateX(-8deg) rotateY(${angle}deg)`, transition: drag.current ? "none" : "transform 0.15s ease-out" }}>
        {status === "ok" && Object.entries(parts).map(([name, part]) => <PartBox key={name} part={part} skinUrl={skinUrl} />)}
      </div>
    </div>
  );
}

/* ════════════════════════ 2D canvas renderer ════════════════════ */

type CView = "front" | "right" | "back" | "left";
type CFace = "front" | "back" | "right" | "left";

// UV (top-left texel) per part per visible face.
const CUV: Record<string, Record<CFace, [number, number]>> = {
  head: { front: [8, 8], back: [24, 8], right: [0, 8], left: [16, 8] },
  body: { front: [20, 20], back: [32, 20], right: [16, 20], left: [28, 20] },
  rightArm: { front: [44, 20], back: [52, 20], right: [40, 20], left: [48, 20] },
  leftArm: { front: [36, 52], back: [44, 52], right: [32, 52], left: [40, 52] },
  rightLeg: { front: [4, 20], back: [12, 20], right: [0, 20], left: [8, 20] },
  leftLeg: { front: [20, 52], back: [28, 52], right: [16, 52], left: [24, 52] },
};

interface Piece { part: string; face: CFace; dx: number; dy: number; w: number; h: number }

// Orthographic composition per cardinal view (texel coordinates, figure 16×32).
const VIEWS: Record<CView, { width: number; pieces: Piece[] }> = {
  front: {
    width: 16,
    pieces: [
      { part: "head", face: "front", dx: 4, dy: 0, w: 8, h: 8 },
      { part: "rightArm", face: "front", dx: 0, dy: 8, w: 4, h: 12 },
      { part: "body", face: "front", dx: 4, dy: 8, w: 8, h: 12 },
      { part: "leftArm", face: "front", dx: 12, dy: 8, w: 4, h: 12 },
      { part: "rightLeg", face: "front", dx: 4, dy: 20, w: 4, h: 12 },
      { part: "leftLeg", face: "front", dx: 8, dy: 20, w: 4, h: 12 },
    ],
  },
  back: {
    width: 16,
    pieces: [
      { part: "head", face: "back", dx: 4, dy: 0, w: 8, h: 8 },
      { part: "leftArm", face: "back", dx: 0, dy: 8, w: 4, h: 12 },
      { part: "body", face: "back", dx: 4, dy: 8, w: 8, h: 12 },
      { part: "rightArm", face: "back", dx: 12, dy: 8, w: 4, h: 12 },
      { part: "leftLeg", face: "back", dx: 4, dy: 20, w: 4, h: 12 },
      { part: "rightLeg", face: "back", dx: 8, dy: 20, w: 4, h: 12 },
    ],
  },
  right: {
    width: 8,
    pieces: [
      { part: "head", face: "right", dx: 0, dy: 0, w: 8, h: 8 },
      { part: "body", face: "right", dx: 2, dy: 8, w: 4, h: 12 },
      { part: "rightLeg", face: "right", dx: 2, dy: 20, w: 4, h: 12 },
      { part: "rightArm", face: "right", dx: 2, dy: 8, w: 4, h: 12 },
    ],
  },
  left: {
    width: 8,
    pieces: [
      { part: "head", face: "left", dx: 0, dy: 0, w: 8, h: 8 },
      { part: "body", face: "left", dx: 2, dy: 8, w: 4, h: 12 },
      { part: "leftLeg", face: "left", dx: 2, dy: 20, w: 4, h: 12 },
      { part: "leftArm", face: "left", dx: 2, dy: 8, w: 4, h: 12 },
    ],
  },
};

const CVIEW_ORDER: CView[] = ["front", "right", "back", "left"];

function SkinCanvas({ uuid }: { uuid: string }) {
  const { status, legacy, img } = useSkin(uuid);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [angle, setAngle] = useState(0);
  const drag = useRef<{ startX: number; startAngle: number } | null>(null);

  const viewIndex = ((Math.round(angle / 90) % 4) + 4) % 4;
  const view = CVIEW_ORDER[viewIndex];

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = img.current;
    if (!canvas || status !== "ok" || !image) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const CW = 96;
    const CH = 150;
    canvas.width = CW * dpr;
    canvas.height = CH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, CW, CH);
    ctx.imageSmoothingEnabled = false;

    const v = VIEWS[view];
    const offX = (CW - v.width * SCALE) / 2;
    const offY = (CH - 32 * SCALE) / 2;

    for (const p of v.pieces) {
      const part = legacy && p.part === "leftArm" ? "rightArm" : legacy && p.part === "leftLeg" ? "rightLeg" : p.part;
      const [u, uy] = CUV[part][p.face];
      ctx.drawImage(
        image,
        u, uy, p.w, p.h,
        offX + p.dx * SCALE, offY + p.dy * SCALE, p.w * SCALE, p.h * SCALE,
      );
    }
  }, [status, legacy, view, img]);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { startX: e.clientX, startAngle: angle };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setAngle(drag.current.startAngle + (e.clientX - drag.current.startX) * 0.8);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    drag.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      title="Drag to rotate"
      className="relative shrink-0 cursor-ew-resize select-none touch-none"
      style={{ width: 96, height: 150 }}
    >
      <div className="absolute left-1/2 -translate-x-1/2 rounded-[50%] bg-accent-teal/20 blur-md" style={{ bottom: 6, width: 70, height: 14 }} />
      <canvas ref={canvasRef} style={{ width: 96, height: 150 }} />
    </div>
  );
}

/* ════════════════════════ picker ════════════════════════════════ */

export default function SkinViewer({
  uuid,
  fallback,
}: {
  uuid: string;
  fallback: React.ReactNode;
}) {
  const lite = useLiteRenderer();
  const { status } = useSkin(uuid);

  if (status === "error") return <>{fallback}</>;
  return lite ? <SkinCanvas uuid={uuid} /> : <Skin3D uuid={uuid} />;
}
