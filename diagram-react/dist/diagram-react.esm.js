// src/Diagram.tsx
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import { DiagramAnimator } from "@tlberglund/diagram-playback";
import { jsx } from "react/jsx-runtime";
var Diagram = forwardRef(
  function Diagram2(props, ref) {
    const {
      diagram,
      speed,
      color,
      minWidth,
      maxWidth,
      playOn = "visible",
      onComplete,
      onError,
      className,
      style
    } = props;
    const [resolvedDiagram, setResolvedDiagram] = useState(
      typeof diagram === "string" ? null : diagram
    );
    const canvasRef = useRef(null);
    const hasPlayedRef = useRef(false);
    const observerRef = useRef(null);
    const cancelRef = useRef(null);
    useEffect(() => {
      if (typeof diagram !== "string") {
        setResolvedDiagram(diagram);
        return;
      }
      let cancelled = false;
      fetch(diagram).then((r) => {
        if (!r.ok)
          throw new Error(`Failed to fetch diagram: ${r.status}`);
        return r.json();
      }).then((data) => {
        if (!cancelled)
          setResolvedDiagram(data);
      }).catch((err) => {
        if (!cancelled) {
          if (onError)
            onError(err);
          else
            console.warn("[diagram-react] Failed to load diagram:", err);
        }
      });
      return () => {
        cancelled = true;
      };
    }, [diagram]);
    function triggerPlay(data) {
      const canvas = canvasRef.current;
      if (!canvas)
        return;
      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }
      hasPlayedRef.current = true;
      const animator = new DiagramAnimator(canvas, data);
      const promise = animator.play({ speed, color, minWidth, maxWidth });
      cancelRef.current = () => {
        canvas.width = canvas.width;
      };
      promise.then(() => {
        cancelRef.current = null;
        onComplete?.();
      });
    }
    useEffect(() => {
      if (!resolvedDiagram || hasPlayedRef.current)
        return;
      if (playOn === "mount") {
        triggerPlay(resolvedDiagram);
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas)
        return;
      if (typeof IntersectionObserver === "undefined") {
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
    }, [resolvedDiagram]);
    useEffect(() => {
      if (!resolvedDiagram || !hasPlayedRef.current)
        return;
      triggerPlay(resolvedDiagram);
    }, [resolvedDiagram]);
    useImperativeHandle(ref, () => ({
      play() {
        if (!resolvedDiagram)
          return;
        hasPlayedRef.current = true;
        triggerPlay(resolvedDiagram);
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
    if (!resolvedDiagram)
      return null;
    return /* @__PURE__ */ jsx(
      "canvas",
      {
        ref: canvasRef,
        className,
        style: {
          display: "block",
          aspectRatio: String(resolvedDiagram.aspectRatio),
          ...style
        }
      }
    );
  }
);
export {
  Diagram
};
