import { useEffect, useRef } from 'react';

export function BrainwaveLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 120;
    canvas.height = 32;

    const draw = () => {
      ctx.clearRect(0, 0, 120, 32);
      ctx.beginPath();

      const amplitude = 8;
      const frequency = 0.08;
      const speed = 0.12;

      for (let x = 0; x <= 120; x++) {
        const y =
          16 +
          amplitude * Math.sin(frequency * x + tRef.current) +
          (amplitude / 2) * Math.sin(frequency * 2 * x + tRef.current * 1.3) +
          (amplitude / 4) * Math.sin(frequency * 4 * x + tRef.current * 0.7);

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      const gradient = ctx.createLinearGradient(0, 0, 120, 0);
      gradient.addColorStop(0, 'rgba(59,130,246,0)');
      gradient.addColorStop(0.3, 'rgba(59,130,246,0.8)');
      gradient.addColorStop(0.7, 'rgba(6,182,212,0.8)');
      gradient.addColorStop(1, 'rgba(6,182,212,0)');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();

      tRef.current += speed;
      frameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <canvas ref={canvasRef} className="opacity-90" style={{ imageRendering: 'pixelated' }} />
      <span className="text-xs font-mono text-subtle animate-pulse">
        Thinking...
      </span>
    </div>
  );
}
