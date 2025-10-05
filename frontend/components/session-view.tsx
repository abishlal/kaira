'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  type AgentState,
  type ReceivedChatMessage,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { toastAlert } from '@/components/alert-toast';
import { AgentControlBar } from '@/components/livekit/agent-control-bar/agent-control-bar';
import { ChatEntry } from '@/components/livekit/chat/chat-entry';
import { ChatMessageView } from '@/components/livekit/chat/chat-message-view';
import { MediaTiles } from '@/components/livekit/media-tiles';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import { useDebugMode } from '@/hooks/useDebug';
import type { AppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

interface SessionViewProps {
  appConfig: AppConfig;
  disabled: boolean;
  sessionStarted: boolean;
}

export const SessionView = ({
  appConfig,
  disabled,
  sessionStarted,
  ref,
}: React.ComponentProps<'div'> & SessionViewProps) => {
  const { state: agentState } = useVoiceAssistant();
  const [chatOpen, setChatOpen] = useState(false);
  const { messages, send } = useChatAndTranscription();
  const room = useRoomContext();

  // Pre-calculated values for visualization bars to prevent hydration mismatch
  const [visualBars, setVisualBars] = useState<Array<{ height: string; opacity: number }>>([]);

  // Neural network animation - client-side only
  useEffect(() => {
    // This ensures we're only running on client-side, not during SSR
    if (typeof window === 'undefined') return;

    const canvas = document.getElementById('neuralNetworkCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Neural network parameters
    const nodes: { x: number; y: number; connections: number[] }[] = [];
    const nodeCount = 50;
    const maxConnections = 5;
    const animationSpeed = 0.0005;
    const connectionDistance = Math.min(canvas.width, canvas.height) / 3;
    let animationTime = 0;

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        connections: [],
      });

      // Create random connections
      for (let j = 0; j < maxConnections; j++) {
        const connectionIdx = Math.floor(Math.random() * nodeCount);
        if (connectionIdx !== i && !nodes[i].connections.includes(connectionIdx)) {
          nodes[i].connections.push(connectionIdx);
        }
      }
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationTime += animationSpeed;

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        for (const connIdx of node.connections) {
          if (connIdx < nodes.length) {
            const connNode = nodes[connIdx];
            const dist = Math.sqrt(
              Math.pow(node.x - connNode.x, 2) + Math.pow(node.y - connNode.y, 2)
            );

            if (dist < connectionDistance) {
              const opacity = (1 - dist / connectionDistance) * 0.8;
              const pulseIntensity = Math.sin(animationTime * 5000 + i) * 0.5 + 0.5;

              // Draw connection line
              ctx.beginPath();
              ctx.moveTo(node.x, node.y);
              ctx.lineTo(connNode.x, connNode.y);
              ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * pulseIntensity * 0.5})`;
              ctx.lineWidth = 1;
              ctx.stroke();

              // Draw data packet animation
              const packetPosition = Math.sin(animationTime * 2000 + i * 1000) * 0.5 + 0.5;
              const packetX = node.x + (connNode.x - node.x) * packetPosition;
              const packetY = node.y + (connNode.y - node.y) * packetPosition;

              ctx.beginPath();
              ctx.arc(packetX, packetY, 2, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(59, 130, 246, ${opacity * 0.8})`;
              ctx.fill();
            }
          }
        }

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.fill();
      }

      requestAnimationFrame(animate);
    };

    const animationFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, [sessionStarted]);

  useDebugMode({
    enabled: process.env.NODE_END !== 'production',
  });

  // Initialize the visualization bars only on client-side
  useEffect(() => {
    const bars = Array(10)
      .fill(null)
      .map(() => ({
        height: `${Math.floor(Math.random() * 40) + 10}px`,
        opacity: Math.random() * 0.5 + 0.3,
      }));
    setVisualBars(bars);
  }, []);

  async function handleSendMessage(message: string) {
    await send(message);
  }

  useEffect(() => {
    if (sessionStarted) {
      const timeout = setTimeout(() => {
        if (!isAgentAvailable(agentState)) {
          const reason =
            agentState === 'connecting'
              ? 'Agent did not join the room. '
              : 'Agent connected but did not complete initializing. ';

          toastAlert({
            title: 'Session ended',
            description: (
              <p className="w-full">
                {reason}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://docs.livekit.io/agents/start/voice-ai/"
                  className="whitespace-nowrap underline"
                >
                  See quickstart guide
                </a>
                .
              </p>
            ),
          });
          room.disconnect();
        }
      }, 20_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionStarted, room]);

  const { supportsChatInput, supportsVideoInput, supportsScreenShare } = appConfig;
  const capabilities = {
    supportsChatInput,
    supportsVideoInput,
    supportsScreenShare,
  };

  return (
    <section
      ref={ref}
      inert={disabled}
      className={cn(
        'relative overflow-hidden opacity-0',
        // prevent page scrollbar
        // when !chatOpen due to 'translate-y-20'
        !chatOpen && 'max-h-svh overflow-hidden'
      )}
    >
      {/* Unified background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-blue-950 via-blue-900/30 to-slate-900"></div>
      {/* Advanced neural network background with animation */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Blue overlay for consistent coloring */}
        <div className="absolute inset-0 bg-blue-900/10"></div>

        {/* Dynamic neural network visualization */}
        <canvas
          id="neuralNetworkCanvas"
          className="absolute inset-0 h-full w-full opacity-20"
        ></canvas>

        {/* Grid pattern */}
        <div className="absolute inset-0">
          <svg width="100%" height="100%" className="opacity-10">
            <pattern id="neural-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M0 20 L40 20 M20 0 L20 40"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-blue-400/40"
              />
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#neural-grid)" />
          </svg>
        </div>

        {/* HUD-like circular elements */}
        <div className="absolute top-1/4 right-1/4 h-[300px] w-[300px] animate-[spin_60s_linear_infinite] rounded-full border border-blue-500/10">
          <div className="absolute top-0 right-0 h-5 w-5 rounded-full bg-blue-500/10"></div>
          <div className="absolute top-1/3 right-1/4 h-3 w-3 rounded-full bg-blue-400/20"></div>
        </div>

        {/* Decorative tech circles */}
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-[pulse_8s_ease-in-out_infinite] rounded-full border border-blue-500/10 opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 animate-[pulse_6s_ease-in-out_infinite] rounded-full border border-blue-400/15 opacity-20"></div>
      </div>

      {/* Advanced scanning effects */}
      <div className="pointer-events-none absolute h-full w-full overflow-hidden opacity-20">
        {/* Horizontal scan line */}
        <div
          className="absolute h-[2px] w-full animate-[scanline_4s_linear_infinite] bg-gradient-to-r from-transparent via-blue-400 to-transparent"
          style={{ top: '0', transform: 'translateY(0)' }}
        ></div>

        {/* Vertical scan line */}
        <div
          className="absolute h-full w-[2px] animate-[scanlineVertical_8s_linear_infinite] bg-gradient-to-b from-transparent via-blue-400/40 to-transparent"
          style={{ left: '0', transform: 'translateX(0)' }}
        ></div>
      </div>

      {/* Data visualization elements */}
      <div className="pointer-events-none absolute top-[30%] right-12 flex h-40 w-40 flex-col items-end opacity-60">
        <div className="flex gap-1 overflow-hidden">
          {visualBars.length > 0
            ? visualBars.map((bar, i) => (
                <div
                  key={`bar-${i}`}
                  className="h-16 w-1 bg-blue-500/20"
                  style={{
                    height: bar.height,
                    opacity: bar.opacity,
                  }}
                ></div>
              ))
            : Array(10)
                .fill(null)
                .map((_, i) => (
                  <div
                    key={`placeholder-${i}`}
                    className="h-16 w-1 bg-blue-500/20"
                    style={{
                      height: '20px',
                      opacity: 0.5,
                    }}
                  ></div>
                ))}
        </div>
        <div className="mt-1 font-mono text-[8px] text-blue-300/60">SIGNAL ANALYSIS</div>
      </div>

      {/* Circular radar */}
      <div className="pointer-events-none absolute bottom-[20%] left-12 h-32 w-32 opacity-40">
        <div className="absolute h-full w-full rounded-full border border-blue-400/20"></div>
        <div className="absolute h-3/4 w-3/4 translate-x-[12.5%] translate-y-[12.5%] rounded-full border border-blue-400/20"></div>
        <div className="absolute h-1/2 w-1/2 translate-x-1/4 translate-y-1/4 rounded-full border border-blue-400/20"></div>
        <div
          className="absolute top-1/2 left-1/2 h-full w-1 origin-bottom -translate-x-1/2 -translate-y-1/2 animate-spin bg-gradient-to-t from-blue-400/60 to-transparent"
          style={{ animationDuration: '3s' }}
        ></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 font-mono text-[8px] text-blue-300/60">
          PROXIMITY SCAN
        </div>
      </div>

      {/* Tech decorations in corners */}
      <div className="pointer-events-none fixed top-0 right-0 p-4">
        <div className="h-16 w-16 rounded-tr-lg border-t border-r border-blue-400/20"></div>
        <div className="absolute top-4 right-4 h-2 w-2 animate-pulse rounded-full bg-blue-400/50"></div>
      </div>
      <div className="pointer-events-none fixed top-0 left-0 p-4">
        <div className="h-16 w-16 rounded-tl-lg border-t border-l border-blue-400/20"></div>
        <div
          className="absolute top-4 left-4 h-2 w-2 animate-pulse rounded-full bg-blue-400/50"
          style={{ animationDelay: '0.5s' }}
        ></div>
      </div>
      <div className="pointer-events-none fixed right-0 bottom-0 p-4">
        <div className="h-16 w-16 rounded-br-lg border-r border-b border-blue-400/20"></div>
        <div
          className="absolute right-4 bottom-4 h-2 w-2 animate-pulse rounded-full bg-blue-400/50"
          style={{ animationDelay: '1s' }}
        ></div>
      </div>
      <div className="pointer-events-none fixed bottom-0 left-0 p-4">
        <div className="h-16 w-16 rounded-bl-lg border-b border-l border-blue-400/20"></div>
        <div
          className="absolute bottom-4 left-4 h-2 w-2 animate-pulse rounded-full bg-blue-400/50"
          style={{ animationDelay: '1.5s' }}
        ></div>
      </div>

      <ChatMessageView
        className={cn(
          'relative z-10 mx-auto min-h-svh w-full max-w-2xl px-3 pt-32 pb-40 transition-[opacity,translate] duration-300 ease-out md:px-0 md:pt-36 md:pb-48',
          chatOpen ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-20 opacity-0'
        )}
      >
        <div className="space-y-4 whitespace-pre-wrap">
          <AnimatePresence>
            {messages.map((message: ReceivedChatMessage) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 1, height: 'auto', translateY: 0.001 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative"
              >
                <div className="absolute top-0 left-0 h-full w-1 rounded-full bg-gradient-to-b from-blue-400 to-blue-900/0 opacity-30"></div>
                <ChatEntry hideName key={message.id} entry={message} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ChatMessageView>

      <div className="fixed top-0 right-0 left-0 z-10 h-32 border-b border-blue-400/10 backdrop-blur-sm md:h-36">
        {/* Header with advanced Jarvis-like UI elements */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 transform">
          <div className="flex flex-col items-center">
            {/* Main title with decorative elements */}
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <div className="h-[2px] w-6 rounded-full bg-blue-400/40"></div>
                <div
                  className="h-3 w-3 animate-ping rounded-full bg-blue-500/30"
                  style={{ animationDuration: '4s' }}
                ></div>
              </div>
              <div className="font-mono text-xs tracking-wider text-blue-300 uppercase">
                AI Assistant Interface
              </div>
              <div className="flex items-center">
                <div
                  className="h-3 w-3 animate-ping rounded-full bg-blue-500/30"
                  style={{ animationDuration: '4s' }}
                ></div>
                <div className="h-[2px] w-6 rounded-full bg-blue-400/40"></div>
              </div>
            </div>

            {/* System status banner */}
            <div className="mt-2 flex items-center justify-center">
              <div className="h-[1px] w-[20px] bg-blue-400/20"></div>
              <div className="mx-2 font-mono text-[9px] tracking-widest text-blue-300/60 uppercase">
                <span className="mr-1 animate-pulse text-blue-400/80">•</span>System online
                <span className="ml-1 animate-pulse text-blue-400/80">•</span>
              </div>
              <div className="h-[1px] w-[20px] bg-blue-400/20"></div>
            </div>
          </div>
        </div>
        {/* Status indicators with advanced metrics */}
        <div className="absolute top-16 left-1/2 flex -translate-x-1/2 transform gap-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400/70"></div>
              <span className="font-mono text-[10px] tracking-wider text-blue-300/70 uppercase">
                {isAgentAvailable(agentState) ? 'System' : 'Offline'}
              </span>
            </div>
            <div className="mt-1 font-mono text-[8px] text-blue-400/50">
              {/* Fake system status */}
              <span className="animate-pulse">
                {isAgentAvailable(agentState) ? 'NOMINAL' : 'DISCONNECTED'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <div
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400/70"
                style={{ animationDelay: '0.3s' }}
              ></div>
              <span className="font-mono text-[10px] tracking-wider text-blue-300/70 uppercase">
                {isAgentAvailable(agentState) ? 'Neural' : 'Offline'}
              </span>
            </div>
            <div className="mt-1 font-mono text-[8px] text-blue-400/50">
              {/* Fake neural status */}
              <span className="animate-pulse">
                {isAgentAvailable(agentState) ? 'NOMINAL' : 'DISCONNECTED'}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <div
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400/70"
                style={{ animationDelay: '0.6s' }}
              ></div>
              <span className="font-mono text-[10px] tracking-wider text-blue-300/70 uppercase">
                {isAgentAvailable(agentState) ? 'Voice AI' : 'Offline'}
              </span>
            </div>
            <div className="mt-1 font-mono text-[8px] text-blue-400/50">
              {/* Fake voice status */}
              <span className="animate-pulse">
                {isAgentAvailable(agentState) ? 'READY' : 'DISCONNECTED'}
              </span>
            </div>
          </div>
        </div>{' '}
        {/* skrim with tech line */}
        <div className="absolute bottom-0 left-0 h-12 w-full translate-y-full bg-gradient-to-b from-blue-900/0 to-transparent">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"></div>
        </div>
      </div>

      <MediaTiles chatOpen={chatOpen} />

      {/* Agent loading animation */}
      <motion.div
        className="fixed top-1/2 left-1/2 z-30 -translate-x-1/2 -translate-y-1/2 text-center"
        initial={{ opacity: 0 }}
        animate={{
          opacity: sessionStarted && agentState === 'connecting' ? 1 : 0,
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Loading spinner animation */}
          <div className="relative h-20 w-20">
            <div
              className="absolute top-0 left-0 h-full w-full animate-ping rounded-full border-2 border-blue-400/20"
              style={{ animationDuration: '1.5s' }}
            ></div>
            <div
              className="absolute top-0 left-0 h-full w-full animate-spin rounded-full border-2 border-transparent border-t-blue-500"
              style={{ animationDuration: '2s' }}
            ></div>
            <div
              className="absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border border-blue-400/40"
              style={{ animationDuration: '1.5s' }}
            ></div>
            <div
              className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-blue-500/20"
              style={{ animationDuration: '2.5s' }}
            ></div>
          </div>

          {/* Connection message */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-blue-400/30"></div>
              <div className="font-mono text-sm tracking-wider text-blue-300/90 uppercase">
                Connecting
              </div>
              <div className="h-px w-8 bg-blue-400/30"></div>
            </div>
            <div className="font-mono text-blue-300/80">
              <span className="animate-pulse">Attempting to connect with AI agent</span>
              <span className="animate-pulse">
                <span className="inline-block" style={{ animationDelay: '0s' }}>
                  .
                </span>
                <span className="inline-block" style={{ animationDelay: '0.3s' }}>
                  .
                </span>
                <span className="inline-block" style={{ animationDelay: '0.6s' }}>
                  .
                </span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-blue-400/10 px-3 pt-2 pb-3 backdrop-blur-sm md:px-12 md:pb-12">
        <motion.div
          key="control-bar"
          initial={{ opacity: 0, translateY: '100%' }}
          animate={{
            opacity: sessionStarted ? 1 : 0,
            translateY: sessionStarted ? '0%' : '100%',
          }}
          transition={{ duration: 0.3, delay: sessionStarted ? 0.5 : 0, ease: 'easeOut' }}
        >
          <div className="relative z-10 mx-auto w-full max-w-2xl">
            {isAgentAvailable(agentState) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: sessionStarted && messages.length === 0 ? 1 : 0,
                  transition: {
                    ease: 'easeIn',
                    delay: messages.length > 0 ? 0 : 0.8,
                    duration: messages.length > 0 ? 0.2 : 0.5,
                  },
                }}
                aria-hidden={messages.length > 0}
                className={cn(
                  'absolute inset-x-0 -top-12 text-center',
                  sessionStarted && messages.length === 0 && 'pointer-events-none'
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-px w-6 bg-blue-400/30"></div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400/70"></span>
                      <span className="font-mono text-xs tracking-wider text-blue-300/90">
                        INPUT READY
                      </span>
                      <span
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400/70"
                        style={{ animationDelay: '0.5s' }}
                      ></span>
                    </div>
                    <div className="h-px w-6 bg-blue-400/30"></div>
                  </div>
                  <p className="font-mono text-sm tracking-wide text-blue-300">
                    Agent is listening, ask it a question
                  </p>
                </div>
              </motion.div>
            )}

            <AgentControlBar
              capabilities={capabilities}
              onChatOpenChange={setChatOpen}
              onSendMessage={handleSendMessage}
            />
          </div>
          {/* skrim with tech line */}
          <div className="absolute top-0 left-0 h-12 w-full -translate-y-full border-blue-900/0 bg-gradient-to-t from-blue-900/0 to-transparent">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"></div>
          </div>
        </motion.div>
      </div>

      {/* Animations for keyframes */}
      <style jsx>{`
        @keyframes scanline {
          0% {
            transform: translateY(-10vh);
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
          }
          100% {
            transform: translateY(110vh);
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
          }
        }

        @keyframes scanlineVertical {
          0% {
            transform: translateX(-10vw);
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
          }
          100% {
            transform: translateX(110vw);
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.2);
          }
        }

        @keyframes blink {
          0%,
          100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.8;
          }
        }

        @keyframes fadeInOut {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.7;
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
};
