"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

// classic grid-based Nokia snake: arrow keys, fixed tick, blocky segments on
// a visible grid. no cursor-following, no free movement — the snake advances
// exactly one grid cell per tick, in whichever direction was last queued by
// a keypress, wrapping around the edges. running into your own tail ends the
// run; eating a food block grows the snake by one segment.
//
// the game area is drawn in the site's own paper/wax/ochre palette rather
// than an invented high-contrast device palette, so it reads as part of the
// same desk/paper world as the note and folder, not a gadget dropped on top.

const GRID_COLS = 24;
const GRID_ROWS = 14;
// touch input (swipe, detected after a gesture completes) lags a beat behind
// a keypress, so touch devices get a slightly slower tick to compensate.
const TICK_MS_DESKTOP = 110;
const TICK_MS_TOUCH = 145;
// the tick speeds up a little with every food eaten, floored so it never
// becomes unplayable (touch keeps a slightly more generous floor, same
// reasoning as its slower base speed).
const MIN_TICK_MS_DESKTOP = 65;
const MIN_TICK_MS_TOUCH = 95;
const SPEED_STEP_MS = 3;
const INITIAL_LENGTH = 4;
const SWIPE_THRESHOLD_PX = 24;

const BOARD_BG = "#f4efe4"; // --color-paper
// food matches the site-wide cursor ink exactly (--color-wax); the snake is
// a slightly darker, muted variant so the two read as related but distinct.
const FOOD_RGB = "124, 46, 57"; // --color-wax, same as the cursor trail's ink
const SNAKE_RGB = "90, 34, 42"; // darker wax

type Cell = { x: number; y: number };
type Direction = { x: number; y: number };

const DIRECTIONS: Record<string, Direction> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

function isOpposite(a: Direction, b: Direction) {
  return a.x === -b.x && a.y === -b.y;
}

function randomFoodCell(snake: Cell[]): Cell {
  for (let attempt = 0; attempt < 200; attempt++) {
    const cell = {
      x: Math.floor(Math.random() * GRID_COLS),
      y: Math.floor(Math.random() * GRID_ROWS),
    };
    if (!snake.some((seg) => seg.x === cell.x && seg.y === cell.y)) return cell;
  }
  return { x: 0, y: 0 };
}

function initialSnake(): Cell[] {
  const y = Math.floor(GRID_ROWS / 2);
  const startX = Math.floor(GRID_COLS / 2);
  return Array.from({ length: INITIAL_LENGTH }, (_, i) => ({ x: startX - i, y }));
}

function readStoredHighScore(): number {
  if (typeof window === "undefined") return 0;
  const stored = Number(localStorage.getItem("snake-high-score"));
  return Number.isFinite(stored) && stored > 0 ? stored : 0;
}

type Phase = "intro" | "playing" | "gameover";

// shared styling for the start/restart button, so both read as the same
// control rather than two different-looking buttons — styled like a small
// handwritten note/card rather than a default UI button, to match the rest
// of the page's handmade feel.
function GameButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[0.4rem] border border-ink/20 bg-paper px-4 py-1.5 font-display text-sm italic text-ink shadow-[0_2px_6px_rgba(44,38,32,0.12)] transition-colors hover:bg-ink/5 sm:px-5 sm:py-2 sm:text-base"
    >
      {children}
    </button>
  );
}

// a real capability check (does this hardware have a touchscreen) rather
// than a viewport-width guess, so a touch laptop with a desktop-sized screen
// still gets swipe instructions instead of arrow-key ones.
function detectTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

export function SnakeFold() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { margin: "-20% 0px" });
  const [isTouchDevice] = useState(detectTouchDevice);

  const screenRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cellSize = useRef(0);

  const snake = useRef<Cell[]>(initialSnake());
  const direction = useRef<Direction>({ x: 1, y: 0 });
  const queuedDirection = useRef<Direction>({ x: 1, y: 0 });
  const food = useRef<Cell>(randomFoodCell(initialSnake()));
  const accumulatedMs = useRef(0);
  const lastFrameTime = useRef(0);
  const rafId = useRef(0);
  // current tick interval — starts at the device's base speed and ticks down
  // (with a floor) as food is eaten, so the run gets faster as it goes.
  const tickMsRef = useRef(TICK_MS_DESKTOP);
  // last grid cell the real cursor was over, so a fresh game's food can
  // start out exactly where the cursor was instead of somewhere random.
  const cursorCell = useRef<Cell | null>(null);

  const [phase, setPhase] = useState<Phase>("intro");
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  // any previous best from this browser — kept in both a ref (for the
  // imperative game loop) and state (for display). state starts at 0 so the
  // first client render matches the server (which has no localStorage), then
  // the stored value loads in after mount — avoids a hydration mismatch.
  const highScoreRef = useRef(readStoredHighScore());
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    setHighScore(readStoredHighScore());
  }, []);

  const startGame = useCallback(() => {
    snake.current = initialSnake();
    direction.current = { x: 1, y: 0 };
    queuedDirection.current = { x: 1, y: 0 };
    const cursor = cursorCell.current;
    const cursorIsFree =
      cursor && !snake.current.some((seg) => seg.x === cursor.x && seg.y === cursor.y);
    food.current = cursorIsFree ? cursor! : randomFoodCell(snake.current);
    accumulatedMs.current = 0;
    tickMsRef.current = isTouchDevice ? TICK_MS_TOUCH : TICK_MS_DESKTOP;
    scoreRef.current = 0;
    setScore(0);
    setPhase("playing");
  }, [isTouchDevice]);

  // track the cursor's grid cell while it's over the board, so startGame
  // can drop the first food exactly where the cursor last was.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const screen = screenRef.current;
      if (!screen || !cellSize.current) return;
      const rect = screen.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      if (relX < 0 || relY < 0 || relX >= rect.width || relY >= rect.height) return;
      cursorCell.current = {
        x: Math.min(Math.floor(relX / cellSize.current), GRID_COLS - 1),
        y: Math.min(Math.floor(relY / cellSize.current), GRID_ROWS - 1),
      };
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // the real cursor (and its ink trail) has no role once arrow keys take
  // over, so it's suppressed site-wide for the duration of play and
  // restored as soon as the run ends.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("cursor-trail:suppress", { detail: phase === "playing" }));
    return () => {
      if (phase === "playing") {
        window.dispatchEvent(new CustomEvent("cursor-trail:suppress", { detail: false }));
      }
    };
  }, [phase]);

  // size the canvas to its screen element (crisp on retina); cellSize is
  // derived from the actual rendered width so the grid stays pixel-aligned.
  useEffect(() => {
    const screen = screenRef.current;
    const canvas = canvasRef.current;
    if (!screen || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = screen.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cellSize.current = rect.width / GRID_COLS;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(screen);
    return () => observer.disconnect();
  }, []);

  // scrolling away mid-run ends it (rather than leaving it silently paused),
  // so the cursor/ink trail comes back as soon as the fold is out of view.
  useEffect(() => {
    if (!inView && phase === "playing") {
      const id = requestAnimationFrame(() => setPhase("gameover"));
      return () => cancelAnimationFrame(id);
    }
  }, [inView, phase]);

  // arrow-key input — only consumed (and only prevents page scroll) while
  // a game is actually in progress and this fold is on screen. queues the
  // direction rather than applying it immediately, so a key tapped between
  // ticks still lands cleanly on the next one, and a direct reversal
  // (which would run the snake straight into itself) is ignored.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const next = DIRECTIONS[e.key];
      if (!next || phase !== "playing" || !inView) return;
      e.preventDefault();
      if (!isOpposite(next, direction.current)) {
        queuedDirection.current = next;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, inView]);

  // swipe input — a touch starting on the board is tracked to its end point;
  // whichever axis moved further (once past a small threshold, to ignore
  // taps) becomes the queued direction, same reversal guard as arrow keys.
  // attached regardless of detected device type, since a touch laptop can
  // have both a keyboard and a touchscreen.
  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;

    let start: { x: number; y: number } | null = null;

    const onTouchStart = (e: TouchEvent) => {
      if (phase !== "playing" || !inView) {
        start = null;
        return;
      }
      const touch = e.touches[0];
      start = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      // prevent the page from scrolling while swiping inside the board.
      if (start) e.preventDefault();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!start) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      start = null;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < SWIPE_THRESHOLD_PX) return;

      const next: Direction =
        absDx > absDy ? { x: dx > 0 ? 1 : -1, y: 0 } : { x: 0, y: dy > 0 ? 1 : -1 };
      if (!isOpposite(next, direction.current)) {
        queuedDirection.current = next;
      }
    };

    screen.addEventListener("touchstart", onTouchStart, { passive: true });
    screen.addEventListener("touchmove", onTouchMove, { passive: false });
    screen.addEventListener("touchend", onTouchEnd);
    return () => {
      screen.removeEventListener("touchstart", onTouchStart);
      screen.removeEventListener("touchmove", onTouchMove);
      screen.removeEventListener("touchend", onTouchEnd);
    };
  }, [phase, inView]);

  // the game loop: a fixed-tick simulation (one grid step every tickMs)
  // driven by requestAnimationFrame so it can pause cleanly when the fold
  // is off screen or for reduced-motion users, without a stray setInterval
  // ticking away out of view.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (phase !== "playing" || !inView || shouldReduceMotion) return;

    const minTickMs = isTouchDevice ? MIN_TICK_MS_TOUCH : MIN_TICK_MS_DESKTOP;

    const draw = (showSnake = true) => {
      const size = cellSize.current;
      const width = GRID_COLS * size;
      const height = GRID_ROWS * size;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = BOARD_BG;
      ctx.fillRect(0, 0, width, height);

      // food: a soft ink smudge, same radial-gradient treatment as the
      // site-wide cursor trail — a dense core fading to nothing, rather than
      // a hard-edged shape.
      const fx = food.current.x * size + size / 2;
      const fy = food.current.y * size + size / 2;
      const foodRadius = size * 0.32;
      const foodGradient = ctx.createRadialGradient(fx, fy, 0, fx, fy, foodRadius);
      foodGradient.addColorStop(0, `rgba(${FOOD_RGB}, 0.85)`);
      foodGradient.addColorStop(0.5, `rgba(${FOOD_RGB}, 0.4)`);
      foodGradient.addColorStop(1, `rgba(${FOOD_RGB}, 0)`);
      ctx.fillStyle = foodGradient;
      ctx.beginPath();
      ctx.arc(fx, fy, foodRadius, 0, Math.PI * 2);
      ctx.fill();

      // snake: a rounded stroke through each segment's centre, tapering from
      // the food's thickness at the head down to a thin tail — like an
      // actual snake body rather than a uniform tube. each segment-to-segment
      // hop is stroked individually (rather than one path with one width) so
      // the width can change along its length; a wrap (head leaving one edge
      // and re-entering the other) is skipped instead of drawing a streak
      // across the whole board. skipped entirely on the "off" beat of the
      // post-collision blink.
      if (!showSnake) return;

      const headThickness = size * 0.34;
      const tailThickness = size * 0.1;
      ctx.strokeStyle = `rgb(${SNAKE_RGB})`;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      const segCount = snake.current.length;
      for (let i = 1; i < segCount; i++) {
        const seg = snake.current[i];
        const prev = snake.current[i - 1];
        const adjacent =
          Math.abs(seg.x - prev.x) <= 1 &&
          Math.abs(seg.y - prev.y) <= 1 &&
          Math.abs(seg.x - prev.x) + Math.abs(seg.y - prev.y) === 1;
        if (!adjacent) continue;

        const t = segCount > 1 ? i / (segCount - 1) : 0;
        ctx.lineWidth = headThickness - (headThickness - tailThickness) * t;
        ctx.beginPath();
        ctx.moveTo(prev.x * size + size / 2, prev.y * size + size / 2);
        ctx.lineTo(seg.x * size + size / 2, seg.y * size + size / 2);
        ctx.stroke();
      }

      // a filled dot at every segment centre, sized to match that segment's
      // own thickness. stroking each hop separately (so the width can taper)
      // leaves faint seams at the joints, especially on turns — these dots
      // fill them in so the body reads as one unbroken, properly touching
      // shape rather than a chain with visible gaps.
      ctx.fillStyle = `rgb(${SNAKE_RGB})`;
      for (let i = 0; i < segCount; i++) {
        const seg = snake.current[i];
        const t = segCount > 1 ? i / (segCount - 1) : 0;
        const thickness = headThickness - (headThickness - tailThickness) * t;
        ctx.beginPath();
        ctx.arc(seg.x * size + size / 2, seg.y * size + size / 2, thickness / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // once the fatal move is made, stop simulating (the rAF loop keeps
    // running harmlessly until "gameover" actually lands) so nothing moves
    // past the collision the player is about to see. the snake blinks a
    // couple of times in that window instead of just sitting there, so the
    // collision itself reads as an event rather than a silent freeze.
    const BLINK_MS = 160;
    let ended = false;
    let collisionAt = 0;
    let gameOverTimeout: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      if (ended) return;
      direction.current = queuedDirection.current;
      const head = snake.current[0];
      const rawHead: Cell = { x: head.x + direction.current.x, y: head.y + direction.current.y };
      // wrap at the edges — Nokia-style, leaving one side re-enters the
      // other. only running into your own tail ends the game.
      const newHead: Cell = {
        x: (rawHead.x + GRID_COLS) % GRID_COLS,
        y: (rawHead.y + GRID_ROWS) % GRID_ROWS,
      };

      // self-collision — the tail cell is excluded since it moves away
      // this same tick (unless the snake just grew, handled by only
      // popping the tail in the non-eating branch below).
      const body = snake.current.slice(0, -1);
      if (body.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
        // draw the actual colliding frame first, and only bring up the game
        // over screen a beat later, so the collision itself is visible
        // instead of being instantly covered by the overlay.
        ended = true;
        collisionAt = performance.now();
        snake.current = [newHead, ...snake.current];
        draw();
        gameOverTimeout = setTimeout(() => setPhase("gameover"), BLINK_MS * 7);
        return;
      }

      snake.current = [newHead, ...snake.current];

      if (newHead.x === food.current.x && newHead.y === food.current.y) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        if (scoreRef.current > highScoreRef.current) {
          highScoreRef.current = scoreRef.current;
          setHighScore(scoreRef.current);
          localStorage.setItem("snake-high-score", String(scoreRef.current));
        }
        tickMsRef.current = Math.max(minTickMs, tickMsRef.current - SPEED_STEP_MS);
        food.current = randomFoodCell(snake.current);
      } else {
        snake.current.pop();
      }

      draw();
    };

    draw();
    lastFrameTime.current = performance.now();
    const loop = (now: number) => {
      accumulatedMs.current += now - lastFrameTime.current;
      lastFrameTime.current = now;
      while (accumulatedMs.current >= tickMsRef.current) {
        accumulatedMs.current -= tickMsRef.current;
        tick();
      }
      if (ended) {
        const blinkOn = Math.floor((now - collisionAt) / BLINK_MS) % 2 === 0;
        draw(blinkOn);
      }
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId.current);
      clearTimeout(gameOverTimeout);
    };
  }, [phase, inView, shouldReduceMotion, isTouchDevice]);

  const isNewBest = score > 0 && score >= highScore;

  return (
    <section
      ref={sectionRef}
      id="snake"
      className="flex items-center justify-center bg-paper px-4 py-14 sm:px-6 sm:py-16"
    >
      {/* on desktop: text on the left, game on the right. stacks (text over
          board) on mobile. */}
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-2 lg:gap-14">
        {/* left column: same heading + description structure as the about /
            projects folds — a bold font-heading title, then a font-body line,
            all in the site's ink palette — plus the live score. centered on
            mobile, left-aligned beside the board on desktop. */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <h2 className="max-w-2xl font-heading text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            snake game
          </h2>
          <p className="mt-3 max-w-sm font-body text-sm text-ink-soft sm:text-base">
            i built this game to keep myself sane while making a website about
            myself....turns out every job app needs one now (thanks ai)
          </p>

          {/* live score — only once a game has actually started, and big enough
              to actually notice. the best score is a separate, smaller stat
              pinned to the game box itself, not here. */}
          {phase !== "intro" && (
            <div className="mt-6 flex items-baseline gap-2 sm:gap-3">
              <span className="font-script text-xl text-ink-soft sm:text-3xl">score</span>
              <span className="font-display text-3xl font-semibold text-ink sm:text-5xl">{score}</span>
            </div>
          )}
        </div>

        {/* right column — the board itself: paper background, a thin hairline
            border so it reads as part of the page rather than a device. */}
        <div
          className="relative mx-auto w-full max-w-[40rem] rounded-[0.75rem] p-1.5 shadow-[0_4px_16px_rgba(44,38,32,0.08)] sm:rounded-[1rem] sm:p-3"
          style={{ backgroundColor: BOARD_BG }}
        >
        {/* the frame draws itself when the fold scrolls into view — an svg rect
            whose stroke traces the board outline (pathLength 0→1), like a square
            being drawn by hand. it replaces a static border; reduced-motion
            users just get the finished outline. */}
        {/* drawn in the board's real pixel space (no stretched viewBox), so the
            stroke traces a clean rounded rectangle. the svg is inset 1px and the
            rect fills it, stroke centred on that edge. */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-[1px] z-20 overflow-visible"
          style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
          fill="none"
        >
          <motion.rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            rx="14"
            ry="14"
            stroke={`rgba(${FOOD_RGB}, 0.38)`}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            // a touch of blur so the thicker stroke reads as a soft, smudgy
            // hand-drawn line rather than a crisp ui border.
            style={{ filter: "blur(0.6px)" }}
            initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
            whileInView={{ pathLength: 1 }}
            // fire only once most of the board is actually on screen, so the
            // draw plays as you arrive rather than finishing during the approach.
            viewport={{ once: true, amount: 0.7 }}
            transition={{ duration: 2.6, ease: [0.65, 0, 0.35, 1] }}
          />
        </svg>

        {/* best score — a small persistent stat pinned to the box itself
            rather than floating between the caption and the box. */}
        {highScore > 0 && (
          <div className="pointer-events-none absolute right-3 top-2 z-10 flex items-baseline gap-1 sm:right-4 sm:top-3 sm:gap-1.5">
            <span className="font-script text-sm text-ink-soft sm:text-base">best</span>
            <span className="font-display text-base font-semibold text-ink-soft sm:text-lg">
              {highScore}
            </span>
          </div>
        )}

        <div
          ref={screenRef}
          className="relative w-full overflow-hidden rounded-[0.45rem] sm:rounded-[0.6rem]"
          style={{ aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`, backgroundColor: BOARD_BG }}
        >
          <canvas ref={canvasRef} className="absolute inset-0" />

          {phase === "intro" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper px-4 text-center sm:gap-4 sm:px-6">
              <h3 className="max-w-[18rem] font-display text-base italic text-ink sm:max-w-2xl sm:text-xl">
                ready when you are
              </h3>
              <p className="max-w-[18rem] font-body text-sm text-ink-soft sm:max-w-none sm:text-[15px]">
                {isTouchDevice
                  ? "swipe to guide the snake. that's the whole tutorial. you've done harder things."
                  : "arrow keys. that's the whole tutorial. you've done harder things."}
              </p>
              <GameButton onClick={startGame}>start game</GameButton>
            </div>
          )}

          {phase === "gameover" && !shouldReduceMotion && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-paper/90 px-4 text-center backdrop-blur-sm sm:gap-3 sm:px-6">
              <span className="font-display text-base italic text-ink sm:text-xl">
                rip snake, 2007–now
              </span>
              <span className="max-w-[20rem] font-body text-sm text-ink-soft sm:max-w-sm sm:text-[15px]">
                {isNewBest
                  ? `score: ${score} — new best! guess you're good at more than one thing.`
                  : `score: ${score}. not bad. now go look at the projects, they're more impressive than this score.`}
              </span>
              <GameButton onClick={startGame}>redeem yourself</GameButton>
            </div>
          )}

          {shouldReduceMotion && phase === "playing" && (
            <div className="absolute inset-0 flex items-center justify-center bg-paper px-6 text-center font-body text-sm text-ink-soft">
              the snake game is paused for reduced motion.
            </div>
          )}
        </div>
        </div>
      </div>
    </section>
  );
}
