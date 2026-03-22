import type { GlyphSet } from 'handwriting-playback';
import type { CSSProperties } from 'react';

export interface HandwritingProps {
  glyphSet: GlyphSet | string;
  text: string;
  speed?: number;
  color?: string;
  capHeight?: number;
  topPad?: number;
  minWidth?: number;
  maxWidth?: number;
  letterGap?: number;
  wordGap?: number;
  playOn?: 'visible' | 'mount';
  onComplete?: () => void;
  onError?: (err: Error) => void;
  className?: string;
  style?: CSSProperties;
}

export interface HandwritingHandle {
  play(): void;
}
