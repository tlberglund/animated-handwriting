import { NormalizedPoint, DiagramExport, DiagramPlayOptions } from './types';

export class DiagramAnimator {
   private canvas: HTMLCanvasElement;
   private ctx: CanvasRenderingContext2D;
   private diagram: DiagramExport;

   constructor(canvas: HTMLCanvasElement, diagram: DiagramExport) {
      this.canvas  = canvas;
      this.diagram = diagram;
      const ctx = canvas.getContext('2d');
      if(!ctx) throw new Error('Could not get 2d context from canvas');
      this.ctx = ctx;
   }

   // ── Public API ─────────────────────────────────────────────────────────────

   play(options: DiagramPlayOptions = {}): Promise<void> {
      if(this.canvas.clientWidth === 0 || this.canvas.clientHeight === 0) {
         console.warn('[DiagramAnimator] Canvas has zero size; skipping animation');
         return Promise.resolve();
      }

      const opts = this.resolveOptions(options);
      this.prepareCanvas(opts);

      if(this.diagram.strokes.length === 0) return Promise.resolve();

      return this.animate(opts);
   }

   // ── Options ────────────────────────────────────────────────────────────────

   private resolveOptions(options: DiagramPlayOptions): Required<DiagramPlayOptions> {
      return {
         speed:    options.speed    ?? 1.5,
         color:    options.color    ?? '#1a1a1a',
         minWidth: options.minWidth ?? 1.5,
         maxWidth: options.maxWidth ?? 3,
         scale:    options.scale    ?? 2,
      };
   }

   // ── Canvas setup ───────────────────────────────────────────────────────────

   private prepareCanvas(opts: Required<DiagramPlayOptions>): void {
      const cssW = this.canvas.clientWidth;
      const cssH = this.canvas.clientHeight;
      this.canvas.width  = cssW * opts.scale;
      this.canvas.height = cssH * opts.scale;
      this.ctx.scale(opts.scale, opts.scale);
      this.ctx.clearRect(0, 0, cssW, cssH);
   }

   // ── Letterbox fit ──────────────────────────────────────────────────────────

   private computeFitRect(): { renderW: number; renderH: number; offsetX: number; offsetY: number } {
      const cssW        = this.canvas.clientWidth;
      const cssH        = this.canvas.clientHeight;
      const canvasAspect  = cssW / cssH;
      const diagramAspect = this.diagram.aspectRatio;

      let renderW: number;
      let renderH: number;
      let offsetX: number;
      let offsetY: number;

      if(canvasAspect > diagramAspect) {
         renderH = cssH;
         renderW = renderH * diagramAspect;
         offsetX = (cssW - renderW) / 2;
         offsetY = 0;
      }
      else {
         renderW = cssW;
         renderH = renderW / diagramAspect;
         offsetX = 0;
         offsetY = (cssH - renderH) / 2;
      }

      return { renderW, renderH, offsetX, offsetY };
   }

   // ── Smoothing ──────────────────────────────────────────────────────────────

   private smoothPoints(points: NormalizedPoint[]): NormalizedPoint[] {
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

   private animate(opts: Required<DiagramPlayOptions>): Promise<void> {
      return new Promise(resolve => {
         interface DrawEvent {
            fromX: number; fromY: number;
            toX:   number; toY:   number;
            pressure: number;
            t: number;
         }

         const { renderW, renderH, offsetX, offsetY } = this.computeFitRect();

         const events: DrawEvent[] = [];
         let globalTOffset = 0;

         for(const stroke of this.diagram.strokes) {
            if(stroke.length < 2) continue;
            const smoothed = this.smoothPoints(stroke);
            const strokeStart = smoothed[0].t;

            for(let i = 1; i < smoothed.length; i++) {
               const prev = smoothed[i - 1];
               const curr = smoothed[i];
               const relT = curr.t - strokeStart;

               events.push({
                  fromX:    offsetX + prev.x * renderW,
                  fromY:    offsetY + prev.y * renderH,
                  toX:      offsetX + curr.x * renderW,
                  toY:      offsetY + curr.y * renderH,
                  pressure: curr.p,
                  t:        globalTOffset + relT / opts.speed,
               });
            }

            const lastPt   = smoothed[smoothed.length - 1];
            const firstPt  = smoothed[0];
            const duration = (lastPt.t - firstPt.t) / opts.speed;
            globalTOffset += duration + (30 / opts.speed);
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
      opts: Required<DiagramPlayOptions>
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
