import type { GlyphSet, SoundConfig } from '@tlberglund/handwriting-playback';
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
  /** Pass `true` to use bundled default sounds, or a SoundConfig for custom clips. */
  sounds?: SoundConfig | true;
  playOn?: 'visible' | 'mount';
  onComplete?: () => void;
  onError?: (err: Error) => void;
  className?: string;
  style?: CSSProperties;
}

export interface HandwritingHandle {
  play(): void;
}
