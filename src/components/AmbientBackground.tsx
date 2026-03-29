// =============================================================
// AMBIENT BACKGROUND ANIMATION - Subtle connection mesh effect
// Canvas-based, GPU-accelerated, eye-catching but non-irritating
// =============================================================
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  hue: number;
}

export const AmbientBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    resize();
    window.addEventListener('resize', resize);

    // Particle count scales with viewport
    const COUNT = Math.min(60, Math.floor((w * h) / 22000));
    const MAX_DIST = 160;
    const particles: Particle[] = [];

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        hue: Math.random() * 40 + 230, // indigo/purple range: 230–270
      });
    }

    // Mouse repulsion
    let mouse = { x: -9999, y: -9999 };
    const onMouse = (e: MouseEvent) => { mouse = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMouse);

    let frame = 0;

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      frame++;

      // Fade trails (lower alpha = more ghost)
      ctx.fillStyle = 'rgba(10, 10, 10, 0.15)';
      ctx.fillRect(0, 0, w, h);

      // Move + draw particles
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];

        // Drift + gentle oscillation
        p.x += p.vx + Math.sin(frame * 0.004 + i) * 0.04;
        p.y += p.vy + Math.cos(frame * 0.003 + i * 0.7) * 0.04;

        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);
        if (distToMouse < 80) {
          const force = (80 - distToMouse) / 80;
          p.x += (dx / distToMouse) * force * 1.2;
          p.y += (dy / distToMouse) * force * 1.2;
        }

        // Wrap edges
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${p.opacity})`;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < COUNT; j++) {
          const q = particles[j];
          const ex = p.x - q.x;
          const ey = p.y - q.y;
          const dist = Math.sqrt(ex * ex + ey * ey);

          if (dist < MAX_DIST) {
            const strength = (1 - dist / MAX_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `hsla(${(p.hue + q.hue) / 2}, 60%, 65%, ${strength})`;
            ctx.lineWidth = (1 - dist / MAX_DIST) * 0.8;
            ctx.stroke();
          }
        }
      }

      // Subtle radial vignette corners - very faint
      if (frame % 60 === 0) {
        // Redraw vignette every second for performance
        const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h);
        grad.addColorStop(0, 'rgba(10,10,10,0)');
        grad.addColorStop(1, 'rgba(10,10,10,0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
      aria-hidden="true"
    />
  );
};
