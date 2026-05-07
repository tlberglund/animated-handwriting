import { SoundConfig, StrokeType } from './types';
export declare class SoundEngine {
    private ctx;
    private config;
    private buffers;
    private suspendWarned;
    constructor(ctx: AudioContext, config: SoundConfig);
    preload(): Promise<void>;
    private loadUrl;
    isScribbleMode(meanStrokeDurationMs: number): boolean;
    private shortestStrokeClipDuration;
    playScribble(): void;
    playForStroke(type: StrokeType): Promise<void>;
    private pickBuffer;
    private readyBuffers;
    private contextState;
    private ensureRunning;
}
