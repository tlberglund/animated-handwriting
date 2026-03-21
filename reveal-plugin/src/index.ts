import { HandwritingAnimator } from '../../playback/src/index';
import { DiagramAnimator } from '../../diagram-playback/src/index';
import type { GlyphSet } from '../../playback/src/types';
import type { DiagramExport } from '../../diagram-playback/src/types';

interface PluginConfig {
  glyphSet?: string;
  speed?: number;
  capHeight?: number;
  color?: string;
  topPad?: number;
}

interface ResolvedOptions {
  glyphSetUrl: string;
  speed: number;
  capHeight: number;
  color: string;
}

// ── Dimension resolution ─────────────────────────────────────────────────────
// Accepts "30%" (resolved against slideSize) or "240" (raw pixels).

function resolveDimension(value: string, slideSize: number): number {
  if(value.endsWith('%')) return parseFloat(value) * slideSize / 100;
  return parseFloat(value);
}

// ── Position style injection ──────────────────────────────────────────────────
// Applied eagerly at init time for all canvases carrying data-x and data-y.

function applyPositionStyles(canvas: HTMLCanvasElement, pluginConfig: PluginConfig, deck: any): void {
  const { x, y, width, height } = canvas.dataset;

  // Require both axes; a canvas with only one stays in normal flow.
  if(x === undefined || y === undefined) return;

  const slideW: number = deck.getConfig().width  ?? 960;
  const slideH: number = deck.getConfig().height ?? 700;

  const left = resolveDimension(x, slideW);
  const top  = resolveDimension(y, slideH);

  const cssWidth = width !== undefined
    ? resolveDimension(width, slideW)
    : undefined;

  const cssHeight = height !== undefined
    ? resolveDimension(height, slideH)
    : (() => {
        const capHeight = parseFloat(canvas.dataset.capHeight ?? '') || (pluginConfig.capHeight ?? 80);
        const topPad    = parseFloat(canvas.dataset.topPad    ?? '') || (pluginConfig.topPad    ?? 12);
        return topPad + capHeight * 1.5;
      })();

  canvas.style.position = 'absolute';
  canvas.style.left     = `${left}px`;
  canvas.style.top      = `${top}px`;
  if(cssWidth  !== undefined) canvas.style.width  = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
}

// ── Glyph set cache ─────────────────────────────────────────────────────────
// Stores Promise<GlyphSet> so concurrent requests for the same URL coalesce.
const cache = new Map<string, Promise<GlyphSet>>();

function loadGlyphSet(url: string): Promise<GlyphSet> {
  if(!cache.has(url)) {
    cache.set(url, fetch(url).then(r => {
      if(!r.ok) throw new Error(`HTTP ${r.status} fetching glyph set: ${url}`);
      return r.json() as Promise<GlyphSet>;
    }));
  }
  return cache.get(url)!;
}

// ── Diagram cache ────────────────────────────────────────────────────────────
// Stores Promise<DiagramExport> so concurrent requests for the same URL coalesce.
const diagramCache = new Map<string, Promise<DiagramExport>>();

function loadDiagram(url: string): Promise<DiagramExport> {
  if(!diagramCache.has(url)) {
    diagramCache.set(url, fetch(url).then(r => {
      if(!r.ok) throw new Error(`HTTP ${r.status} fetching diagram: ${url}`);
      return r.json() as Promise<DiagramExport>;
    }));
  }
  return diagramCache.get(url)!;
}

// ── Option resolution ────────────────────────────────────────────────────────

function resolveOptions(canvas: HTMLCanvasElement, pluginConfig: PluginConfig): ResolvedOptions | null {
  const glyphSetUrl = canvas.dataset.glyphSet ?? pluginConfig.glyphSet;
  if(!glyphSetUrl) {
    console.warn('[HandwritingReveal] No glyph set URL for canvas:', canvas);
    return null;
  }
  const speed     = parseFloat(canvas.dataset.speed     ?? '') || (pluginConfig.speed     ?? 1.5);
  const capHeight = parseFloat(canvas.dataset.capHeight ?? '') || (pluginConfig.capHeight ?? 80);
  const color     =            canvas.dataset.color     ?? pluginConfig.color            ?? '#1a1a1a';
  return { glyphSetUrl, speed, capHeight, color };
}

// ── Fragment detection ───────────────────────────────────────────────────────

function isFragment(canvas: HTMLCanvasElement, slide: Element): boolean {
  if(canvas.classList.contains('fragment')) return true;
  let el: Element | null = canvas.parentElement;
  while(el && el !== slide) {
    if(el.classList.contains('fragment')) return true;
    el = el.parentElement;
  }
  return false;
}

// ── Animation ────────────────────────────────────────────────────────────────

async function animateCanvas(canvas: HTMLCanvasElement, pluginConfig: PluginConfig): Promise<void> {
  const opts = resolveOptions(canvas, pluginConfig);
  if(!opts) return;

  const text = canvas.dataset.handwriting ?? '';
  if(!text) return;

  if(canvas.clientWidth === 0 || canvas.clientHeight === 0) {
    console.warn('[HandwritingReveal] Canvas has zero size, skipping animation:', canvas);
    return;
  }

  let glyphSet: GlyphSet;
  try {
    glyphSet = await loadGlyphSet(opts.glyphSetUrl);
  }
  catch(err) {
    console.error('[HandwritingReveal] Failed to load glyph set:', opts.glyphSetUrl, err);
    return;
  }

  new HandwritingAnimator(canvas, glyphSet).write(text, {
    speed:     opts.speed,
    capHeight: opts.capHeight,
    color:     opts.color,
  });
}

async function animateDiagramCanvas(canvas: HTMLCanvasElement, pluginConfig: PluginConfig): Promise<void> {
  const url = canvas.dataset.diagram;
  if(!url) return;

  if(canvas.clientWidth === 0 || canvas.clientHeight === 0) {
    console.warn('[HandwritingReveal] Diagram canvas has zero size, skipping animation:', canvas);
    return;
  }

  const speed = parseFloat(canvas.dataset.diagramSpeed ?? '') || (pluginConfig.speed ?? 1.5);
  const color =            canvas.dataset.diagramColor ?? pluginConfig.color         ?? '#1a1a1a';

  let diagram: DiagramExport;
  try {
    diagram = await loadDiagram(url);
  }
  catch(err) {
    console.error('[HandwritingReveal] Failed to load diagram:', url, err);
    return;
  }

  new DiagramAnimator(canvas, diagram).play({ speed, color });
}

// ── Prefetch ─────────────────────────────────────────────────────────────────

function prefetchSlide(slide: Element, pluginConfig: PluginConfig): void {
  slide.querySelectorAll<HTMLCanvasElement>('[data-handwriting]').forEach(canvas => {
    const url = canvas.dataset.glyphSet ?? pluginConfig.glyphSet;
    if(url) loadGlyphSet(url);
  });
  slide.querySelectorAll<HTMLCanvasElement>('[data-diagram]').forEach(canvas => {
    const url = canvas.dataset.diagram;
    if(url) loadDiagram(url);
  });
}

// ── Canvas clearing ───────────────────────────────────────────────────────────

function clearCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = canvas.width;  // reset bitmap — also cancels in-progress rAF draws
}

// ── Plugin object ─────────────────────────────────────────────────────────────

const HandwritingReveal = {
  id: 'handwriting',

  init(deck: any): void {
    const config: PluginConfig = deck.getConfig().handwriting ?? {};

    if(!config.glyphSet) {
      console.warn('[HandwritingReveal] handwriting.glyphSet is not set — handwriting canvases will not animate.');
    }

    // ── Eager position injection ─────────────────────────────────────────────
    document.querySelectorAll<HTMLCanvasElement>('[data-handwriting], [data-diagram]').forEach(canvas => {
      applyPositionStyles(canvas, config, deck);
    });

    // ── slidechanged ────────────────────────────────────────────────────────
    deck.on('slidechanged', (event: any) => {
      const currentSlide: Element = event.currentSlide;

      // Prefetch all glyph sets / diagrams referenced on this slide
      prefetchSlide(currentSlide, config);

      // Animate non-fragment handwriting canvases
      currentSlide.querySelectorAll<HTMLCanvasElement>('[data-handwriting]').forEach(canvas => {
        if(!isFragment(canvas, currentSlide)) {
          animateCanvas(canvas, config);
        }
      });

      // Animate non-fragment diagram canvases
      currentSlide.querySelectorAll<HTMLCanvasElement>('[data-diagram]').forEach(canvas => {
        if(!isFragment(canvas, currentSlide)) {
          animateDiagramCanvas(canvas, config);
        }
      });

      // Clear canvases on the previous slide
      const previousSlide: Element | undefined = event.previousSlide;
      if(previousSlide) {
        previousSlide.querySelectorAll<HTMLCanvasElement>('[data-handwriting]').forEach(clearCanvas);
        previousSlide.querySelectorAll<HTMLCanvasElement>('[data-diagram]').forEach(clearCanvas);
      }
    });

    // ── fragmentshown ────────────────────────────────────────────────────────
    deck.on('fragmentshown', (event: any) => {
      const fragment: Element = event.fragment;

      if(fragment instanceof HTMLCanvasElement) {
        if(fragment.dataset.handwriting !== undefined) animateCanvas(fragment, config);
        if(fragment.dataset.diagram     !== undefined) animateDiagramCanvas(fragment, config);
      }
      else {
        fragment.querySelectorAll<HTMLCanvasElement>('[data-handwriting]').forEach(canvas => animateCanvas(canvas, config));
        fragment.querySelectorAll<HTMLCanvasElement>('[data-diagram]').forEach(canvas => animateDiagramCanvas(canvas, config));
      }
    });

    // ── fragmenthidden ───────────────────────────────────────────────────────
    deck.on('fragmenthidden', (event: any) => {
      const fragment: Element = event.fragment;

      if(fragment instanceof HTMLCanvasElement) {
        if(fragment.dataset.handwriting !== undefined) clearCanvas(fragment);
        if(fragment.dataset.diagram     !== undefined) clearCanvas(fragment);
      }
      else {
        fragment.querySelectorAll<HTMLCanvasElement>('[data-handwriting]').forEach(clearCanvas);
        fragment.querySelectorAll<HTMLCanvasElement>('[data-diagram]').forEach(clearCanvas);
      }
    });

    // ── Initial slide ────────────────────────────────────────────────────────
    const initialSlide = deck.getCurrentSlide();
    if(initialSlide) {
      prefetchSlide(initialSlide, config);

      initialSlide.querySelectorAll<HTMLCanvasElement>('[data-handwriting]').forEach(canvas => {
        if(!isFragment(canvas, initialSlide)) {
          animateCanvas(canvas, config);
        }
      });

      initialSlide.querySelectorAll<HTMLCanvasElement>('[data-diagram]').forEach(canvas => {
        if(!isFragment(canvas, initialSlide)) {
          animateDiagramCanvas(canvas, config);
        }
      });
    }
  },
};

export = HandwritingReveal;
