import { GlyphSet, WriteOptions, ExportPoint, ExportCapture, SequencedGlyph, SoundConfig } from './types';
import { SoundEngine } from './SoundEngine';
import { classifyStroke } from './StrokeClassifier';
import { defaultSounds } from './defaultSounds';

type ResolvedOptions = Required<Omit<WriteOptions, 'sounds' | 'x' | 'y'>> & { sounds?: SoundConfig; x?: number; y?: number };

export class HandwritingAnimator {
   private glyphSet: GlyphSet;
   private canvas: HTMLCanvasElement;
   private ctx: CanvasRenderingContext2D;
   private lastUsedCapture: Map<string, string> = new Map();
   private audioCtx: AudioContext | null = null;

   constructor(canvas: HTMLCanvasElement, glyphSet: GlyphSet) {
      this.canvas   = canvas;
      this.glyphSet = glyphSet;
      const ctx = canvas.getContext('2d');
      if(!ctx) throw new Error('Could not get 2d context from canvas');
      this.ctx = ctx;
   }

   // ── Public API ─────────────────────────────────────────────────────────────

   async write(text: string, options: WriteOptions = {}): Promise<void> {
      const opts = this.resolveOptions(options);
      if(options.x === undefined && options.y === undefined) this.prepareCanvas(opts);

      const sequence = this.buildSequence(text, opts);
      if(sequence.length === 0) return;

      if(opts.instant) return this.drawInstant(sequence, opts);

      if(opts.sounds) {
         if(!this.audioCtx) this.audioCtx = new AudioContext();
         const soundEngine = new SoundEngine(this.audioCtx, opts.sounds);
         await soundEngine.preload();

         const meanMs = this.meanStrokeDuration(sequence, opts.speed);
         if(soundEngine.isScribbleMode(meanMs)) {
            soundEngine.playScribble();
            return this.animate(sequence, opts, null);
         }
         return this.animate(sequence, opts, soundEngine);
      }

      return this.animate(sequence, opts, null);
   }

   // ── Options ────────────────────────────────────────────────────────────────

   private resolveOptions(options: WriteOptions): ResolvedOptions {
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
         sounds:     options.sounds === true ? defaultSounds : options.sounds,
         x:          options.x,
         y:          options.y,
         instant:    options.instant ?? false,
      };
   }

   // ── Canvas setup ───────────────────────────────────────────────────────────

   private prepareCanvas(opts: ResolvedOptions): void {
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

   private buildSequence(text: string, opts: ResolvedOptions): SequencedGlyph[] {
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
         xOffset += capture.width + opts.letterGap;
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

   // ── Stroke duration ────────────────────────────────────────────────────────

   private meanStrokeDuration(sequence: SequencedGlyph[], speed: number): number {
      let total = 0;
      let count = 0;
      for(const sg of sequence) {
         for(const stroke of sg.capture.strokes) {
            if(stroke.length < 2) continue;
            total += (stroke[stroke.length - 1].t - stroke[0].t) / speed;
            count++;
         }
      }
      return count > 0 ? total / count : 0;
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

   // ── Instant render ─────────────────────────────────────────────────────────

   private drawInstant(sequence: SequencedGlyph[], opts: ResolvedOptions): Promise<void> {
      const baseX = opts.x ?? 0;
      const baseY = opts.y ?? opts.topPad;

      for(const seqGlyph of sequence) {
         const capHeight = opts.capHeight;
         const xOrigin   = baseX + seqGlyph.xOffset * capHeight;

         for(const stroke of seqGlyph.capture.strokes) {
            const smoothed = this.smoothPoints(stroke);
            for(let i = 1; i < smoothed.length; i++) {
               const prev = smoothed[i - 1];
               const curr = smoothed[i];
               this.drawSegment(
                  xOrigin + prev.x * capHeight,
                  baseY   + prev.y * capHeight,
                  xOrigin + curr.x * capHeight,
                  baseY   + curr.y * capHeight,
                  curr.p,
                  opts,
               );
            }
         }
      }

      return Promise.resolve();
   }

   // ── Animation ──────────────────────────────────────────────────────────────

   private animate(
      sequence: SequencedGlyph[],
      opts: ResolvedOptions,
      soundEngine: SoundEngine | null,
   ): Promise<void> {
      return new Promise(resolve => {
         interface DrawEvent {
            fromX: number; fromY: number;
            toX:   number; toY:   number;
            pressure: number;
            t: number;   // wall-clock ms (scaled by speed)
         }
         interface SoundEvent {
            strokeType: import('./types').StrokeType;
            t: number;
         }

         const drawEvents:  DrawEvent[]  = [];
         const soundEvents: SoundEvent[] = [];
         let globalTOffset = 0;

         const baseX = opts.x ?? 0;
         const baseY = opts.y ?? opts.topPad;

         for(const seqGlyph of sequence) {
            const capHeight = opts.capHeight;
            const xOrigin   = baseX + seqGlyph.xOffset * capHeight;
            const capture   = seqGlyph.capture;
            let captureStart: number | null = null;

            for(const stroke of capture.strokes) {
               const smoothed = this.smoothPoints(stroke);

               for(let i = 1; i < smoothed.length; i++) {
                  const prev = smoothed[i - 1];
                  const curr = smoothed[i];

                  if(captureStart === null) captureStart = prev.t;
                  const wallT = globalTOffset + (curr.t - captureStart) / opts.speed;

                  if(i === 1 && soundEngine) {
                     const strokeType = classifyStroke(
                        smoothed,
                        opts.sounds?.thresholds?.straight,
                        opts.sounds?.thresholds?.sharp,
                     );
                     soundEvents.push({ strokeType, t: wallT });
                  }

                  drawEvents.push({
                     fromX:    xOrigin + prev.x * capHeight,
                     fromY:    baseY   + prev.y * capHeight,
                     toX:      xOrigin + curr.x * capHeight,
                     toY:      baseY   + curr.y * capHeight,
                     pressure: curr.p,
                     t:        wallT,
                  });
               }
            }

            const lastStroke   = capture.strokes[capture.strokes.length - 1];
            const lastPoint    = lastStroke?.[lastStroke.length - 1];
            const firstPoint   = capture.strokes[0]?.[0];
            const captureDurMs = firstPoint && lastPoint
               ? (lastPoint.t - firstPoint.t) / opts.speed
               : 0;
            globalTOffset += captureDurMs + (30 / opts.speed);
         }

         if(drawEvents.length === 0) { resolve(); return; }

         const startTime = performance.now();

         const frame = () => {
            const elapsed = performance.now() - startTime;

            // Fire sound events
            while(soundEvents.length > 0 && soundEvents[0].t <= elapsed) {
               const ev = soundEvents.shift()!;
               soundEngine?.playForStroke(ev.strokeType);
            }

            while(drawEvents.length > 0 && drawEvents[0].t <= elapsed) {
               const ev = drawEvents.shift()!;
               this.drawSegment(ev.fromX, ev.fromY, ev.toX, ev.toY, ev.pressure, opts);
            }

            if(drawEvents.length > 0) {
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
      opts: ResolvedOptions
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
