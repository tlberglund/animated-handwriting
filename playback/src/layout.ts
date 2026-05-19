import { GlyphSet, ExportCapture, SequencedGlyph, HandwritingLayout, HandwritingLayoutOptions } from './types';

function tokenize(glyphSet: GlyphSet, text: string): string[] {
   const ligatures = Object.keys(glyphSet.glyphs)
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

function pickCapture(
   character: string,
   captures: ExportCapture[],
   lastUsed: Map<string, string>,
): ExportCapture | null {
   if(captures.length === 0) return null;
   if(captures.length === 1) return captures[0];

   const lastId    = lastUsed.get(character);
   const candidates = lastId
      ? captures.filter(c => c.id !== lastId)
      : captures;

   const pool   = candidates.length > 0 ? candidates : captures;
   const chosen = pool[Math.floor(Math.random() * pool.length)];
   lastUsed.set(character, chosen.id);
   return chosen;
}

/**
 * Build a frozen HandwritingLayout from a glyph set and text string.
 * Capture selection is randomized once here and then locked in.
 *
 * @param glyphSet      The loaded GlyphSet JSON.
 * @param text          The string to lay out.
 * @param opts          Optional layout options (letterGap, wordGap).
 * @param lastUsed      Optional shared capture-history map; pass the animator's
 *                      internal map to preserve cross-call anti-repeat behavior.
 */
export function prepareLayout(
   glyphSet: GlyphSet,
   text: string,
   opts?: HandwritingLayoutOptions,
   lastUsed?: Map<string, string>,
): HandwritingLayout {
   const letterGap = opts?.letterGap ?? 0.05;
   const wordGap   = opts?.wordGap   ?? 0.35;
   const luc       = lastUsed ?? new Map<string, string>();

   const tokens   = tokenize(glyphSet, text);
   const sequence: SequencedGlyph[] = [];
   let xOffset = 0;

   for(const token of tokens) {
      if(token === ' ') { xOffset += wordGap; continue; }

      const glyph = glyphSet.glyphs[token];
      if(!glyph) {
         console.warn(`[handwriting-playback] No capture for character: "${token}" — skipping`);
         continue;
      }

      const capture = pickCapture(token, glyph.captures, luc);
      if(!capture) continue;

      sequence.push({ character: token, capture, xOffset });
      xOffset += capture.width + letterGap;
   }

   // Subtract the trailing letterGap added after the last glyph
   const width = sequence.length > 0 ? xOffset - letterGap : 0;

   return new HandwritingLayout(sequence, width);
}
