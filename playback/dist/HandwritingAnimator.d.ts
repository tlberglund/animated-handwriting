import { GlyphSet, WriteOptions, HandwritingLayout, HandwritingLayoutOptions } from './types';
export declare class HandwritingAnimator {
    private glyphSet;
    private canvas;
    private ctx;
    private lastUsedCapture;
    private audioCtx;
    constructor(canvas: HTMLCanvasElement, glyphSet: GlyphSet);
    write(text: string, options?: WriteOptions): Promise<void>;
    write(layout: HandwritingLayout, options?: WriteOptions): Promise<void>;
    prepare(text: string, opts?: HandwritingLayoutOptions): HandwritingLayout;
    private resolveOptions;
    private prepareCanvas;
    private buildSequence;
    private meanStrokeDuration;
    private smoothPoints;
    private drawInstant;
    private animate;
    private drawSegment;
}
