'use client';

import { useEffect, useRef } from 'react';

interface CelebrationCanvasProps {
  durationMs?: number;
  particleCount?: number;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

const CELEBRATION_COLORS = [
  '#2563EB', // Cobalt Blue
  '#3B82F6', // Blue 500
  '#10B981', // Emerald
  '#F59E0B', // Amber / Gold
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
];

export function CelebrationCanvas({
  durationMs = 4000,
  particleCount = 90,
  onComplete,
}: CelebrationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isCancelled = false;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = [];
    const originX = canvas.width / 2;
    const originY = Math.min(canvas.height * 0.35, 300);

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * Math.PI) - Math.PI / 2; // -90 to +90 deg upwards
      const speed = Math.random() * 12 + 6;
      particles.push({
        x: originX + (Math.random() * 100 - 50),
        y: originY,
        vx: Math.sin(angle) * speed + (Math.random() * 4 - 2),
        vy: -Math.cos(angle) * speed - (Math.random() * 5 + 4),
        w: Math.random() * 8 + 6,
        h: Math.random() * 5 + 4,
        color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    const startTime = performance.now();

    const loop = (now: number) => {
      if (isCancelled) return;

      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gravity = 0.38;
      const drag = 0.985;

      particles.forEach((p) => {
        p.vx *= drag;
        p.vy = p.vy * drag + gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (progress > 0.65) {
          p.opacity = Math.max(0, 1 - (progress - 0.65) / 0.35);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (progress < 1) {
        animId = requestAnimationFrame(loop);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onComplete) onComplete();
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [durationMs, particleCount, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  );
}
