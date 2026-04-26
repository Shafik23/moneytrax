import React, { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

export interface StreamPath {
  id: string;
  from: Point;
  to: Point;
  color: string;
  active: boolean;
}

interface AnimatedStreamProps {
  paths: StreamPath[];
}

interface FlowLane {
  offset: number;
  speed: number;
  width: number;
  phase: number;
}

interface Curve {
  from: Point;
  to: Point;
  cp1: Point;
  cp2: Point;
  perpX: number;
  perpY: number;
  distance: number;
}

const lanes: FlowLane[] = [
  { offset: -5, speed: 0.00014, width: 2, phase: 0.05 },
  { offset: 5, speed: 0.00018, width: 2.6, phase: 0.48 },
];

const colorCache = new Map<string, (alpha: number) => string>();

const getColor = (color: string) => {
  const cachedColor = colorCache.get(color);
  if (cachedColor) return cachedColor;

  const normalizedColor = color.replace('#', '');
  const red = parseInt(normalizedColor.slice(0, 2), 16);
  const green = parseInt(normalizedColor.slice(2, 4), 16);
  const blue = parseInt(normalizedColor.slice(4, 6), 16);
  const rgba = (alpha: number) => `rgba(${red}, ${green}, ${blue}, ${alpha})`;

  colorCache.set(color, rgba);
  return rgba;
};

const getCurve = (from: Point, to: Point): Curve | null => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 1) return null;

  const curveFactor = Math.min(120, Math.max(38, distance * 0.2));
  const perpX = -dy / distance;
  const perpY = dx / distance;

  return {
    from,
    to,
    distance,
    perpX,
    perpY,
    cp1: {
      x: from.x + dx * 0.34 + perpX * curveFactor,
      y: from.y + dy * 0.34 + perpY * curveFactor,
    },
    cp2: {
      x: from.x + dx * 0.66 + perpX * curveFactor,
      y: from.y + dy * 0.66 + perpY * curveFactor,
    },
  };
};

const getPointOnCurve = (curve: Curve, progress: number) => {
  const t2 = progress * progress;
  const t3 = t2 * progress;
  const mt = 1 - progress;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;

  return {
    x: mt3 * curve.from.x + 3 * mt2 * progress * curve.cp1.x + 3 * mt * t2 * curve.cp2.x + t3 * curve.to.x,
    y: mt3 * curve.from.y + 3 * mt2 * progress * curve.cp1.y + 3 * mt * t2 * curve.cp2.y + t3 * curve.to.y,
  };
};

const drawCurve = (ctx: CanvasRenderingContext2D, curve: Curve, offset: number) => {
  ctx.beginPath();

  for (let i = 0; i <= 28; i++) {
    const point = getPointOnCurve(curve, i / 28);
    const x = point.x + curve.perpX * offset;
    const y = point.y + curve.perpY * offset;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
};

const drawFlowSegment = (
  ctx: CanvasRenderingContext2D,
  curve: Curve,
  rgba: (alpha: number) => string,
  headProgress: number,
  length: number,
  offset: number,
  width: number,
) => {
  const steps = 10;

  for (let i = 0; i < steps; i++) {
    const segmentStart = Math.max(0, headProgress - length + (length * i) / steps);
    const segmentEnd = Math.max(0, headProgress - length + (length * (i + 1)) / steps);
    if (segmentEnd <= 0 || segmentStart >= 1) continue;

    const fade = i / steps;
    const start = getPointOnCurve(curve, segmentStart);
    const end = getPointOnCurve(curve, segmentEnd);

    ctx.strokeStyle = rgba(0.7 * fade * fade);
    ctx.lineWidth = width * (0.4 + fade);
    ctx.beginPath();
    ctx.moveTo(start.x + curve.perpX * offset, start.y + curve.perpY * offset);
    ctx.lineTo(end.x + curve.perpX * offset, end.y + curve.perpY * offset);
    ctx.stroke();
  }
};

export const AnimatedStream: React.FC<AnimatedStreamProps> = ({ paths }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const pathsRef = useRef<StreamPath[]>(paths);
  const lastFrameRef = useRef<number>(0);

  useEffect(() => {
    pathsRef.current = paths;
  }, [paths]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.floor(window.innerWidth * pixelRatio);
      canvas.height = Math.floor(window.innerHeight * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const drawPath = (path: StreamPath, timestamp: number) => {
      if (!path.active) return;

      const curve = getCurve(path.from, path.to);
      if (!curve) return;

      const rgba = getColor(path.color);
      const gradient = ctx.createLinearGradient(path.from.x, path.from.y, path.to.x, path.to.y);
      gradient.addColorStop(0, rgba(0.03));
      gradient.addColorStop(0.35, rgba(0.16));
      gradient.addColorStop(0.75, rgba(0.2));
      gradient.addColorStop(1, rgba(0.04));

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 9;
      ctx.shadowBlur = 8;
      ctx.shadowColor = rgba(0.24);
      drawCurve(ctx, curve, 0);

      ctx.shadowBlur = 0;
      ctx.strokeStyle = rgba(0.18);
      ctx.lineWidth = 1.8;
      drawCurve(ctx, curve, 0);

      lanes.forEach((lane) => {
        for (let i = 0; i < 2; i++) {
          const progress = (timestamp * lane.speed + lane.phase + i / 2) % 1;
          const pulseLength = Math.min(0.2, Math.max(0.11, 85 / curve.distance));

          drawFlowSegment(
            ctx,
            curve,
            rgba,
            progress,
            pulseLength,
            lane.offset,
            lane.width,
          );
        }
      });
    };

    const animate = (timestamp: number) => {
      if (timestamp - lastFrameRef.current < 33) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      lastFrameRef.current = timestamp;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      pathsRef.current.forEach((path) => drawPath(path, timestamp));
      ctx.shadowBlur = 0;
      animationRef.current = requestAnimationFrame(animate);
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', setCanvasSize);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};
