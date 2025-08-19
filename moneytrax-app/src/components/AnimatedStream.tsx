import React, { useEffect, useRef } from 'react';

interface AnimatedStreamProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  active: boolean;
}

interface Particle {
  progress: number;
  size: number;
  speed: number;
  offset: number;
}

export const AnimatedStream: React.FC<AnimatedStreamProps> = ({
  from,
  to,
  color,
  active,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!canvasRef.current || !active) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate bezier curve control points for smooth flow
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Create control points for a nice curve
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    
    // Curve the path based on direction
    const curveFactor = distance * 0.2;
    const perpX = -dy / distance;
    const perpY = dx / distance;
    
    const cp1x = midX + perpX * curveFactor;
    const cp1y = midY + perpY * curveFactor;

    // Initialize particles with staggered starts
    if (particlesRef.current.length === 0) {
      const particleCount = Math.min(8, Math.max(3, Math.floor(distance / 80)));
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          progress: (i / particleCount) * 1.0,
          size: Math.random() * 3 + 2,
          speed: 0.003 + Math.random() * 0.002,
          offset: Math.random() * 10 - 5,
        });
      }
    }

    // Bezier curve function
    const getPointOnCurve = (t: number) => {
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      
      const x = mt3 * from.x + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp1x + t3 * to.x;
      const y = mt3 * from.y + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp1y + t3 * to.y;
      
      return { x, y };
    };

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the base path with gradient
      const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      gradient.addColorStop(0, color + '20');
      gradient.addColorStop(0.5, color + '40');
      gradient.addColorStop(1, color + '20');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.quadraticCurveTo(cp1x, cp1y, to.x, to.y);
      ctx.stroke();

      // Animate particles along the curve
      particlesRef.current.forEach((particle) => {
        // Update particle progress
        particle.progress += particle.speed * (deltaTime / 16);
        if (particle.progress > 1) {
          particle.progress = 0;
          particle.size = Math.random() * 3 + 2;
          particle.speed = 0.003 + Math.random() * 0.002;
        }

        const point = getPointOnCurve(particle.progress);
        
        // Add slight offset perpendicular to path for variation
        const offsetX = perpX * particle.offset;
        const offsetY = perpY * particle.offset;
        
        const particleX = point.x + offsetX;
        const particleY = point.y + offsetY;

        // Calculate opacity based on progress (fade in and out)
        let opacity = 1;
        if (particle.progress < 0.1) {
          opacity = particle.progress / 0.1;
        } else if (particle.progress > 0.9) {
          opacity = (1 - particle.progress) / 0.1;
        }

        // Draw particle with glow effect
        const particleSize = particle.size * (1 + Math.sin(timestamp * 0.001 + particle.progress * Math.PI * 2) * 0.2);
        
        // Outer glow
        ctx.globalAlpha = opacity * 0.2;
        const glowGradient = ctx.createRadialGradient(
          particleX, particleY, 0,
          particleX, particleY, particleSize * 4
        );
        glowGradient.addColorStop(0, color);
        glowGradient.addColorStop(1, color + '00');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(
          particleX - particleSize * 4,
          particleY - particleSize * 4,
          particleSize * 8,
          particleSize * 8
        );

        // Inner core
        ctx.globalAlpha = opacity * 0.8;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        ctx.fill();

        // Bright center
        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Trail effect
        if (particle.progress > 0.05) {
          const trailLength = 5;
          for (let i = 1; i <= trailLength; i++) {
            const trailProgress = Math.max(0, particle.progress - (i * 0.02));
            const trailPoint = getPointOnCurve(trailProgress);
            const trailX = trailPoint.x + offsetX;
            const trailY = trailPoint.y + offsetY;
            const trailOpacity = opacity * (1 - i / trailLength) * 0.3;
            const trailSize = particleSize * (1 - i / trailLength);
            
            ctx.globalAlpha = trailOpacity;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      particlesRef.current = [];
      lastTimeRef.current = 0;
    };
  }, [from, to, color, active]);

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};