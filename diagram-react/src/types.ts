import type { DiagramExport } from 'diagram-playback';
import type { CSSProperties } from 'react';

export interface DiagramProps {
  diagram: DiagramExport | string;
  speed?: number;
  color?: string;
  minWidth?: number;
  maxWidth?: number;
  playOn?: 'visible' | 'mount';
  onComplete?: () => void;
  onError?: (err: Error) => void;
  className?: string;
  style?: CSSProperties;
}

export interface DiagramHandle {
  play(): void;
}
