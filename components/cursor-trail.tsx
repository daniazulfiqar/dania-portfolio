"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// how long (ms) a point survives in the trail before it's fully faded — short
// enough that the swoosh only appears while you're actively moving and
// dissolves almost instantly once you stop, rather than lingering behind.
const TRAIL_MS = 220;
const MAX_WIDTH = 16; // brush width at the freshest (head) point
const MIN_WIDTH = 1; // brush width right before a point fully fades
const INK_RGB = "124, 46, 57"; // --color-wax
const DOT_RADIUS = 13; // still-pointer smudge radius, in CSS px

type Point = { x: number; y: number; t: number };

// a canvas-drawn ink swoosh that trails the real cursor: a tapered brush
// stroke through recent pointer positions, thick and dark at the head,
// thinning and fading toward the tail. it only exists while you're moving —
// stop, and the last stroke dissolves within TRAIL_MS.
export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine || shouldReduceMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // hide the native cursor while the trail is active, so the swoosh reads
    // as the cursor rather than as a decoration trailing behind it. done via
    // a class (forcing cursor:none !important on every element in
    // globals.css) rather than an inline style on body, since an inherited
    // inline style loses to any descendant with its own explicit cursor
    // (links, buttons, etc.) and the native arrow would reappear over those.
    document.documentElement.classList.add("cursor-trail-active");

    const points: Point[] = [];
    // tracked separately from `points` (which ages out after TRAIL_MS) so
    // the persistent head dot has somewhere to sit even once the trail
    // itself has fully faded.
    let lastPos: { x: number; y: number } | null = null;

    // some elements (e.g. the snake game) supply their own cursor-tracking
    // visual and don't want this one competing with it. rather than
    // hit-testing event.target on every single pointermove (fragile once
    // canvases/absolute layers are involved), the element itself just
    // announces when the pointer enters/leaves it via this event, and we
    // keep a simple on/off flag — clearing the trail immediately on entry
    // so there's no lingering overlap.
    let suppressed = false;
    const handleSuppress = (event: Event) => {
      suppressed = (event as CustomEvent<boolean>).detail;
      if (suppressed) {
        points.length = 0;
        lastPos = null;
      }
    };
    window.addEventListener("cursor-trail:suppress", handleSuppress);

    const handleMove = (event: PointerEvent) => {
      if (suppressed) return;
      const point = { x: event.clientX, y: event.clientY, t: performance.now() };
      points.push(point);
      lastPos = point;
    };
    window.addEventListener("pointermove", handleMove);

    let raf = 0;
    const draw = () => {
      const now = performance.now();
      while (points.length && now - points[0].t > TRAIL_MS) points.shift();

      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const age = now - p1.t;
        const life = Math.max(0, 1 - age / TRAIL_MS); // 1 = brand new, 0 = gone
        if (life <= 0) continue;

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineCap = "round";
        ctx.lineWidth = MIN_WIDTH + (MAX_WIDTH - MIN_WIDTH) * life;
        ctx.strokeStyle = `rgba(${INK_RGB}, ${0.55 * life})`;
        ctx.stroke();
      }

      // a soft ink smudge that doesn't fade, marking exactly where the
      // pointer is right now — without it, stopping would leave no marker
      // at all once the swoosh trail dissolves, since the native cursor is
      // hidden. a radial gradient (dense core, soft falloff) reads as a
      // smudge rather than a hard dot, matching the trail's ink feel.
      if (lastPos) {
        const gradient = ctx.createRadialGradient(
          lastPos.x,
          lastPos.y,
          0,
          lastPos.x,
          lastPos.y,
          DOT_RADIUS,
        );
        gradient.addColorStop(0, `rgba(${INK_RGB}, 0.75)`);
        gradient.addColorStop(0.5, `rgba(${INK_RGB}, 0.4)`);
        gradient.addColorStop(1, `rgba(${INK_RGB}, 0)`);
        ctx.beginPath();
        ctx.arc(lastPos.x, lastPos.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("cursor-trail:suppress", handleSuppress);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("cursor-trail-active");
    };
  }, [shouldReduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[200] mix-blend-multiply"
    />
  );
}
