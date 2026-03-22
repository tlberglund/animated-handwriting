import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { DiagramAnimator } from 'diagram-playback';
import type { DiagramExport } from 'diagram-playback';
import type { DiagramHandle, DiagramProps } from './types';

export const Diagram = forwardRef<DiagramHandle, DiagramProps>(
  function Diagram(props, ref) {
    const {
      diagram,
      speed,
      color,
      minWidth,
      maxWidth,
      playOn = 'visible',
      onComplete,
      onError,
      className,
      style,
    } = props;

    const [resolvedDiagram, setResolvedDiagram] = useState<DiagramExport | null>(
      typeof diagram === 'string' ? null : diagram
    );

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hasPlayedRef = useRef(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const cancelRef = useRef<(() => void) | null>(null);

    // Fetch when diagram is a URL
    useEffect(() => {
      if (typeof diagram !== 'string') {
        setResolvedDiagram(diagram);
        return;
      }
      let cancelled = false;
      fetch(diagram)
        .then((r) => {
          if (!r.ok) throw new Error(`Failed to fetch diagram: ${r.status}`);
          return r.json() as Promise<DiagramExport>;
        })
        .then((data) => { if (!cancelled) setResolvedDiagram(data); })
        .catch((err) => {
          if (!cancelled) {
            if (onError) onError(err);
            else console.warn('[diagram-react] Failed to load diagram:', err);
          }
        });
      return () => { cancelled = true; };
    }, [diagram]); // eslint-disable-line react-hooks/exhaustive-deps

    function triggerPlay(data: DiagramExport) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }

      hasPlayedRef.current = true;

      const animator = new DiagramAnimator(canvas, data);
      const promise = animator.play({ speed, color, minWidth, maxWidth });

      cancelRef.current = () => { canvas.width = canvas.width; };

      promise.then(() => {
        cancelRef.current = null;
        onComplete?.();
      });
    }

    // Set up observer or play on mount — runs once after data resolves
    useEffect(() => {
      if (!resolvedDiagram || hasPlayedRef.current) return;

      if (playOn === 'mount') {
        triggerPlay(resolvedDiagram);
        return;
      }

      // playOn === 'visible'
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (typeof IntersectionObserver === 'undefined') {
        triggerPlay(resolvedDiagram);
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          observerRef.current = null;
          triggerPlay(resolvedDiagram);
        }
      });

      observerRef.current = observer;
      observer.observe(canvas);

      return () => {
        observer.disconnect();
        observerRef.current = null;
      };
    }, [resolvedDiagram]); // eslint-disable-line react-hooks/exhaustive-deps

    // Prop-change replay after initial play
    useEffect(() => {
      if (!resolvedDiagram || !hasPlayedRef.current) return;
      triggerPlay(resolvedDiagram);
    }, [resolvedDiagram]); // eslint-disable-line react-hooks/exhaustive-deps

    // Imperative handle
    useImperativeHandle(ref, () => ({
      play() {
        if (!resolvedDiagram) return;
        hasPlayedRef.current = true;
        triggerPlay(resolvedDiagram);
      },
    }));

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        observerRef.current?.disconnect();
        if (cancelRef.current) {
          cancelRef.current();
          cancelRef.current = null;
        }
      };
    }, []);

    if (!resolvedDiagram) return null;

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          display: 'block',
          aspectRatio: String(resolvedDiagram.aspectRatio),
          ...style,
        }}
      />
    );
  }
);
