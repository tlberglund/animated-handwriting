import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { HandwritingAnimator } from 'handwriting-playback';
import type { GlyphSet } from 'handwriting-playback';
import type { HandwritingHandle, HandwritingProps } from './types';

export const Handwriting = forwardRef<HandwritingHandle, HandwritingProps>(
  function Handwriting(props, ref) {
    const {
      glyphSet,
      text,
      speed,
      color,
      capHeight,
      topPad,
      minWidth,
      maxWidth,
      letterGap,
      wordGap,
      playOn = 'visible',
      onComplete,
      onError,
      className,
      style,
    } = props;

    const [resolvedGlyphSet, setResolvedGlyphSet] = useState<GlyphSet | null>(
      typeof glyphSet === 'string' ? null : glyphSet
    );

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hasPlayedRef = useRef(false);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const cancelRef = useRef<(() => void) | null>(null);

    // Fetch when glyphSet is a URL
    useEffect(() => {
      if (typeof glyphSet !== 'string') {
        setResolvedGlyphSet(glyphSet);
        return;
      }
      let cancelled = false;
      fetch(glyphSet)
        .then((r) => {
          if (!r.ok) throw new Error(`Failed to fetch glyph set: ${r.status}`);
          return r.json() as Promise<GlyphSet>;
        })
        .then((data) => { if (!cancelled) setResolvedGlyphSet(data); })
        .catch((err) => {
          if (!cancelled) {
            if (onError) onError(err);
            else console.warn('[handwriting-react] Failed to load glyph set:', err);
          }
        });
      return () => { cancelled = true; };
    }, [glyphSet]); // eslint-disable-line react-hooks/exhaustive-deps

    function triggerPlay(data: GlyphSet) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
        console.warn('[handwriting-react] Canvas has zero dimensions; skipping animation.');
        return;
      }

      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }

      hasPlayedRef.current = true;

      const animator = new HandwritingAnimator(canvas, data);
      const promise = animator.write(text, {
        speed, color, capHeight, topPad, minWidth, maxWidth, letterGap, wordGap,
      });

      cancelRef.current = () => { canvas.width = canvas.width; };

      promise.then(() => {
        cancelRef.current = null;
        onComplete?.();
      });
    }

    // Set up observer or play on mount — runs once after data resolves
    useEffect(() => {
      if (!resolvedGlyphSet || hasPlayedRef.current) return;

      if (playOn === 'mount') {
        triggerPlay(resolvedGlyphSet);
        return;
      }

      // playOn === 'visible'
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (typeof IntersectionObserver === 'undefined') {
        triggerPlay(resolvedGlyphSet);
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          observerRef.current = null;
          triggerPlay(resolvedGlyphSet);
        }
      });

      observerRef.current = observer;
      observer.observe(canvas);

      return () => {
        observer.disconnect();
        observerRef.current = null;
      };
    }, [resolvedGlyphSet]); // eslint-disable-line react-hooks/exhaustive-deps

    // Prop-change replay after initial play
    useEffect(() => {
      if (!resolvedGlyphSet || !hasPlayedRef.current) return;
      triggerPlay(resolvedGlyphSet);
    }, [resolvedGlyphSet, text]); // eslint-disable-line react-hooks/exhaustive-deps

    // Imperative handle
    useImperativeHandle(ref, () => ({
      play() {
        if (!resolvedGlyphSet) return;
        hasPlayedRef.current = true;
        triggerPlay(resolvedGlyphSet);
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

    return (
      <div className={className} style={{ ...style, position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>
    );
  }
);
