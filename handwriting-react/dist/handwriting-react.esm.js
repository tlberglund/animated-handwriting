// src/Handwriting.tsx
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import { HandwritingAnimator } from "@tlberglund/handwriting-playback";
import { jsx } from "react/jsx-runtime";
var Handwriting = forwardRef(
  function Handwriting2(props, ref) {
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
      playOn = "visible",
      onComplete,
      onError,
      className,
      style
    } = props;
    const [resolvedGlyphSet, setResolvedGlyphSet] = useState(
      typeof glyphSet === "string" ? null : glyphSet
    );
    const canvasRef = useRef(null);
    const hasPlayedRef = useRef(false);
    const observerRef = useRef(null);
    const cancelRef = useRef(null);
    useEffect(() => {
      if (typeof glyphSet !== "string") {
        setResolvedGlyphSet(glyphSet);
        return;
      }
      let cancelled = false;
      fetch(glyphSet).then((r) => {
        if (!r.ok)
          throw new Error(`Failed to fetch glyph set: ${r.status}`);
        return r.json();
      }).then((data) => {
        if (!cancelled)
          setResolvedGlyphSet(data);
      }).catch((err) => {
        if (!cancelled) {
          if (onError)
            onError(err);
          else
            console.warn("[handwriting-react] Failed to load glyph set:", err);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [glyphSet]);
    function triggerPlay(data) {
      const canvas = canvasRef.current;
      if (!canvas)
        return;
      if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
        console.warn("[handwriting-react] Canvas has zero dimensions; skipping animation.");
        return;
      }
      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }
      hasPlayedRef.current = true;
      const animator = new HandwritingAnimator(canvas, data);
      const promise = animator.write(text, {
        speed,
        color,
        capHeight,
        topPad,
        minWidth,
        maxWidth,
        letterGap,
        wordGap
      });
      cancelRef.current = () => {
        canvas.width = canvas.width;
      };
      promise.then(() => {
        cancelRef.current = null;
        onComplete?.();
      });
    }
    useEffect(() => {
      if (!resolvedGlyphSet || hasPlayedRef.current)
        return;
      if (playOn === "mount") {
        triggerPlay(resolvedGlyphSet);
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas)
        return;
      if (typeof IntersectionObserver === "undefined") {
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
    }, [resolvedGlyphSet]);
    useEffect(() => {
      if (!resolvedGlyphSet || !hasPlayedRef.current)
        return;
      triggerPlay(resolvedGlyphSet);
    }, [resolvedGlyphSet, text]);
    useImperativeHandle(ref, () => ({
      play() {
        if (!resolvedGlyphSet)
          return;
        hasPlayedRef.current = true;
        triggerPlay(resolvedGlyphSet);
      }
    }));
    useEffect(() => {
      return () => {
        observerRef.current?.disconnect();
        if (cancelRef.current) {
          cancelRef.current();
          cancelRef.current = null;
        }
      };
    }, []);
    return /* @__PURE__ */ jsx("div", { className, style: { ...style, position: "relative" }, children: /* @__PURE__ */ jsx(
      "canvas",
      {
        ref: canvasRef,
        style: { display: "block", width: "100%", height: "100%" }
      }
    ) });
  }
);
export {
  Handwriting
};
