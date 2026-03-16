import { HandwritingAnimator } from '../../playback/src/index';
import type { GlyphSet } from '../../playback/src/types';

interface PluginConfig {
  glyphSet?: string;
  speed?: number;
  capHeight?: number;
  color?: string;
}

interface ResolvedOptions {
  glyphSetUrl: string;
  speed: number;
  capHeight: number;
  color: string;
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

// ── Prefetch ─────────────────────────────────────────────────────────────────

function prefetchSlide(slide: Element, pluginConfig: PluginConfig): void {
  const canvases = slide.querySelectorAll<HTMLCanvasElement>('[data-handwriting]');
  canvases.forEach(canvas => {
    const url = canvas.dataset.glyphSet ?? pluginConfig.glyphSet;
    if(url) loadGlyphSet(url);
  });
}

// ── Plugin object ─────────────────────────────────────────────────────────────

const HandwritingReveal = {
  id: 'handwriting',

  init(deck: any): void {
    const config: PluginConfig = deck.getConfig().handwriting ?? {};

    if(!config.glyphSet) {
      console.error('[HandwritingReveal] handwriting.glyphSet is required but was not provided.');
      return;
    }

    // ── slidechanged ────────────────────────────────────────────────────────
    deck.on('slidechanged', (event: any) => {
      const currentSlide: Element = event.currentSlide;

      // Prefetch all glyph sets referenced on this slide (including fragments)
      prefetchSlide(currentSlide, config);

      // Animate non-fragment canvases immediately
      const canvases = currentSlide.querySelectorAll<HTMLCanvasElement>('[data-handwriting]');
      canvases.forEach(canvas => {
        if(!isFragment(canvas, currentSlide)) {
          animateCanvas(canvas, config);
        }
      });

      // Cancel in-progress animations on the previous slide by resetting contexts
      const previousSlide: Element | undefined = event.previousSlide;
      if(previousSlide) {
        const prev = previousSlide.querySelectorAll<HTMLCanvasElement>('[data-handwriting]');
        prev.forEach(canvas => { canvas.width = canvas.width; });
      }
    });

    // ── fragmentshown ────────────────────────────────────────────────────────
    deck.on('fragmentshown', (event: any) => {
      const fragment: Element = event.fragment;
      if(fragment instanceof HTMLCanvasElement && fragment.dataset.handwriting !== undefined) {
        animateCanvas(fragment, config);
      }
      else {
        const canvases = fragment.querySelectorAll<HTMLCanvasElement>('[data-handwriting]');
        canvases.forEach(canvas => animateCanvas(canvas, config));
      }
    });

    // ── fragmenthidden ───────────────────────────────────────────────────────
    deck.on('fragmenthidden', (event: any) => {
      const fragment: Element = event.fragment;
      const canvases = fragment instanceof HTMLCanvasElement && fragment.dataset.handwriting !== undefined
        ? [fragment as HTMLCanvasElement]
        : Array.from(fragment.querySelectorAll<HTMLCanvasElement>('[data-handwriting]'));
      canvases.forEach(canvas => { canvas.width = canvas.width; });
    });

    // ── Initial slide ────────────────────────────────────────────────────────
    const initialSlide = deck.getCurrentSlide();
    if(initialSlide) {
      prefetchSlide(initialSlide, config);
      const canvases = initialSlide.querySelectorAll<HTMLCanvasElement>('[data-handwriting]');
      canvases.forEach(canvas => {
        if(!isFragment(canvas, initialSlide)) {
          animateCanvas(canvas, config);
        }
      });
    }
  },
};

export = HandwritingReveal;
