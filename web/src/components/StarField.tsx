'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

/**
 * Subtle animated star field background using Canvas.
 * Designed to be a very light decorative accent, not the main visual.
 */
export function StarField({
  starCount = 40,
  className = '',
}: {
  starCount?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = canvas!.offsetWidth * dpr;
      canvas!.height = canvas!.offsetHeight * dpr;
      ctx!.scale(dpr, dpr);
    }

    function generateStars() {
      starsRef.current = Array.from({ length: starCount }, () => ({
        x: Math.random() * canvas!.offsetWidth,
        y: Math.random() * canvas!.offsetHeight,
        size: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.4 + 0.05,
        twinkleSpeed: Math.random() * 0.015 + 0.003,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));
    }

    function draw(time: number) {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);

      for (const star of starsRef.current) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
        const alpha = star.opacity * (0.3 + twinkle * 0.7);
        const size = star.size * (0.85 + twinkle * 0.3);

        ctx!.beginPath();
        ctx!.arc(star.x, star.y, size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx!.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    resize();
    generateStars();
    animRef.current = requestAnimationFrame(draw);

    const handleResize = () => {
      resize();
      generateStars();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [starCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Lightweight CSS-only decorative dots.
 * Use when canvas is too heavy (e.g. dashboard cards).
 */
export function CosmicDust({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <span className="absolute h-1 w-1 rounded-full bg-white/20 animate-twinkle" style={{ top: '15%', left: '10%', animationDelay: '0s' }} />
      <span className="absolute h-0.5 w-0.5 rounded-full bg-white/15 animate-twinkle" style={{ top: '25%', right: '15%', animationDelay: '1.2s' }} />
      <span className="absolute h-1 w-1 rounded-full bg-white/10 animate-twinkle-slow" style={{ bottom: '20%', left: '22%', animationDelay: '2.5s' }} />
      <span className="absolute h-0.5 w-0.5 rounded-full bg-white/20 animate-twinkle" style={{ top: '45%', right: '8%', animationDelay: '0.7s' }} />
      <span className="absolute h-1 w-1 rounded-full bg-white/15 animate-twinkle-slow" style={{ bottom: '30%', right: '28%', animationDelay: '1.8s' }} />
    </div>
  );
}
