import { GlyphSet, WriteOptions } from './types';
export declare class HandwritingAnimator {
    private glyphSet;
    private canvas;
    private ctx;
    private lastUsedCapture;
    constructor(canvas: HTMLCanvasElement, glyphSet: GlyphSet);
    write(text: string, options?: WriteOptions): Promise<void>;
    private resolveOptions;
    private prepareCanvas;
    private tokenize;
    private buildSequence;
    private pickCapture;
    private smoothPoints;
    private animate;
    private drawSegment;
}
