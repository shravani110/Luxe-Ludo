import React, { useEffect, useRef } from 'react';
import styles from './ParticlesBackground.module.css';

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  maxAlpha: number;
  fadeSpeed: number;
  color: string;
}

export const ParticlesBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const colors = [
      'rgba(0, 210, 255, ',   // cyan
      'rgba(255, 51, 102, ',  // ruby
      'rgba(0, 245, 155, ',   // emerald
      'rgba(255, 200, 55, ',  // amber
      'rgba(168, 85, 247, ',  // violet
    ];

    const particleCount = Math.min(Math.floor((width * height) / 22000), 45);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const maxAlpha = 0.2 + Math.random() * 0.35;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.8 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35 - 0.1, // slight upward drift
        alpha: Math.random() * maxAlpha,
        maxAlpha,
        fadeSpeed: 0.003 + Math.random() * 0.006,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.fadeSpeed;

        if (p.alpha > p.maxAlpha || p.alpha < 0.05) {
          p.fadeSpeed = -p.fadeSpeed;
        }

        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0, p.alpha)})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `${p.color}0.5)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
};
