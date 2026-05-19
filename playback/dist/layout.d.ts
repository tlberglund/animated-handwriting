import { GlyphSet, HandwritingLayout, HandwritingLayoutOptions } from './types';
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
export declare function prepareLayout(glyphSet: GlyphSet, text: string, opts?: HandwritingLayoutOptions, lastUsed?: Map<string, string>): HandwritingLayout;
