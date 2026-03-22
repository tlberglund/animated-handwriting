// src/Diagram.tsx
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";

// ../diagram-playback/src/DiagramAnimator.ts
var DiagramAnimator = class {
  constructor(canvas, diagram) {
    this.canvas = canvas;
    this.diagram = diagram;
    const ctx = canvas.getContext("2d");
    if (!ctx)
      throw new Error("Could not get 2d context from canvas");
    this.ctx = ctx;
  }
  // ── Public API ─────────────────────────────────────────────────────────────
  play(options = {}) {
    if (this.canvas.clientWidth === 0 || this.canvas.clientHeight === 0) {
      console.warn("[DiagramAnimator] Canvas has zero size; skipping animation");
      return Promise.resolve();
    }
    const opts = this.resolveOptions(options);
    this.prepareCanvas(opts);
    if (this.diagram.strokes.length === 0)
      return Promise.resolve();
    return this.animate(opts);
  }
  // ── Options ────────────────────────────────────────────────────────────────
  resolveOptions(options) {
    return {
      speed: options.speed ?? 1.5,
      color: options.color ?? "#1a1a1a",
      minWidth: options.minWidth ?? 1.5,
      maxWidth: options.maxWidth ?? 3,
      scale: options.scale ?? 2
    };
  }
  // ── Canvas setup ───────────────────────────────────────────────────────────
  prepareCanvas(opts) {
    const cssW = this.canvas.clientWidth;
    const cssH = this.canvas.clientHeight;
    this.canvas.width = cssW * opts.scale;
    this.canvas.height = cssH * opts.scale;
    this.ctx.scale(opts.scale, opts.scale);
    this.ctx.clearRect(0, 0, cssW, cssH);
  }
  // ── Letterbox fit ──────────────────────────────────────────────────────────
  computeFitRect() {
    const cssW = this.canvas.clientWidth;
    const cssH = this.canvas.clientHeight;
    const canvasAspect = cssW / cssH;
    const diagramAspect = this.diagram.aspectRatio;
    let renderW;
    let renderH;
    let offsetX;
    let offsetY;
    if (canvasAspect > diagramAspect) {
      renderH = cssH;
      renderW = renderH * diagramAspect;
      offsetX = (cssW - renderW) / 2;
      offsetY = 0;
    } else {
      renderW = cssW;
      renderH = renderW / diagramAspect;
      offsetX = 0;
      offsetY = (cssH - renderH) / 2;
    }
    return { renderW, renderH, offsetX, offsetY };
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
  animate(opts) {
    return new Promise((resolve) => {
      const { renderW, renderH, offsetX, offsetY } = this.computeFitRect();
      const events = [];
      let globalTOffset = 0;
      for (const stroke of this.diagram.strokes) {
        if (stroke.length < 2)
          continue;
        const smoothed = this.smoothPoints(stroke);
        const strokeStart = smoothed[0].t;
        for (let i = 1; i < smoothed.length; i++) {
          const prev = smoothed[i - 1];
          const curr = smoothed[i];
          const relT = curr.t - strokeStart;
          events.push({
            fromX: offsetX + prev.x * renderW,
            fromY: offsetY + prev.y * renderH,
            toX: offsetX + curr.x * renderW,
            toY: offsetY + curr.y * renderH,
            pressure: curr.p,
            t: globalTOffset + relT / opts.speed
          });
        }
        const lastPt = smoothed[smoothed.length - 1];
        const firstPt = smoothed[0];
        const duration = (lastPt.t - firstPt.t) / opts.speed;
        globalTOffset += duration + 30 / opts.speed;
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

// src/Diagram.tsx
import { jsx } from "react/jsx-runtime";
var Diagram = forwardRef(
  function Diagram2(props, ref) {
    const {
      diagram,
      speed,
      color,
      minWidth,
      maxWidth,
      playOn = "visible",
      onComplete,
      onError,
      className,
      style
    } = props;
    const [resolvedDiagram, setResolvedDiagram] = useState(
      typeof diagram === "string" ? null : diagram
    );
    const canvasRef = useRef(null);
    const hasPlayedRef = useRef(false);
    const observerRef = useRef(null);
    const cancelRef = useRef(null);
    useEffect(() => {
      if (typeof diagram !== "string") {
        setResolvedDiagram(diagram);
        return;
      }
      let cancelled = false;
      fetch(diagram).then((r) => {
        if (!r.ok)
          throw new Error(`Failed to fetch diagram: ${r.status}`);
        return r.json();
      }).then((data) => {
        if (!cancelled)
          setResolvedDiagram(data);
      }).catch((err) => {
        if (!cancelled) {
          if (onError)
            onError(err);
          else
            console.warn("[diagram-react] Failed to load diagram:", err);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [diagram]);
    function triggerPlay(data) {
      const canvas = canvasRef.current;
      if (!canvas)
        return;
      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }
      hasPlayedRef.current = true;
      const animator = new DiagramAnimator(canvas, data);
      const promise = animator.play({ speed, color, minWidth, maxWidth });
      cancelRef.current = () => {
        canvas.width = canvas.width;
      };
      promise.then(() => {
        cancelRef.current = null;
        onComplete?.();
      });
    }
    useEffect(() => {
      if (!resolvedDiagram || hasPlayedRef.current)
        return;
      if (playOn === "mount") {
        triggerPlay(resolvedDiagram);
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas)
        return;
      if (typeof IntersectionObserver === "undefined") {
        triggerPlay(resolvedDiagram);
        return;
      }
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          observerRef.current = null;
          triggerPlay(resolvedDiagram);
        }
      });
      observerRef.current = observer;
      observer.observe(canvas);
      return () => {
        observer.disconnect();
        observerRef.current = null;
      };
    }, [resolvedDiagram]);
    useEffect(() => {
      if (!resolvedDiagram || !hasPlayedRef.current)
        return;
      triggerPlay(resolvedDiagram);
    }, [resolvedDiagram]);
    useImperativeHandle(ref, () => ({
      play() {
        if (!resolvedDiagram)
          return;
        hasPlayedRef.current = true;
        triggerPlay(resolvedDiagram);
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
    if (!resolvedDiagram)
      return null;
    return /* @__PURE__ */ jsx(
      "canvas",
      {
        ref: canvasRef,
        className,
        style: {
          display: "block",
          aspectRatio: String(resolvedDiagram.aspectRatio),
          ...style
        }
      }
    );
  }
);
export {
  Diagram
};
