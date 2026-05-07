import { ExportPoint, StrokeType } from './types';

const DEFAULT_STRAIGHT_THRESHOLD = 15;
const DEFAULT_SHARP_THRESHOLD    = 60;

const DEG = Math.PI / 180;

export function classifyStroke(
   points: ExportPoint[],
   straightThreshold = DEFAULT_STRAIGHT_THRESHOLD,
   sharpThreshold    = DEFAULT_SHARP_THRESHOLD,
): StrokeType {
   if(points.length < 3) return 'straight';

   let maxAngle = 0;

   for(let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];

      // Direction vectors
      const ax = curr.x - prev.x;
      const ay = curr.y - prev.y;
      const bx = next.x - curr.x;
      const by = next.y - curr.y;

      const magA = Math.sqrt(ax * ax + ay * ay);
      const magB = Math.sqrt(bx * bx + by * by);

      // Skip degenerate zero-length segments
      if(magA < 1e-10 || magB < 1e-10) continue;

      const dot     = (ax * bx + ay * by) / (magA * magB);
      // Clamp to [-1, 1] to guard against floating-point overshoot
      const clamped = Math.max(-1, Math.min(1, dot));
      const angleDeg = Math.acos(clamped) / DEG;

      if(angleDeg > maxAngle) maxAngle = angleDeg;
   }

   if(maxAngle >= sharpThreshold)    return 'sharp';
   if(maxAngle >= straightThreshold) return 'curve';
   return 'straight';
}
