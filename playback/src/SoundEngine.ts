import { SoundConfig, StrokeType } from './types';

export class SoundEngine {
   private ctx: AudioContext;
   private config: SoundConfig;

   private buffers     = new Map<string, AudioBuffer | null>();
   private suspendWarned = false;

   constructor(ctx: AudioContext, config: SoundConfig) {
      this.ctx    = ctx;
      this.config = config;
   }

   // ── Preloading ────────────────────────────────────────────────────────────

   async preload(): Promise<void> {
      const urls = new Set<string>([
         ...(this.config.straight ?? []),
         ...(this.config.curve    ?? []),
         ...(this.config.sharp    ?? []),
         ...(this.config.scribble ?? []),
      ]);
      await Promise.all([...urls].map(url => this.loadUrl(url)));
   }

   private async loadUrl(url: string): Promise<void> {
      if(this.buffers.has(url)) return;
      try {
         const response = await fetch(url);
         if(!response.ok) throw new Error(`HTTP ${response.status}`);
         const arrayBuffer = await response.arrayBuffer();
         const decoded     = await this.ctx.decodeAudioData(arrayBuffer);
         this.buffers.set(url, decoded);
      }
      catch(err) {
         console.warn(`[SoundEngine] Failed to load clip "${url}":`, err);
         this.buffers.set(url, null);
      }
   }

   // ── Scribble mode detection ───────────────────────────────────────────────

   isScribbleMode(meanStrokeDurationMs: number): boolean {
      const shortest = this.shortestStrokeClipDuration();
      if(shortest === null) return false;
      return meanStrokeDurationMs < shortest * 0.5;
   }

   private shortestStrokeClipDuration(): number | null {
      const urls = [
         ...(this.config.straight ?? []),
         ...(this.config.curve    ?? []),
         ...(this.config.sharp    ?? []),
      ];
      let shortest: number | null = null;
      for(const url of urls) {
         const buf = this.buffers.get(url);
         if(!buf) continue;
         if(shortest === null || buf.duration < shortest) shortest = buf.duration;
      }
      return shortest;
   }

   // ── Playback ──────────────────────────────────────────────────────────────

   playScribble(): void {
      const urls = this.config.scribble ?? [];
      const ready = urls
         .map(url => this.buffers.get(url) ?? null)
         .filter((b): b is AudioBuffer => b !== null);
      if(ready.length === 0) return;

      const buf = randomPick(ready);
      this.ensureRunning().then(() => {
         if(this.contextState() !== 'running') return;
         const source = this.ctx.createBufferSource();
         source.buffer = buf;
         source.connect(this.ctx.destination);
         source.start();
      });
   }

   async playForStroke(type: StrokeType): Promise<void> {
      const buf = this.pickBuffer(type);
      if(!buf) return;

      await this.ensureRunning();
      if(this.contextState() !== 'running') return;

      const source = this.ctx.createBufferSource();
      source.buffer = buf;
      source.connect(this.ctx.destination);
      source.start();
   }

   // ── Buffer selection ──────────────────────────────────────────────────────

   private pickBuffer(type: StrokeType): AudioBuffer | null {
      const primary = this.readyBuffers(type);
      if(primary.length > 0) return randomPick(primary);

      // Fallback: stroke-type clips from other types (not scribble)
      const strokeUrls = [
         ...(this.config.straight ?? []),
         ...(this.config.curve    ?? []),
         ...(this.config.sharp    ?? []),
      ];
      const all = strokeUrls
         .map(url => this.buffers.get(url) ?? null)
         .filter((b): b is AudioBuffer => b !== null);
      return all.length > 0 ? randomPick(all) : null;
   }

   private readyBuffers(type: StrokeType): AudioBuffer[] {
      const urls = this.config[type] ?? [];
      return urls
         .map(url => this.buffers.get(url) ?? null)
         .filter((b): b is AudioBuffer => b !== null);
   }

   // ── AudioContext guard ────────────────────────────────────────────────────

   private contextState(): AudioContextState {
      return this.ctx.state;
   }

   private async ensureRunning(): Promise<void> {
      if(this.ctx.state === 'running') return;

      this.ctx.resume();
      await new Promise<void>(resolve => setTimeout(resolve, 50));

      if(this.contextState() !== 'running' && !this.suspendWarned) {
         console.warn('[SoundEngine] AudioContext remains suspended — audio will not play. Trigger sound from a user gesture.');
         this.suspendWarned = true;
      }
   }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function randomPick<T>(arr: T[]): T {
   return arr[Math.floor(Math.random() * arr.length)];
}
