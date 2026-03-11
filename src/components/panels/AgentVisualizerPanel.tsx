'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/store';
import { Agent, AgentDivision, Task } from '@/types';
import { cn } from '@/lib/utils';

// Division colors for visual grouping
const DIVISION_COLORS: Record<AgentDivision, string> = {
  'executive': '#FFD700',
  'engineering': '#00CED1',
  'marketing': '#FF69B4',
  'sales': '#32CD32',
  'operations': '#FF8C00',
  'design': '#9370DB',
  'product': '#4169E1',
  'testing': '#DC143C',
  'support': '#20B2AA',
  'paid-media': '#FF4500',
  'project-management': '#8B4513',
  'spatial-computing': '#00BFFF',
  'specialized': '#7B68EE',
  'game-development': '#9ACD32',
  'strategy': '#DDA0DD',
};

// Agent visual states
type AgentState = 'idle' | 'working' | 'thinking' | 'completed' | 'sleeping';

interface PixelAgent {
  id: string;
  name: string;
  emoji: string;
  division: AgentDivision;
  status: AgentState;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  currentTask?: string;
  frame: number;
  speechBubble?: string;
  speechTimer: number;
}

interface FloorConfig {
  name: string;
  divisions: AgentDivision[];
  color: string;
}

const FLOORS: FloorConfig[] = [
  { name: 'Executive Suite', divisions: ['executive', 'strategy'], color: '#2D1B4E' },
  { name: 'Product & Design', divisions: ['product', 'design', 'spatial-computing'], color: '#1B3D4E' },
  { name: 'Engineering Hub', divisions: ['engineering', 'game-development', 'testing'], color: '#1B4E3D' },
  { name: 'Growth Floor', divisions: ['marketing', 'sales', 'paid-media'], color: '#4E1B3D' },
  { name: 'Operations Center', divisions: ['operations', 'project-management', 'support', 'specialized'], color: '#3D4E1B' },
];

export function AgentVisualizerPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { agents, tasks } = useAppStore();
  const [pixelAgents, setPixelAgents] = useState<PixelAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<PixelAgent | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<'office' | 'grid' | 'flow'>('office');
  const [showLabels, setShowLabels] = useState(true);
  const [autoAnimate, setAutoAnimate] = useState(true);
  const animationRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);

  // Convert real agents to pixel agents with positions
  useEffect(() => {
    const newPixelAgents: PixelAgent[] = agents.map((agent, index) => {
      const divisionIndex = FLOORS.findIndex(f => f.divisions.includes(agent.division));
      const floor = divisionIndex >= 0 ? divisionIndex : 4;
      const floorAgents = agents.filter(a => 
        FLOORS[floor].divisions.includes(a.division)
      );
      const posInFloor = floorAgents.findIndex(a => a.id === agent.id);
      
      // Calculate position based on floor and position within floor
      const baseX = 100 + (posInFloor % 8) * 80;
      const baseY = 100 + floor * 140 + Math.floor(posInFloor / 8) * 60;
      
      const agentTasks = tasks.filter(t => t.assignedTo === agent.id && t.status === 'in_progress');
      const currentTask = agentTasks[0]?.title;
      
      let status: AgentState = 'idle';
      if (agent.status === 'sleeping') status = 'sleeping';
      else if (agent.status === 'active' || agent.status === 'busy') {
        status = agentTasks.length > 0 ? 'working' : 'thinking';
      }
      
      return {
        id: agent.id,
        name: agent.name,
        emoji: agent.emoji,
        division: agent.division,
        status,
        x: baseX,
        y: baseY,
        targetX: baseX + (Math.random() * 20 - 10),
        targetY: baseY + (Math.random() * 10 - 5),
        currentTask,
        frame: Math.floor(Math.random() * 4),
        speechBubble: currentTask ? `Working on: ${currentTask.slice(0, 20)}...` : undefined,
        speechTimer: 0,
      };
    });
    setPixelAgents(newPixelAgents);
  }, [agents, tasks]);

  // Animation loop
  useEffect(() => {
    if (!autoAnimate) return;
    
    const animate = () => {
      frameCountRef.current += 1;
      
      setPixelAgents(prev => prev.map(agent => {
        let newAgent = { ...agent };
        
        // Animate frame for working agents
        if (frameCountRef.current % 15 === 0) {
          newAgent.frame = (agent.frame + 1) % 4;
        }
        
        // Move towards target
        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          newAgent.x += dx * 0.05;
          newAgent.y += dy * 0.05;
        } else if (frameCountRef.current % 120 === 0) {
          // Set new random target occasionally
          const baseX = 100 + (agents.findIndex(a => a.id === agent.id) % 8) * 80;
          const baseY = 100 + FLOORS.findIndex(f => f.divisions.includes(agent.division)) * 140;
          newAgent.targetX = baseX + (Math.random() * 30 - 15);
          newAgent.targetY = baseY + (Math.random() * 20 - 10);
        }
        
        // Update speech timer
        if (agent.speechTimer > 0) {
          newAgent.speechTimer = agent.speechTimer - 1;
        } else if (agent.currentTask && frameCountRef.current % 200 === 0) {
          newAgent.speechTimer = 100;
        }
        
        return newAgent;
      }));
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [autoAnimate, agents]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);
      
      // Draw floors
      FLOORS.forEach((floor, floorIndex) => {
        const floorY = 60 + floorIndex * 140;
        ctx.fillStyle = floor.color;
        ctx.fillRect(50, floorY, 700, 120);
        
        // Floor label
        ctx.fillStyle = '#ffffff80';
        ctx.font = '12px monospace';
        ctx.fillText(floor.name, 60, floorY + 20);
        
        // Division labels
        ctx.fillStyle = '#ffffff40';
        ctx.font = '10px monospace';
        ctx.fillText(floor.divisions.join(' • '), 60, floorY + 35);
        
        // Draw desks/workstations
        for (let i = 0; i < 8; i++) {
          const deskX = 90 + i * 80;
          const deskY = floorY + 50;
          ctx.fillStyle = '#333';
          ctx.fillRect(deskX, deskY, 50, 25);
          ctx.fillStyle = '#222';
          ctx.fillRect(deskX + 5, deskY + 5, 40, 15);
        }
      });
      
      // Draw agents
      pixelAgents.forEach(agent => {
        const isSelected = selectedAgent?.id === agent.id;
        const color = DIVISION_COLORS[agent.division] || '#888';
        
        // Agent shadow
        ctx.fillStyle = '#00000040';
        ctx.beginPath();
        ctx.ellipse(agent.x + 15, agent.y + 38, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Agent body (pixel art style)
        ctx.fillStyle = color;
        
        // Head
        ctx.fillRect(agent.x + 8, agent.y, 14, 14);
        
        // Body with animation
        const bodyOffset = agent.status === 'working' ? Math.sin(agent.frame * 0.5) * 2 : 0;
        ctx.fillRect(agent.x + 5, agent.y + 14 + bodyOffset, 20, 18);
        
        // Arms (animated for working)
        if (agent.status === 'working') {
          const armOffset = Math.sin(agent.frame * 1.5) * 4;
          ctx.fillRect(agent.x, agent.y + 16, 5, 10 + armOffset);
          ctx.fillRect(agent.x + 25, agent.y + 16, 5, 10 - armOffset);
        } else {
          ctx.fillRect(agent.x, agent.y + 16, 5, 12);
          ctx.fillRect(agent.x + 25, agent.y + 16, 5, 12);
        }
        
        // Emoji face
        ctx.font = '14px serif';
        ctx.fillText(agent.emoji, agent.x + 5, agent.y + 12);
        
        // Status indicator
        const statusColors: Record<AgentState, string> = {
          idle: '#888',
          working: '#00FF00',
          thinking: '#FFFF00',
          completed: '#00FFFF',
          sleeping: '#4444FF',
        };
        ctx.fillStyle = statusColors[agent.status];
        ctx.beginPath();
        ctx.arc(agent.x + 26, agent.y + 4, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Pulsing effect for working agents
        if (agent.status === 'working') {
          const pulse = Math.sin(frameCountRef.current * 0.1) * 0.5 + 0.5;
          ctx.strokeStyle = `rgba(0, 255, 0, ${pulse})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(agent.x + 15, agent.y + 20, 20 + pulse * 5, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Selection highlight
        if (isSelected) {
          ctx.strokeStyle = '#00FFFF';
          ctx.lineWidth = 2;
          ctx.strokeRect(agent.x - 5, agent.y - 5, 40, 50);
        }
        
        // Name label
        if (showLabels) {
          ctx.fillStyle = '#fff';
          ctx.font = '9px monospace';
          const name = agent.name.length > 12 ? agent.name.slice(0, 10) + '..' : agent.name;
          ctx.fillText(name, agent.x - 5, agent.y + 50);
        }
        
        // Speech bubble
        if (agent.speechTimer > 0 && agent.currentTask) {
          const bubbleX = agent.x + 30;
          const bubbleY = agent.y - 25;
          const text = agent.currentTask.slice(0, 25);
          
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.roundRect(bubbleX, bubbleY, text.length * 5 + 10, 20, 5);
          ctx.fill();
          
          // Bubble pointer
          ctx.beginPath();
          ctx.moveTo(bubbleX + 5, bubbleY + 20);
          ctx.lineTo(bubbleX - 5, bubbleY + 30);
          ctx.lineTo(bubbleX + 15, bubbleY + 20);
          ctx.fill();
          
          ctx.fillStyle = '#333';
          ctx.font = '8px monospace';
          ctx.fillText(text, bubbleX + 5, bubbleY + 13);
        }
      });
      
      ctx.restore();
      requestAnimationFrame(render);
    };
    
    render();
  }, [pixelAgents, selectedAgent, zoom, pan, showLabels]);

  // Handle canvas resize
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Mouse handlers for panning and selection
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else {
      // Check for agent selection
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      
      const clicked = pixelAgents.find(
        agent => x >= agent.x && x <= agent.x + 30 && y >= agent.y && y <= agent.y + 40
      );
      setSelectedAgent(clicked || null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: pan.x + (e.clientX - lastMousePos.x),
        y: pan.y + (e.clientY - lastMousePos.y),
      });
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
  };

  // Stats calculations
  const statusCounts = pixelAgents.reduce((acc, agent) => {
    acc[agent.status] = (acc[agent.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const divisionCounts = pixelAgents.reduce((acc, agent) => {
    acc[agent.division] = (acc[agent.division] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Control Bar */}
      <div className="flex items-center justify-between p-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🎮</span> Agent Visualizer
          </h2>
          
          {/* View Mode Tabs */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            {(['office', 'grid', 'flow'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1 rounded text-xs font-medium transition-colors',
                  viewMode === mode
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status Legend */}
          <div className="flex items-center gap-2 text-xs">
            {Object.entries(statusCounts).map(([status, count]) => (
              <span key={status} className="flex items-center gap-1 text-gray-400">
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  status === 'working' && 'bg-green-500',
                  status === 'thinking' && 'bg-yellow-500',
                  status === 'idle' && 'bg-gray-500',
                  status === 'sleeping' && 'bg-blue-500',
                  status === 'completed' && 'bg-cyan-500',
                )} />
                {status}: {count}
              </span>
            ))}
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2 border-l border-gray-700 pl-3">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={cn(
                'px-2 py-1 rounded text-xs',
                showLabels ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-400'
              )}
            >
              Labels
            </button>
            <button
              onClick={() => setAutoAnimate(!autoAnimate)}
              className={cn(
                'px-2 py-1 rounded text-xs',
                autoAnimate ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
              )}
            >
              {autoAnimate ? '⏸' : '▶'}
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-400 hover:text-white"
            >
              Reset
            </button>
            <span className="text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onContextMenu={e => e.preventDefault()}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)' }}
          />
          
          {/* Zoom hint */}
          <div className="absolute bottom-4 left-4 text-xs text-gray-600">
            Scroll to zoom • Right-click drag to pan • Click agent to select
          </div>
        </div>
        
        {/* Side Panel */}
        <div className="w-72 bg-gray-900 border-l border-gray-800 overflow-y-auto">
          {selectedAgent ? (
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: DIVISION_COLORS[selectedAgent.division] + '40' }}
                >
                  {selectedAgent.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-white">{selectedAgent.name}</h3>
                  <p className="text-xs text-gray-400">{selectedAgent.division}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gray-800 rounded-lg p-3">
                  <span className="text-xs text-gray-500">Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      selectedAgent.status === 'working' && 'bg-green-500',
                      selectedAgent.status === 'thinking' && 'bg-yellow-500',
                      selectedAgent.status === 'idle' && 'bg-gray-500',
                    )} />
                    <span className="text-white capitalize">{selectedAgent.status}</span>
                  </div>
                </div>
                
                {selectedAgent.currentTask && (
                  <div className="bg-gray-800 rounded-lg p-3">
                    <span className="text-xs text-gray-500">Current Task</span>
                    <p className="text-sm text-white mt-1">{selectedAgent.currentTask}</p>
                  </div>
                )}
                
                <div className="bg-gray-800 rounded-lg p-3">
                  <span className="text-xs text-gray-500">Position</span>
                  <p className="text-sm text-gray-300 mt-1">
                    X: {Math.round(selectedAgent.x)}, Y: {Math.round(selectedAgent.y)}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setSelectedAgent(null)}
                className="w-full mt-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          ) : (
            <div className="p-4">
              <h3 className="font-bold text-white mb-4">Divisions Overview</h3>
              <div className="space-y-2">
                {FLOORS.map(floor => (
                  <div key={floor.name} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{floor.name}</span>
                      <span className="text-xs text-gray-500">
                        {floor.divisions.reduce((sum, div) => sum + (divisionCounts[div] || 0), 0)} agents
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {floor.divisions.map(div => (
                        <span
                          key={div}
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ 
                            backgroundColor: DIVISION_COLORS[div] + '30',
                            color: DIVISION_COLORS[div]
                          }}
                        >
                          {div}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <h3 className="font-bold text-white mb-3">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <span className="text-2xl font-bold text-cyan-400">{pixelAgents.length}</span>
                    <p className="text-xs text-gray-500">Total Agents</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <span className="text-2xl font-bold text-green-400">{statusCounts.working || 0}</span>
                    <p className="text-xs text-gray-500">Working</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <span className="text-2xl font-bold text-yellow-400">{statusCounts.thinking || 0}</span>
                    <p className="text-xs text-gray-500">Thinking</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <span className="text-2xl font-bold text-gray-400">{statusCounts.idle || 0}</span>
                    <p className="text-xs text-gray-500">Idle</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
