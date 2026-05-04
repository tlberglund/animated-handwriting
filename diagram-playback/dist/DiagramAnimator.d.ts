import { DiagramExport, DiagramPlayOptions } from './types';
export declare class DiagramAnimator {
    private canvas;
    private ctx;
    private diagram;
    constructor(canvas: HTMLCanvasElement, diagram: DiagramExport);
    play(options?: DiagramPlayOptions): Promise<void>;
    private resolveOptions;
    private prepareCanvas;
    private computeFitRect;
    private smoothPoints;
    private animate;
    private drawSegment;
}
