export interface NormalizedPoint {
   x: number;  // [0, 1]
   y: number;  // [0, 1]
   t: number;  // timestamp ms
   p: number;  // pressure [0, 1]
}

export interface DiagramExport {
   version: number;
   name: string;
   aspectRatio: number;
   strokes: NormalizedPoint[][];
}

export interface DiagramPlayOptions {
   speed?: number;    // default 1.5
   color?: string;    // default '#1a1a1a'
   minWidth?: number; // default 1.5
   maxWidth?: number; // default 3
   scale?: number;    // device pixel ratio; default 2
}
