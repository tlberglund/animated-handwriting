import { GlyphSet, WriteOptions, ExportPoint, ExportCapture, SequencedGlyph } from './types';

export class HandwritingAnimator {
   private glyphSet: GlyphSet;
   private canvas: HTMLCanvasElement;
   private ctx: CanvasRenderingContext2D;
   private lastUsedCapture: Map<string, string> = new Map();

   constructor(canvas: HTMLCanvasElement, glyphSet: GlyphSet) {
      this.canvas   = canvas;
      this.glyphSet = glyphSet;
      const ctx = canvas.getContext('2d');
      if(!ctx) throw new Error('Could not get 2d context from canvas');
      this.ctx = ctx;
   }

   // ── Public API ─────────────────────────────────────────────────────────────

   write(text: string, options: WriteOptions = {}): Promise<void> {
      const opts = this.resolveOptions(options);
      this.prepareCanvas(opts);

      const sequence = this.buildSequence(text, opts);
      if(sequence.length === 0) return Promise.resolve();

      return this.animate(sequence, opts);
   }

   // ── Options ────────────────────────────────────────────────────────────────

   private resolveOptions(options: WriteOptions): Required<WriteOptions> {
      return {
         speed:      options.speed      ?? 1.5,
         color:      options.color      ?? '#1a1a1a',
         minWidth:   options.minWidth   ?? 2,
         maxWidth:   options.maxWidth   ?? 4,
         scale:      options.scale      ?? 2,
         letterGap:  options.letterGap  ?? 0.05,
         wordGap:    options.wordGap    ?? 0.35,
         capHeight:  options.capHeight  ?? 80,
         topPad:     options.topPad     ?? 12,
      };
   }

   // ── Canvas setup ───────────────────────────────────────────────────────────

   private prepareCanvas(opts: Required<WriteOptions>): void {
      const cssW = this.canvas.clientWidth  || this.canvas.width;
      const cssH = this.canvas.clientHeight || this.canvas.height;
      this.canvas.width  = cssW * opts.scale;
      this.canvas.height = cssH * opts.scale;
      this.ctx.scale(opts.scale, opts.scale);
      this.ctx.clearRect(0, 0, cssW, cssH);
   }

   // ── Ligature substitution ──────────────────────────────────────────────────

   private tokenize(text: string): string[] {
      // Build sorted ligature list (longest first for greedy match)
      const ligatures = Object.keys(this.glyphSet.glyphs)
         .filter(k => k.length > 1)
         .sort((a, b) => b.length - a.length);

      const tokens: string[] = [];
      let i = 0;
      while(i < text.length) {
         if(text[i] === ' ') { tokens.push(' '); i++; continue; }

         let matched = false;
         for(const lig of ligatures) {
            if(text.startsWith(lig, i)) {
               tokens.push(lig);
               i += lig.length;
               matched = true;
               break;
            }
         }
         if(!matched) { tokens.push(text[i]); i++; }
      }
      return tokens;
   }

   // ── Glyph sequencing ───────────────────────────────────────────────────────

   private buildSequence(text: string, opts: Required<WriteOptions>): SequencedGlyph[] {
      const tokens   = this.tokenize(text);
      const sequence: SequencedGlyph[] = [];
      let xOffset = 0;

      for(const token of tokens) {
         if(token === ' ') {
            xOffset += opts.wordGap;
            continue;
         }

         const glyph = this.glyphSet.glyphs[token];
         if(!glyph) {
            console.warn(`[HandwritingAnimator] No capture for character: "${token}" — skipping`);
            continue;
         }

         const capture = this.pickCapture(token, glyph.captures);
         if(!capture) continue;

         sequence.push({ character: token, capture, xOffset });
         xOffset += glyph.width + opts.letterGap;
      }

      return sequence;
   }

   private pickCapture(character: string, captures: ExportCapture[]): ExportCapture | null {
      if(captures.length === 0) return null;
      if(captures.length === 1) return captures[0];

      const lastId = this.lastUsedCapture.get(character);
      const candidates = lastId
         ? captures.filter(c => c.id !== lastId)
         : captures;

      const pool    = candidates.length > 0 ? candidates : captures;
      const chosen  = pool[Math.floor(Math.random() * pool.length)];
      this.lastUsedCapture.set(character, chosen.id);
      return chosen;
   }

   // ── Smoothing ──────────────────────────────────────────────────────────────

   private smoothPoints(points: ExportPoint[]): ExportPoint[] {
      if(points.length < 3) return points;
      return points.map((pt, i) => {
         if(i === 0 || i === points.length - 1) return pt;
         const prev = points[i - 1];
         const next = points[i + 1];
         return {
            x: (prev.x + pt.x * 2 + next.x) / 4,
            y: (prev.y + pt.y * 2 + next.y) / 4,
            t: pt.t,
            p: pt.p,
         };
      });
   }

   // ── Animation ──────────────────────────────────────────────────────────────

   private animate(sequence: SequencedGlyph[], opts: Required<WriteOptions>): Promise<void> {
      return new Promise(resolve => {
         // Flatten all draw events into a timeline
         interface DrawEvent {
            fromX: number; fromY: number;
            toX:   number; toY:   number;
            pressure: number;
            t: number;   // wall-clock ms (scaled by speed)
         }

         const events: DrawEvent[] = [];
         let globalTOffset = 0;

         for(const seqGlyph of sequence) {
            const capHeight = opts.capHeight;
            const xOrigin   = seqGlyph.xOffset * capHeight;

            const capture = seqGlyph.capture;
            let captureStart: number | null = null;

            for(const stroke of capture.strokes) {
               const smoothed = this.smoothPoints(stroke);
               for(let i = 1; i < smoothed.length; i++) {
                  const prev = smoothed[i - 1];
                  const curr = smoothed[i];

                  if(captureStart === null) captureStart = prev.t;
                  const relT = curr.t - captureStart;

                  events.push({
                     fromX:    xOrigin + prev.x * capHeight,
                     fromY:    opts.topPad + prev.y * capHeight,
                     toX:      xOrigin + curr.x * capHeight,
                     toY:      opts.topPad + curr.y * capHeight,
                     pressure: curr.p,
                     t:        globalTOffset + relT / opts.speed,
                  });
               }
            }

            // Advance globalTOffset by the duration of this capture + a small inter-glyph gap
            const lastStroke    = capture.strokes[capture.strokes.length - 1];
            const lastPoint     = lastStroke?.[lastStroke.length - 1];
            const firstPoint    = capture.strokes[0]?.[0];
            const captureDurMs  = firstPoint && lastPoint
               ? (lastPoint.t - firstPoint.t) / opts.speed
               : 0;
            globalTOffset += captureDurMs + (30 / opts.speed);  // 30ms inter-glyph pause
         }

         if(events.length === 0) { resolve(); return; }

         const startTime = performance.now();

         const frame = () => {
            const elapsed = performance.now() - startTime;

            while(events.length > 0 && events[0].t <= elapsed) {
               const ev = events.shift()!;
               this.drawSegment(ev.fromX, ev.fromY, ev.toX, ev.toY, ev.pressure, opts);
            }

            if(events.length > 0) {
               requestAnimationFrame(frame);
            }
            else {
               resolve();
            }
         };

         requestAnimationFrame(frame);
      });
   }

   private drawSegment(
      fromX: number, fromY: number,
      toX:   number, toY:   number,
      pressure: number,
      opts: Required<WriteOptions>
   ): void {
      const lw = opts.minWidth + pressure * (opts.maxWidth - opts.minWidth);
      this.ctx.lineCap     = 'round';
      this.ctx.lineJoin    = 'round';
      this.ctx.strokeStyle = opts.color;
      this.ctx.lineWidth   = lw;
      this.ctx.beginPath();
      this.ctx.moveTo(fromX, fromY);
      this.ctx.lineTo(toX, toY);
      this.ctx.stroke();
   }
}
