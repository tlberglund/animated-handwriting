export interface ExportPoint {
    /** Normalized x: 0.0 = left edge of glyph, increases rightward */
    x: number;
    /** Normalized y: 0.0 = cap-height, 1.0 = baseline, ~1.25 = descender */
    y: number;
    /** Milliseconds from start of first stroke of this capture */
    t: number;
    /** Pressure 0.0–1.0 */
    p: number;
}
export interface ExportCapture {
    id: string;
    /** Width in cap-height units (includes any scale adjustment baked in at export) */
    width: number;
    strokes: ExportPoint[][];
}
export interface ExportGlyph {
    character: string;
    captures: ExportCapture[];
}
export interface GlyphSet {
    version: number;
    captureSetName: string;
    glyphs: Record<string, ExportGlyph>;
}
export type StrokeType = 'straight' | 'curve' | 'sharp';
export interface SoundConfig {
    /** MP3 URLs to play for straight-line strokes */
    straight?: string[];
    /** MP3 URLs to play for curved strokes */
    curve?: string[];
    /** MP3 URLs to play for sharp-angle strokes */
    sharp?: string[];
    /** MP3 URLs for high-speed fallback: one clip plays for the full redraw duration */
    scribble?: string[];
    /** Angular thresholds in degrees (default: straight=15, sharp=60) */
    thresholds?: {
        straight: number;
        sharp: number;
    };
}
export interface WriteOptions {
    /** Speed multiplier. Default 1.5 */
    speed?: number;
    /** Stroke color. Default '#1a1a1a' */
    color?: string;
    /** Minimum stroke width in px. Default 2 */
    minWidth?: number;
    /** Maximum stroke width in px. Default 4 */
    maxWidth?: number;
    /** Canvas pixel density multiplier. Default 2 */
    scale?: number;
    /** Gap between letters in cap-height units. Default 0.05 */
    letterGap?: number;
    /** Gap between words (space character) in cap-height units. Default 0.35 */
    wordGap?: number;
    /** Cap-height in canvas CSS pixels. Default 80 */
    capHeight?: number;
    /** Vertical offset in CSS pixels from the top of the canvas to the cap-height line. Default 12 */
    topPad?: number;
    /** Sound clips to play during stroke rendering. Pass `true` to use bundled defaults. */
    sounds?: SoundConfig | true;
}
export interface SequencedGlyph {
    character: string;
    capture: ExportCapture;
    xOffset: number;
}
