export interface NormalizedPoint {
    x: number;
    y: number;
    t: number;
    p: number;
}
export interface DiagramExport {
    version: number;
    name: string;
    aspectRatio: number;
    strokes: NormalizedPoint[][];
}
export interface DiagramPlayOptions {
    speed?: number;
    color?: string;
    minWidth?: number;
    maxWidth?: number;
    scale?: number;
    /** When true, draw all strokes synchronously in one frame with no animation delay. */
    instant?: boolean;
}
