"use strict";
var HandwritingReveal = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // ../playback/src/HandwritingAnimator.ts
  var HandwritingAnimator;
  var init_HandwritingAnimator = __esm({
    "../playback/src/HandwritingAnimator.ts"() {
      "use strict";
      HandwritingAnimator = class {
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
    }
  });

  // ../playback/src/index.ts
  var init_src = __esm({
    "../playback/src/index.ts"() {
      "use strict";
      init_HandwritingAnimator();
    }
  });

  // ../diagram-playback/src/DiagramAnimator.ts
  var DiagramAnimator;
  var init_DiagramAnimator = __esm({
    "../diagram-playback/src/DiagramAnimator.ts"() {
      "use strict";
      DiagramAnimator = class {
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
    }
  });

  // ../diagram-playback/src/index.ts
  var init_src2 = __esm({
    "../diagram-playback/src/index.ts"() {
      "use strict";
      init_DiagramAnimator();
    }
  });

  // src/index.ts
  var require_src = __commonJS({
    "src/index.ts"(exports, module) {
      init_src();
      init_src2();
      function resolveDimension(value, slideSize) {
        if (value.endsWith("%"))
          return parseFloat(value) * slideSize / 100;
        return parseFloat(value);
      }
      function applyPositionStyles(canvas, pluginConfig, deck) {
        const { x, y, width, height } = canvas.dataset;
        if (x === void 0 || y === void 0)
          return;
        const slideW = deck.getConfig().width ?? 960;
        const slideH = deck.getConfig().height ?? 700;
        const left = resolveDimension(x, slideW);
        const top = resolveDimension(y, slideH);
        const cssWidth = width !== void 0 ? resolveDimension(width, slideW) : void 0;
        const cssHeight = height !== void 0 ? resolveDimension(height, slideH) : (() => {
          const capHeight = parseFloat(canvas.dataset.capHeight ?? "") || (pluginConfig.capHeight ?? 80);
          const topPad = parseFloat(canvas.dataset.topPad ?? "") || (pluginConfig.topPad ?? 12);
          return topPad + capHeight * 1.5;
        })();
        canvas.style.position = "absolute";
        canvas.style.left = `${left}px`;
        canvas.style.top = `${top}px`;
        if (cssWidth !== void 0)
          canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
      }
      var cache = /* @__PURE__ */ new Map();
      function loadGlyphSet(url) {
        if (!cache.has(url)) {
          cache.set(url, fetch(url).then((r) => {
            if (!r.ok)
              throw new Error(`HTTP ${r.status} fetching glyph set: ${url}`);
            return r.json();
          }));
        }
        return cache.get(url);
      }
      var diagramCache = /* @__PURE__ */ new Map();
      function loadDiagram(url) {
        if (!diagramCache.has(url)) {
          diagramCache.set(url, fetch(url).then((r) => {
            if (!r.ok)
              throw new Error(`HTTP ${r.status} fetching diagram: ${url}`);
            return r.json();
          }));
        }
        return diagramCache.get(url);
      }
      function resolveOptions(canvas, pluginConfig) {
        const glyphSetUrl = canvas.dataset.glyphSet ?? pluginConfig.glyphSet;
        if (!glyphSetUrl) {
          console.warn("[HandwritingReveal] No glyph set URL for canvas:", canvas);
          return null;
        }
        const speed = parseFloat(canvas.dataset.speed ?? "") || (pluginConfig.speed ?? 1.5);
        const capHeight = parseFloat(canvas.dataset.capHeight ?? "") || (pluginConfig.capHeight ?? 80);
        const color = canvas.dataset.color ?? pluginConfig.color ?? "#1a1a1a";
        return { glyphSetUrl, speed, capHeight, color };
      }
      function isFragment(canvas, slide) {
        if (canvas.classList.contains("fragment"))
          return true;
        let el = canvas.parentElement;
        while (el && el !== slide) {
          if (el.classList.contains("fragment"))
            return true;
          el = el.parentElement;
        }
        return false;
      }
      async function animateCanvas(canvas, pluginConfig) {
        const opts = resolveOptions(canvas, pluginConfig);
        if (!opts)
          return;
        const text = canvas.dataset.handwriting ?? "";
        if (!text)
          return;
        if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
          console.warn("[HandwritingReveal] Canvas has zero size, skipping animation:", canvas);
          return;
        }
        let glyphSet;
        try {
          glyphSet = await loadGlyphSet(opts.glyphSetUrl);
        } catch (err) {
          console.error("[HandwritingReveal] Failed to load glyph set:", opts.glyphSetUrl, err);
          return;
        }
        new HandwritingAnimator(canvas, glyphSet).write(text, {
          speed: opts.speed,
          capHeight: opts.capHeight,
          color: opts.color
        });
      }
      async function animateDiagramCanvas(canvas, pluginConfig) {
        const url = canvas.dataset.diagram;
        if (!url)
          return;
        if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
          console.warn("[HandwritingReveal] Diagram canvas has zero size, skipping animation:", canvas);
          return;
        }
        const speed = parseFloat(canvas.dataset.diagramSpeed ?? "") || (pluginConfig.speed ?? 1.5);
        const color = canvas.dataset.diagramColor ?? pluginConfig.color ?? "#1a1a1a";
        let diagram;
        try {
          diagram = await loadDiagram(url);
        } catch (err) {
          console.error("[HandwritingReveal] Failed to load diagram:", url, err);
          return;
        }
        new DiagramAnimator(canvas, diagram).play({ speed, color });
      }
      function prefetchSlide(slide, pluginConfig) {
        slide.querySelectorAll("[data-handwriting]").forEach((canvas) => {
          const url = canvas.dataset.glyphSet ?? pluginConfig.glyphSet;
          if (url)
            loadGlyphSet(url);
        });
        slide.querySelectorAll("[data-diagram]").forEach((canvas) => {
          const url = canvas.dataset.diagram;
          if (url)
            loadDiagram(url);
        });
      }
      function clearCanvas(canvas) {
        canvas.width = canvas.width;
      }
      var HandwritingReveal = {
        id: "handwriting",
        init(deck) {
          const config = deck.getConfig().handwriting ?? {};
          if (!config.glyphSet) {
            console.warn("[HandwritingReveal] handwriting.glyphSet is not set \u2014 handwriting canvases will not animate.");
          }
          document.querySelectorAll("[data-handwriting], [data-diagram]").forEach((canvas) => {
            applyPositionStyles(canvas, config, deck);
          });
          deck.on("slidechanged", (event) => {
            const currentSlide = event.currentSlide;
            prefetchSlide(currentSlide, config);
            currentSlide.querySelectorAll("[data-handwriting]").forEach((canvas) => {
              if (!isFragment(canvas, currentSlide)) {
                animateCanvas(canvas, config);
              }
            });
            currentSlide.querySelectorAll("[data-diagram]").forEach((canvas) => {
              if (!isFragment(canvas, currentSlide)) {
                animateDiagramCanvas(canvas, config);
              }
            });
            const previousSlide = event.previousSlide;
            if (previousSlide) {
              previousSlide.querySelectorAll("[data-handwriting]").forEach(clearCanvas);
              previousSlide.querySelectorAll("[data-diagram]").forEach(clearCanvas);
            }
          });
          deck.on("fragmentshown", (event) => {
            const fragment = event.fragment;
            if (fragment instanceof HTMLCanvasElement) {
              if (fragment.dataset.handwriting !== void 0)
                animateCanvas(fragment, config);
              if (fragment.dataset.diagram !== void 0)
                animateDiagramCanvas(fragment, config);
            } else {
              fragment.querySelectorAll("[data-handwriting]").forEach((canvas) => animateCanvas(canvas, config));
              fragment.querySelectorAll("[data-diagram]").forEach((canvas) => animateDiagramCanvas(canvas, config));
            }
          });
          deck.on("fragmenthidden", (event) => {
            const fragment = event.fragment;
            if (fragment instanceof HTMLCanvasElement) {
              if (fragment.dataset.handwriting !== void 0)
                clearCanvas(fragment);
              if (fragment.dataset.diagram !== void 0)
                clearCanvas(fragment);
            } else {
              fragment.querySelectorAll("[data-handwriting]").forEach(clearCanvas);
              fragment.querySelectorAll("[data-diagram]").forEach(clearCanvas);
            }
          });
          const initialSlide = deck.getCurrentSlide();
          if (initialSlide) {
            prefetchSlide(initialSlide, config);
            initialSlide.querySelectorAll("[data-handwriting]").forEach((canvas) => {
              if (!isFragment(canvas, initialSlide)) {
                animateCanvas(canvas, config);
              }
            });
            initialSlide.querySelectorAll("[data-diagram]").forEach((canvas) => {
              if (!isFragment(canvas, initialSlide)) {
                animateDiagramCanvas(canvas, config);
              }
            });
          }
        }
      };
      module.exports = HandwritingReveal;
    }
  });
  return require_src();
})();
