// src/Handwriting.tsx
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";

// ../playback/src/HandwritingAnimator.ts
var HandwritingAnimator = class {
  constructor(canvas, glyphSet) {
    this.lastUsedCapture = /* @__PURE__ */ new Map();
    this.canvas = canvas;
    this.glyphSet = glyphSet;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("Could not get 2d context from canvas");
    this.ctx = ctx;
  }
  // ── Public API ─────────────────────────────────────────────────────────────
  write(text, options = {}) {
    const opts = this.resolveOptions(options);
    this.prepareCanvas(opts);
    const sequence = this.buildSequence(text, opts);
    if (sequence.length === 0)
      return Promise.resolve();
    return this.animate(sequence, opts);
  }
  // ── Options ────────────────────────────────────────────────────────────────
  resolveOptions(options) {
    return {
      speed: options.speed ?? 1.5,
      color: options.color ?? "#1a1a1a",
      minWidth: options.minWidth ?? 2,
      maxWidth: options.maxWidth ?? 4,
      scale: options.scale ?? 2,
      letterGap: options.letterGap ?? 0.05,
      wordGap: options.wordGap ?? 0.35,
      capHeight: options.capHeight ?? 80,
      topPad: options.topPad ?? 12
    };
  }
  // ── Canvas setup ───────────────────────────────────────────────────────────
  prepareCanvas(opts) {
    const cssW = this.canvas.clientWidth || this.canvas.width;
    const cssH = this.canvas.clientHeight || this.canvas.height;
    this.canvas.width = cssW * opts.scale;
    this.canvas.height = cssH * opts.scale;
    this.ctx.scale(opts.scale, opts.scale);
    this.ctx.clearRect(0, 0, cssW, cssH);
  }
  // ── Ligature substitution ──────────────────────────────────────────────────
  tokenize(text) {
    const ligatures = Object.keys(this.glyphSet.glyphs).filter((k) => k.length > 1).sort((a, b) => b.length - a.length);
    const tokens = [];
    let i = 0;
    while (i < text.length) {
      if (text[i] === " ") {
        tokens.push(" ");
        i++;
        continue;
      }
      let matched = false;
      for (const lig of ligatures) {
        if (text.startsWith(lig, i)) {
          tokens.push(lig);
          i += lig.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        tokens.push(text[i]);
        i++;
      }
    }
    return tokens;
  }
  // ── Glyph sequencing ───────────────────────────────────────────────────────
  buildSequence(text, opts) {
    const tokens = this.tokenize(text);
    const sequence = [];
    let xOffset = 0;
    for (const token of tokens) {
      if (token === " ") {
        xOffset += opts.wordGap;
        continue;
      }
      const glyph = this.glyphSet.glyphs[token];
      if (!glyph) {
        console.warn(`[HandwritingAnimator] No capture for character: "${token}" \u2014 skipping`);
        continue;
      }
      const capture = this.pickCapture(token, glyph.captures);
      if (!capture)
        continue;
      sequence.push({ character: token, capture, xOffset });
      xOffset += glyph.width + opts.letterGap;
    }
    return sequence;
  }
  pickCapture(character, captures) {
    if (captures.length === 0)
      return null;
    if (captures.length === 1)
      return captures[0];
    const lastId = this.lastUsedCapture.get(character);
    const candidates = lastId ? captures.filter((c) => c.id !== lastId) : captures;
    const pool = candidates.length > 0 ? candidates : captures;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    this.lastUsedCapture.set(character, chosen.id);
    return chosen;
  }
  // ── Smoothing ──────────────────────────────────────────────────────────────
  smoothPoints(points) {
    if (points.length < 3)
      return points;
    return points.map((pt, i) => {
      if (i === 0 || i === points.length - 1)
        return pt;
      const prev = points[i - 1];
      const next = points[i + 1];
      return {
        x: (prev.x + pt.x * 2 + next.x) / 4,
        y: (prev.y + pt.y * 2 + next.y) / 4,
        t: pt.t,
        p: pt.p
      };
    });
  }
  // ── Animation ──────────────────────────────────────────────────────────────
  animate(sequence, opts) {
    return new Promise((resolve) => {
      const events = [];
      let globalTOffset = 0;
      for (const seqGlyph of sequence) {
        const capHeight = opts.capHeight;
        const xOrigin = seqGlyph.xOffset * capHeight;
        const capture = seqGlyph.capture;
        let captureStart = null;
        for (const stroke of capture.strokes) {
          const smoothed = this.smoothPoints(stroke);
          for (let i = 1; i < smoothed.length; i++) {
            const prev = smoothed[i - 1];
            const curr = smoothed[i];
            if (captureStart === null)
              captureStart = prev.t;
            const relT = curr.t - captureStart;
            events.push({
              fromX: xOrigin + prev.x * capHeight,
              fromY: opts.topPad + prev.y * capHeight,
              toX: xOrigin + curr.x * capHeight,
              toY: opts.topPad + curr.y * capHeight,
              pressure: curr.p,
              t: globalTOffset + relT / opts.speed
            });
          }
        }
        const lastStroke = capture.strokes[capture.strokes.length - 1];
        const lastPoint = lastStroke?.[lastStroke.length - 1];
        const firstPoint = capture.strokes[0]?.[0];
        const captureDurMs = firstPoint && lastPoint ? (lastPoint.t - firstPoint.t) / opts.speed : 0;
        globalTOffset += captureDurMs + 30 / opts.speed;
      }
      if (events.length === 0) {
        resolve();
        return;
      }
      const startTime = performance.now();
      const frame = () => {
        const elapsed = performance.now() - startTime;
        while (events.length > 0 && events[0].t <= elapsed) {
          const ev = events.shift();
          this.drawSegment(ev.fromX, ev.fromY, ev.toX, ev.toY, ev.pressure, opts);
        }
        if (events.length > 0) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(frame);
    });
  }
  drawSegment(fromX, fromY, toX, toY, pressure, opts) {
    const lw = opts.minWidth + pressure * (opts.maxWidth - opts.minWidth);
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = opts.color;
    this.ctx.lineWidth = lw;
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();
  }
};

// src/Handwriting.tsx
import { jsx } from "react/jsx-runtime";
var Handwriting = forwardRef(
  function Handwriting2(props, ref) {
    const {
      glyphSet,
      text,
      speed,
      color,
      capHeight,
      topPad,
      minWidth,
      maxWidth,
      letterGap,
      wordGap,
      playOn = "visible",
      onComplete,
      onError,
      className,
      style
    } = props;
    const [resolvedGlyphSet, setResolvedGlyphSet] = useState(
      typeof glyphSet === "string" ? null : glyphSet
    );
    const canvasRef = useRef(null);
    const hasPlayedRef = useRef(false);
    const observerRef = useRef(null);
    const cancelRef = useRef(null);
    useEffect(() => {
      if (typeof glyphSet !== "string") {
        setResolvedGlyphSet(glyphSet);
        return;
      }
      let cancelled = false;
      fetch(glyphSet).then((r) => {
        if (!r.ok)
          throw new Error(`Failed to fetch glyph set: ${r.status}`);
        return r.json();
      }).then((data) => {
        if (!cancelled)
          setResolvedGlyphSet(data);
      }).catch((err) => {
        if (!cancelled) {
          if (onError)
            onError(err);
          else
            console.warn("[handwriting-react] Failed to load glyph set:", err);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [glyphSet]);
    function triggerPlay(data) {
      const canvas = canvasRef.current;
      if (!canvas)
        return;
      if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
        console.warn("[handwriting-react] Canvas has zero dimensions; skipping animation.");
        return;
      }
      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }
      hasPlayedRef.current = true;
      const animator = new HandwritingAnimator(canvas, data);
      const promise = animator.write(text, {
        speed,
        color,
        capHeight,
        topPad,
        minWidth,
        maxWidth,
        letterGap,
        wordGap
      });
      cancelRef.current = () => {
        canvas.width = canvas.width;
      };
      promise.then(() => {
        cancelRef.current = null;
        onComplete?.();
      });
    }
    useEffect(() => {
      if (!resolvedGlyphSet || hasPlayedRef.current)
        return;
      if (playOn === "mount") {
        triggerPlay(resolvedGlyphSet);
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas)
        return;
      if (typeof IntersectionObserver === "undefined") {
        triggerPlay(resolvedGlyphSet);
        return;
      }
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          observerRef.current = null;
          triggerPlay(resolvedGlyphSet);
        }
      });
      observerRef.current = observer;
      observer.observe(canvas);
      return () => {
        observer.disconnect();
        observerRef.current = null;
      };
    }, [resolvedGlyphSet]);
    useEffect(() => {
      if (!resolvedGlyphSet || !hasPlayedRef.current)
        return;
      triggerPlay(resolvedGlyphSet);
    }, [resolvedGlyphSet, text]);
    useImperativeHandle(ref, () => ({
      play() {
        if (!resolvedGlyphSet)
          return;
        hasPlayedRef.current = true;
        triggerPlay(resolvedGlyphSet);
      }
    }));
    useEffect(() => {
      return () => {
        observerRef.current?.disconnect();
        if (cancelRef.current) {
          cancelRef.current();
          cancelRef.current = null;
        }
      };
    }, []);
    return /* @__PURE__ */ jsx("div", { className, style: { ...style, position: "relative" }, children: /* @__PURE__ */ jsx(
      "canvas",
      {
        ref: canvasRef,
        style: { display: "block", width: "100%", height: "100%" }
      }
    ) });
  }
);
export {
  Handwriting
};
