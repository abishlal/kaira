import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WelcomeProps {
  disabled: boolean;
  startButtonText: string;
  onStartCall: () => void;
}

export const Welcome = ({
  disabled,
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeProps) => {
  const [glowing, setGlowing] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  const welcomeText = 'Your personal AI assistant awaits your command';
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Create a pulsing effect for the Jarvis-like interface
  useEffect(() => {
    const interval = setInterval(() => {
      setGlowing((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Typewriter effect for welcome text
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < welcomeText.length) {
        setTypedText(welcomeText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setTypingComplete(true);
      }
    }, 50);

    return () => clearInterval(timer);
  }, []);

  // Neural network animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Neural network nodes and connections
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
    }

    const particles: Particle[] = [];
    const numParticles = 80;
    const connectionDistance = 150;
    const maxConnections = 3;

    // Create particles
    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
      });
    }

    function animate() {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move particles
        p.x += p.speedX;
        p.y += p.speedY;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

        // Draw particle (node)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = glowing ? 'rgba(56, 189, 248, 0.7)' : 'rgba(56, 189, 248, 0.5)';
        ctx.fill();

        // Connect to nearby particles
        let connections = 0;
        for (let j = i + 1; j < particles.length; j++) {
          if (connections >= maxConnections) break;

          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            connections++;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.2 - (distance / connectionDistance) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animate);
    }

    animate();

    const resizeHandler = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', resizeHandler);

    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, [glowing]);

  return (
    <section
      ref={ref}
      inert={disabled}
      className={cn(
        'fixed inset-0 mx-auto flex h-svh flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-black to-slate-900 text-center',
        disabled ? 'z-10' : 'z-20'
      )}
    >
      {/* Neural Network Background */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-50" />

      {/* Decorative tech circles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border border-blue-500/20 opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 animate-[pulse_4s_ease-in-out_infinite] rounded-full border border-blue-400/30 opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 animate-[pulse_3s_ease-in-out_infinite] rounded-full border border-blue-300/40 opacity-30"></div>
      </div>

      {/* Digital circuit lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 h-16 w-64 border-r border-b border-blue-500/20"></div>
        <div className="absolute top-0 right-0 h-16 w-64 border-b border-l border-blue-500/20"></div>
        <div className="absolute bottom-0 left-0 h-16 w-64 border-t border-r border-blue-500/20"></div>
        <div className="absolute right-0 bottom-0 h-16 w-64 border-t border-l border-blue-500/20"></div>

        {/* Circuit dots */}
        <div className="absolute top-16 left-64 h-2 w-2 animate-ping rounded-full bg-blue-400/50"></div>

        <div
          className="absolute top-16 right-64 h-2 w-2 animate-ping rounded-full bg-blue-400/50"
          style={{ animationDelay: '0.5s' }}
        ></div>

        <div
          className="absolute bottom-16 left-64 h-2 w-2 animate-ping rounded-full bg-blue-400/50"
          style={{ animationDelay: '1s' }}
        ></div>

        <div
          className="absolute right-64 bottom-16 h-2 w-2 animate-ping rounded-full bg-blue-400/50"
          style={{ animationDelay: '1.5s' }}
        ></div>
      </div>

      {/* Jarvis-like pulse effect with animation */}
      <div
        className={cn(
          'absolute h-32 w-32 rounded-full transition-all duration-1000 ease-in-out',
          glowing ? 'scale-125 bg-blue-500/20' : 'scale-100 bg-blue-400/10'
        )}
      ></div>

      <div
        className="absolute h-40 w-40 animate-ping rounded-full bg-blue-500/5 duration-1000"
        style={{ animationDuration: '3s' }}
      ></div>

      <div
        className="absolute h-52 w-52 animate-ping rounded-full bg-blue-500/3 duration-1000"
        style={{ animationDuration: '4s' }}
      ></div>

      {/* AI Logo with glow effect and rotation */}
      <div
        className={cn(
          'relative z-10 mb-6 flex items-center justify-center',
          glowing ? 'text-blue-400' : 'text-blue-300'
        )}
      >
        <div
          className="absolute h-24 w-24 animate-spin rounded-full border-t-2 border-blue-400/30"
          style={{ animationDuration: '8s' }}
        ></div>

        <div
          className="absolute h-28 w-28 animate-spin rounded-full border-l-2 border-blue-300/20"
          style={{ animationDuration: '12s', animationDirection: 'reverse' }}
        ></div>

        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-20 animate-[pulse_2s_ease-in-out_infinite] drop-shadow-[0_0_15px_rgba(59,130,246,0.7)]"
        >
          <path
            d="M15 24V40C15 40.7957 14.6839 41.5587 14.1213 42.1213C13.5587 42.6839 12.7956 43 12 43C11.2044 43 10.4413 42.6839 9.87868 42.1213C9.31607 41.5587 9 40.7957 9 40V24C9 23.2044 9.31607 22.4413 9.87868 21.8787C10.4413 21.3161 11.2044 21 12 21C12.7956 21 13.5587 21.3161 14.1213 21.8787C14.6839 22.4413 15 23.2044 15 24ZM22 5C21.2044 5 20.4413 5.31607 19.8787 5.87868C19.3161 6.44129 19 7.20435 19 8V56C19 56.7957 19.3161 57.5587 19.8787 58.1213C20.4413 58.6839 21.2044 59 22 59C22.7956 59 23.5587 58.6839 24.1213 58.1213C24.6839 57.5587 25 56.7957 25 56V8C25 7.20435 24.6839 6.44129 24.1213 5.87868C23.5587 5.31607 22.7956 5 22 5ZM32 13C31.2044 13 30.4413 13.3161 29.8787 13.8787C29.3161 14.4413 29 15.2044 29 16V48C29 48.7957 29.3161 49.5587 29.8787 50.1213C30.4413 50.6839 31.2044 51 32 51C32.7956 51 33.5587 50.6839 34.1213 50.1213C34.6839 49.5587 35 48.7957 35 48V16C35 15.2044 34.6839 14.4413 34.1213 13.8787C33.5587 13.3161 32.7956 13 32 13ZM42 21C41.2043 21 40.4413 21.3161 39.8787 21.8787C39.3161 22.4413 39 23.2044 39 24V40C39 40.7957 39.3161 41.5587 39.8787 42.1213C40.4413 42.6839 41.2043 43 42 43C42.7957 43 43.5587 42.6839 44.1213 42.1213C44.6839 41.5587 45 40.7957 45 40V24C45 23.2044 44.6839 22.4413 44.1213 21.8787C43.5587 21.3161 42.7957 21 42 21ZM52 17C51.2043 17 50.4413 17.3161 49.8787 17.8787C49.3161 18.4413 49 19.2044 49 20V44C49 44.7957 49.3161 45.5587 49.8787 46.1213C50.4413 46.6839 51.2043 47 52 47C52.7957 47 53.5587 46.6839 54.1213 46.1213C54.6839 45.5587 55 44.7957 55 44V20C55 19.2044 54.6839 18.4413 54.1213 17.8787C53.5587 17.3161 52.7957 17 52 17Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Scanning effect line */}
      <div className="pointer-events-none absolute h-full w-full overflow-hidden opacity-20">
        <div
          className="h-px w-full animate-[scanline_4s_linear_infinite] bg-gradient-to-r from-transparent via-blue-400 to-transparent"
          style={{
            top: '50%',
            position: 'absolute',
          }}
        ></div>
      </div>

      {/* Title with Jarvis-like typography and digital effect */}
      <h1 className="relative mb-2 animate-[textFlicker_5s_linear_infinite] font-mono text-3xl font-bold tracking-wider text-blue-300">
        <span className="opacity-90">K</span>
        <span className="animate-pulse">A</span>
        <span className="opacity-95">I</span>
        <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>
          R
        </span>
        <span className="opacity-90">A</span>
        {/* Digital glitch overlay */}
        <span className="absolute -inset-1 block bg-blue-300/10 opacity-0 hover:opacity-10"></span>
      </h1>

      {/* Subtitle with tech style and typewriter effect */}
      <p className="h-6 max-w-prose bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text pt-1 font-mono text-sm leading-6 tracking-wide text-blue-100">
        {typedText}
        <span className="animate-pulse">_</span>
      </p>

      {/* Futuristic button with enhanced hover effects */}
      <Button
        variant="primary"
        size="lg"
        onClick={onStartCall}
        className={cn(
          'group relative mt-8 w-64 overflow-hidden border border-blue-400/30 bg-slate-900/80 font-mono tracking-wider text-blue-300 transition-all duration-300',
          'hover:border-blue-400/60 hover:bg-blue-500/20 hover:text-blue-100 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]'
        )}
      >
        <div className="absolute inset-0 h-full w-full -translate-x-[200%] bg-gradient-to-r from-transparent via-blue-400/10 to-transparent transition-transform duration-1000 group-hover:translate-x-[200%]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/30 to-blue-400/0 opacity-0 group-hover:animate-pulse group-hover:opacity-20"></div>
        {startButtonText}
      </Button>

      {/* AI Processing Indicators */}

      {/* Tech decoration at bottom with enhanced animations */}
      <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 transform gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 w-8 rounded-full transition-all duration-500',
              glowing
                ? i % 2 === 0
                  ? 'animate-pulse bg-blue-400'
                  : 'bg-blue-300/50'
                : i % 2 === 0
                  ? 'bg-blue-300/50'
                  : 'animate-pulse bg-blue-400'
            )}
            style={{ animationDelay: `${i * 0.2}s` }}
          ></div>
        ))}
      </div>

      {/* Animation for keyframes */}
      <style jsx>{`
        @keyframes scanline {
          0% {
            transform: translateY(-50vh);
          }
          100% {
            transform: translateY(50vh);
          }
        }
        @keyframes textFlicker {
          0%,
          19.999%,
          22%,
          62.999%,
          64%,
          64.999%,
          70%,
          100% {
            opacity: 0.99;
          }
          20%,
          21.999%,
          63%,
          63.999%,
          65%,
          69.999% {
            opacity: 0.4;
          }
        }
      `}</style>
    </section>
  );
};
