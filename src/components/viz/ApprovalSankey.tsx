// =============================================================
// APPROVAL FLOW SANKEY DIAGRAM - Animated SVG with particles
// Realtime particle flow, hover highlight, drill-down nodes
// =============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Users, CheckCircle2, XCircle, DollarSign, Clock } from 'lucide-react';

// ---- Data Model ----
interface SankeyNode {
  id: string;
  label: string;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  icon: React.FC<{ className?: string }>;
  detail: string;
}

interface SankeyLink {
  id: string;
  source: string;
  target: string;
  value: number;
  color: string;
}

interface Particle {
  id: number;
  linkId: string;
  progress: number; // 0..1
  speed: number;
}

// ---- Layout constants ----
const W = 800;
const H = 340;
const COL_W = 120;
const NODE_W = 100;

const NODES: SankeyNode[] = [
  { id: 'submitted',   label: 'Submitted',     value: 847, x: 20,  y: 120, width: NODE_W, height: 100, color: '#6366f1', icon: GitBranch,    detail: '847 expenses this month' },
  { id: 'manager',     label: 'Manager Review', value: 612, x: 190, y: 40,  width: NODE_W, height: 80,  color: '#8b5cf6', icon: Users,        detail: '612 routed to managers' },
  { id: 'auto',        label: 'Auto-Approved',  value: 235, x: 190, y: 200, width: NODE_W, height: 60,  color: '#10b981', icon: CheckCircle2, detail: '235 below $100 threshold' },
  { id: 'approved',    label: 'Approved',       value: 541, x: 380, y: 30,  width: NODE_W, height: 70,  color: '#10b981', icon: CheckCircle2, detail: '541 approved (88.4%)' },
  { id: 'rejected',    label: 'Rejected',       value: 71,  x: 380, y: 190, width: NODE_W, height: 50,  color: '#ef4444', icon: XCircle,     detail: '71 rejected (11.6%)' },
  { id: 'pending',     label: 'Pending',        value: 35,  x: 380, y: 270, width: NODE_W, height: 40,  color: '#f59e0b', icon: Clock,       detail: '35 awaiting decision' },
  { id: 'paid',        label: 'Paid',           value: 498, x: 580, y: 30,  width: NODE_W, height: 65,  color: '#06b6d4', icon: DollarSign,  detail: '$127,430 disbursed' },
  { id: 'cfo',         label: 'CFO Review',     value: 43,  x: 580, y: 160, width: NODE_W, height: 50,  color: '#a855f7', icon: Users,       detail: '43 high-value (>$2,000)' },
];

const LINKS: SankeyLink[] = [
  { id: 'l1', source: 'submitted', target: 'manager', value: 612, color: '#6366f1' },
  { id: 'l2', source: 'submitted', target: 'auto',    value: 235, color: '#10b981' },
  { id: 'l3', source: 'manager',   target: 'approved', value: 541, color: '#8b5cf6' },
  { id: 'l4', source: 'manager',   target: 'rejected', value: 71,  color: '#ef4444' },
  { id: 'l5', source: 'auto',      target: 'approved', value: 235, color: '#10b981' },
  { id: 'l6', source: 'approved',  target: 'paid',     value: 498, color: '#10b981' },
  { id: 'l7', source: 'approved',  target: 'cfo',      value: 43,  color: '#a855f7' },
  { id: 'l8', source: 'submitted', target: 'pending',  value: 35,  color: '#f59e0b' },
];

// Smooth cubic bezier path between source and target nodes
function getLinkPath(link: SankeyLink, nodes: Record<string, SankeyNode>): string {
  const src = nodes[link.source];
  const tgt = nodes[link.target];
  if (!src || !tgt) return '';
  const x1 = src.x + src.width;
  const y1 = src.y + src.height / 2;
  const x2 = tgt.x;
  const y2 = tgt.y + tgt.height / 2;
  const cx = (x1 + x2) / 2;
  return `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
}

// Sample point on cubic bezier at t
function bezierPoint(t: number, src: SankeyNode, tgt: SankeyNode): { x: number; y: number } {
  const x1 = src.x + src.width;
  const y1 = src.y + src.height / 2;
  const x2 = tgt.x;
  const y2 = tgt.y + tgt.height / 2;
  const cx = (x1 + x2) / 2;
  // Cubic bezier: P = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t)t^2 P2 + t^3 P3
  // Using control points: P0=(x1,y1), P1=(cx,y1), P2=(cx,y2), P3=(x2,y2)
  const mt = 1 - t;
  const x = mt * mt * mt * x1 + 3 * mt * mt * t * cx + 3 * mt * t * t * cx + t * t * t * x2;
  const y = mt * mt * mt * y1 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y2;
  return { x, y };
}

export const ApprovalSankey: React.FC = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<SankeyNode | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);
  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));

  // Spawn particles continuously
  useEffect(() => {
    const spawn = () => {
      const link = LINKS[Math.floor(Math.random() * LINKS.length)];
      const newP: Particle = {
        id: particleIdRef.current++,
        linkId: link.id,
        progress: 0,
        speed: 0.003 + Math.random() * 0.004,
      };
      setParticles(prev => [...prev.slice(-40), newP]);
    };

    const spawnInterval = setInterval(spawn, 280);
    return () => clearInterval(spawnInterval);
  }, []);

  // Animate particles
  useEffect(() => {
    let rafId: number;
    const animate = () => {
      setParticles(prev =>
        prev
          .map(p => ({ ...p, progress: p.progress + p.speed }))
          .filter(p => p.progress < 1)
      );
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const isLinkedToHover = useCallback((link: SankeyLink) => {
    if (!hoveredNode) return false;
    return link.source === hoveredNode || link.target === hoveredNode;
  }, [hoveredNode]);

  return (
    <div className="border border-white/5 bg-[#0d0d0d] rounded-2xl p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-zinc-200">Approval Flow</h3>
        <span className="ml-auto text-xs text-zinc-600">847 expenses this month · live</span>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minWidth: 560 }}
        >
          {/* Defs */}
          <defs>
            {LINKS.map(link => (
              <linearGradient key={link.id} id={`grad-${link.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={nodeMap[link.source]?.color || '#6366f1'} stopOpacity="0.5" />
                <stop offset="100%" stopColor={nodeMap[link.target]?.color || '#8b5cf6'} stopOpacity="0.5" />
              </linearGradient>
            ))}
          </defs>

          {/* Links */}
          {LINKS.map(link => {
            const path = getLinkPath(link, nodeMap);
            const highlighted = isLinkedToHover(link);
            const strokeW = Math.max(2, (link.value / 847) * 16);
            return (
              <g key={link.id}>
                <path
                  d={path}
                  fill="none"
                  stroke={`url(#grad-${link.id})`}
                  strokeWidth={strokeW}
                  opacity={hoveredNode ? (highlighted ? 1 : 0.1) : 0.45}
                  strokeLinecap="round"
                  className="transition-opacity duration-300"
                />
                {/* Highlight overlay for hovered */}
                {highlighted && (
                  <path
                    d={path}
                    fill="none"
                    stroke={link.color}
                    strokeWidth={strokeW + 2}
                    opacity={0.6}
                    strokeLinecap="round"
                    className="transition-all duration-200"
                  />
                )}
              </g>
            );
          })}

          {/* Particles */}
          {particles.map(p => {
            const link = LINKS.find(l => l.id === p.linkId);
            if (!link) return null;
            const src = nodeMap[link.source];
            const tgt = nodeMap[link.target];
            if (!src || !tgt) return null;
            const pos = bezierPoint(p.progress, src, tgt);
            const isVisible = !hoveredNode || isLinkedToHover(link);
            return (
              <circle
                key={p.id}
                cx={pos.x}
                cy={pos.y}
                r={2.5}
                fill={link.color}
                opacity={isVisible ? 0.9 : 0.1}
                style={{ filter: `drop-shadow(0 0 4px ${link.color})` }}
              />
            );
          })}

          {/* Nodes */}
          {NODES.map(node => {
            const isHovered = hoveredNode === node.id;
            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(n => n?.id === node.id ? null : node)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={node.x} y={node.y}
                  width={node.width} height={node.height}
                  rx={8}
                  fill={node.color}
                  fillOpacity={isHovered ? 0.3 : 0.15}
                  stroke={node.color}
                  strokeOpacity={isHovered ? 1 : 0.4}
                  strokeWidth={isHovered ? 2 : 1}
                  className="transition-all duration-200"
                  style={isHovered ? { filter: `drop-shadow(0 0 12px ${node.color}80)` } : undefined}
                />
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2 - 8}
                  textAnchor="middle"
                  className="text-xs font-semibold"
                  fill={node.color}
                  fontSize="9"
                  fontWeight="600"
                >
                  {node.label}
                </text>
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2 + 8}
                  textAnchor="middle"
                  fill="white"
                  fontSize="13"
                  fontWeight="700"
                  opacity={0.9}
                >
                  {node.value.toLocaleString()}
                </text>
                <text
                  x={node.x + node.width / 2}
                  y={node.y + node.height / 2 + 20}
                  textAnchor="middle"
                  fill="white"
                  fontSize="8"
                  opacity={0.4}
                >
                  {Math.round((node.value / 847) * 100)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected node detail */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            className="overflow-hidden mt-3"
          >
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
              style={{ borderColor: `${selectedNode.color}30`, background: `${selectedNode.color}08` }}>
              <div className="w-4 h-4 flex-shrink-0" style={{ color: selectedNode.color }}>
                <selectedNode.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: selectedNode.color }}>{selectedNode.label}</p>
                <p className="text-xs text-zinc-500">{selectedNode.detail}</p>
              </div>
              <button onClick={() => setSelectedNode(null)} className="ml-auto text-zinc-600 hover:text-zinc-400 text-xs">× Dismiss</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
