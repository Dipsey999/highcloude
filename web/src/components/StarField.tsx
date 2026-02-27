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
 * Animated star field background using Canvas.
 * Renders twinkling stars + optional nebula gradients.
 */
export function StarField({
  starCount = 80,
  className = '',
  showNebula = true,
}: {
  starCount?: number;
  className?: string;
  showNebula?: boolean;
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
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.7 + 0.1,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));
    }

    function draw(time: number) {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      ctx!.clearRect(0, 0, w, h);

      // Nebula clouds
      if (showNebula) {
        const g1 = ctx!.createRadialGradient(w * 0.2, h * 0.3, 0, w * 0.2, h * 0.3, w * 0.4);
        g1.addColorStop(0, 'rgba(124, 58, 237, 0.04)');
        g1.addColorStop(1, 'transparent');
        ctx!.fillStyle = g1;
        ctx!.fillRect(0, 0, w, h);

        const g2 = ctx!.createRadialGradient(w * 0.8, h * 0.6, 0, w * 0.8, h * 0.6, w * 0.35);
        g2.addColorStop(0, 'rgba(6, 182, 212, 0.03)');
        g2.addColorStop(1, 'transparent');
        ctx!.fillStyle = g2;
        ctx!.fillRect(0, 0, w, h);

        const g3 = ctx!.createRadialGradient(w * 0.5, h * 0.8, 0, w * 0.5, h * 0.8, w * 0.3);
        g3.addColorStop(0, 'rgba(236, 72, 153, 0.025)');
        g3.addColorStop(1, 'transparent');
        ctx!.fillStyle = g3;
        ctx!.fillRect(0, 0, w, h);
      }

      // Stars
      for (const star of starsRef.current) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5;
        const alpha = star.opacity * (0.3 + twinkle * 0.7);
        const size = star.size * (0.8 + twinkle * 0.4);

        ctx!.beginPath();
        ctx!.arc(star.x, star.y, size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx!.fill();

        // Glow for larger stars
        if (star.size > 1.5) {
          ctx!.beginPath();
          ctx!.arc(star.x, star.y, size * 2.5, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(167, 139, 250, ${alpha * 0.15})`;
          ctx!.fill();
        }
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
  }, [starCount, showNebula]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Lightweight CSS-only cosmic decorations.
 * Use when canvas is too heavy (e.g. dashboard cards).
 */
export function CosmicDust({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {/* Twinkling stars */}
      <span className="absolute h-1 w-1 rounded-full bg-white/30 animate-twinkle" style={{ top: '15%', left: '10%', animationDelay: '0s' }} />
      <span className="absolute h-0.5 w-0.5 rounded-full bg-white/20 animate-twinkle" style={{ top: '25%', right: '15%', animationDelay: '1.2s' }} />
      <span className="absolute h-1.5 w-1.5 rounded-full bg-white/15 animate-twinkle-slow" style={{ bottom: '20%', left: '22%', animationDelay: '2.5s' }} />
      <span className="absolute h-0.5 w-0.5 rounded-full bg-white/25 animate-twinkle" style={{ top: '45%', right: '8%', animationDelay: '0.7s' }} />
      <span className="absolute h-1 w-1 rounded-full bg-white/20 animate-twinkle-slow" style={{ bottom: '30%', right: '28%', animationDelay: '1.8s' }} />
      <span className="absolute h-1 w-1 rounded-full bg-[var(--star-gold)]/20 animate-twinkle" style={{ top: '10%', left: '55%', animationDelay: '3.2s' }} />
      <span className="absolute h-0.5 w-0.5 rounded-full bg-[var(--nebula-cyan)]/20 animate-twinkle-slow" style={{ top: '60%', left: '75%', animationDelay: '4s' }} />
      <span className="absolute h-1.5 w-1.5 rounded-full bg-[var(--nebula-pink)]/10 animate-twinkle" style={{ bottom: '15%', left: '45%', animationDelay: '2s' }} />
    </div>
  );
}
