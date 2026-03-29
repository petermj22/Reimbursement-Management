// =============================================================
// 3D EXPENSE TIMELINE - React Three Fiber
// Date × Amount × Category in 3D space
// Rotate/zoom, click for detail modal, animated filter
// =============================================================
import React, { useMemo, useState, useRef, Suspense } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Text, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, ZoomIn, Layers } from 'lucide-react';

// ---- Types ----
interface ExpensePoint {
  id: string;
  date: Date;
  amount: number;
  category: string;
  description: string;
  employee: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
}

// ---- Mock Data ----
const CATEGORIES = ['Travel', 'Meals', 'Office', 'Software', 'Marketing', 'Training'];
const STATUSES: ExpensePoint['status'][] = ['pending', 'approved', 'rejected', 'paid'];
const CAT_COLORS: Record<string, string> = {
  Travel: '#6366f1', Meals: '#f59e0b', Office: '#10b981',
  Software: '#8b5cf6', Marketing: '#ec4899', Training: '#06b6d4',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444', paid: '#06b6d4',
};

function generateMockExpenses(): ExpensePoint[] {
  return Array.from({ length: 120 }, (_, i) => {
    const daysAgo = Math.floor(Math.random() * 180);
    return {
      id: `e${i}`,
      date: new Date(Date.now() - daysAgo * 86400000),
      amount: Math.round((Math.random() * 900 + 20) * 10) / 10,
      category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
      description: ['Team Lunch', 'Flight to NYC', 'Software License', 'Conference Fee',
        'Client Dinner', 'AWS Invoice', 'Hotel Stay', 'Office Supplies'][Math.floor(Math.random() * 8)],
      employee: ['John Smith', 'Sarah Chen', 'James R.', 'Priya K.'][Math.floor(Math.random() * 4)],
      status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
    };
  });
}

// ---- 3D Sphere Point ----
interface PointProps {
  expense: ExpensePoint;
  position: [number, number, number];
  colorBy: 'category' | 'status';
  onSelect: (e: ExpensePoint) => void;
  isSelected: boolean;
  isFiltered: boolean;
}

const ExpenseSphere: React.FC<PointProps> = ({ expense, position, colorBy, onSelect, isSelected, isFiltered }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const color = colorBy === 'category' ? CAT_COLORS[expense.category] : STATUS_COLORS[expense.status];
  const radius = Math.max(0.06, Math.min(0.22, expense.amount / 2000));

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Pulse/float animation for selected
      if (isSelected) {
        meshRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 3) * 0.05;
        meshRef.current.scale.setScalar(1.4);
      } else if (hovered) {
        meshRef.current.scale.setScalar(1.25);
      } else if (isFiltered) {
        meshRef.current.scale.setScalar(0.4);
      } else {
        meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(expense); }}
    >
      <sphereGeometry args={[radius, 14, 14]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isSelected ? 1.2 : hovered ? 0.8 : 0.3}
        transparent
        opacity={isFiltered ? 0.15 : 1}
        roughness={0.2}
        metalness={0.6}
      />
      {hovered && !isFiltered && (
        <Html distanceFactor={6} style={{ pointerEvents: 'none' }}>
          <div className="bg-[#111]/95 border border-white/10 rounded-xl px-3 py-2 text-xs whitespace-nowrap shadow-2xl backdrop-blur-sm" style={{ minWidth: 130 }}>
            <p className="font-bold text-white mb-0.5">{expense.description}</p>
            <p className="text-indigo-400 font-mono font-semibold">${expense.amount}</p>
            <p className="text-zinc-500 mt-0.5">{expense.category} · {expense.status}</p>
          </div>
        </Html>
      )}
    </mesh>
  );
};

// ---- Axis Labels ----
const AxisLabel: React.FC<{ position: [number, number, number]; text: string; color?: string }> = ({ position, text, color = '#6b7280' }) => (
  <Text position={position} fontSize={0.12} color={color} anchorX="center" anchorY="middle" font={undefined}>
    {text}
  </Text>
);

// ---- Scene ----
interface SceneProps {
  expenses: ExpensePoint[];
  colorBy: 'category' | 'status';
  categoryFilter: string | null;
  onSelect: (e: ExpensePoint) => void;
  selected: ExpensePoint | null;
}

const Scene: React.FC<SceneProps> = ({ expenses, colorBy, categoryFilter, onSelect, selected }) => {
  const now = Date.now();
  const sixMonthsAgo = now - 180 * 86400000;
  const maxAmount = Math.max(...expenses.map(e => e.amount));

  const points = useMemo(() => expenses.map(exp => {
    // X = time (−4 to +4), Y = amount (0 to 3), Z = category (−2 to +2)
    const t = (exp.date.getTime() - sixMonthsAgo) / (now - sixMonthsAgo);
    const x = t * 8 - 4;
    const y = (exp.amount / maxAmount) * 3;
    const catIdx = CATEGORIES.indexOf(exp.category);
    const z = (catIdx / (CATEGORIES.length - 1)) * 4 - 2;
    return { exp, pos: [x, y, z] as [number, number, number] };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [expenses]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color="#7c3aed" />
      <pointLight position={[-5, 3, -5]} intensity={0.8} color="#0f172a" />
      <directionalLight position={[0, 10, 5]} intensity={0.5} />

      {/* Axes */}
      <Grid args={[8, 8]} position={[0, -0.05, 0]} cellColor="#1e1e2e" sectionColor="#2d2d4e" fadeDistance={20} />

      {/* Axis labels */}
      <AxisLabel position={[0, -0.3, -2.8]} text="← Category →" color="#4f46e5" />
      <AxisLabel position={[-4.8, 1.5, 0]} text="Amount ↑" color="#10b981" />
      <AxisLabel position={[4.8, -0.3, 0]} text="Date →" color="#8b5cf6" />

      {/* Category Z-axis labels */}
      {CATEGORIES.map((cat, i) => {
        const z = (i / (CATEGORIES.length - 1)) * 4 - 2;
        return (
          <AxisLabel key={cat} position={[-4.8, -0.3, z]} text={cat} color={CAT_COLORS[cat]} />
        );
      })}

      {/* Data points */}
      {points.map(({ exp, pos }) => (
        <ExpenseSphere
          key={exp.id}
          expense={exp}
          position={pos}
          colorBy={colorBy}
          onSelect={onSelect}
          isSelected={selected?.id === exp.id}
          isFiltered={categoryFilter !== null && exp.category !== categoryFilter}
        />
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        minDistance={4}
        maxDistance={20}
        dampingFactor={0.05}
        enableDamping
      />
    </>
  );
};

// ---- Main Component ----
export const ExpenseTimeline3D: React.FC = () => {
  const expenses = useMemo(generateMockExpenses, []);
  const [colorBy, setColorBy] = useState<'category' | 'status'>('category');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<ExpensePoint | null>(null);
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="border border-white/5 bg-[#0a0a10] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-white/5">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> 3D Expense Timeline
          </h3>
          <p className="text-[11px] text-zinc-600 mt-0.5">Drag to rotate · Scroll to zoom · Click any point</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Color by toggle */}
          <div className="flex bg-white/5 rounded-lg p-0.5 gap-0.5">
            {(['category', 'status'] as const).map(opt => (
              <button key={opt} onClick={() => setColorBy(opt)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize ${
                  colorBy === opt ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}>
                {opt}
              </button>
            ))}
          </div>

          {/* Category filter pills */}
          <div className="flex gap-1 flex-wrap">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(prev => prev === cat ? null : cat)}
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all border"
                style={{
                  backgroundColor: categoryFilter === cat ? `${CAT_COLORS[cat]}30` : 'transparent',
                  borderColor: `${CAT_COLORS[cat]}40`,
                  color: CAT_COLORS[cat],
                }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Reset camera */}
          <button onClick={() => setResetKey(k => k + 1)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/8 text-zinc-500 hover:text-zinc-300 transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="h-[380px] relative">
        <Canvas
          key={resetKey}
          camera={{ position: [6, 4, 8], fov: 55 }}
          style={{ background: 'transparent' }}
          dpr={[1, 1.5]}
        >
          <Suspense fallback={null}>
            <Scene
              expenses={expenses}
              colorBy={colorBy}
              categoryFilter={categoryFilter}
              onSelect={setSelected}
              selected={selected}
            />
          </Suspense>
        </Canvas>

        {/* Legend overlay */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1">
          {(colorBy === 'category' ? Object.entries(CAT_COLORS) : Object.entries(STATUS_COLORS)).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-zinc-500 capitalize">{key}</span>
            </div>
          ))}
        </div>

        {/* Axis legend */}
        <div className="absolute top-3 right-3 text-[10px] text-zinc-700 space-y-0.5">
          <div><span className="text-indigo-400">X</span> = Time (180 days)</div>
          <div><span className="text-emerald-400">Y</span> = Amount</div>
          <div><span className="text-purple-400">Z</span> = Category</div>
          <div className="text-zinc-600">Size = Amount</div>
        </div>
      </div>

      {/* Selected expense detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="border-t border-white/5 bg-white/[0.02] px-5 py-4 flex items-center gap-4"
          >
            <div
              className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-xs"
              style={{ backgroundColor: `${CAT_COLORS[selected.category]}20`, color: CAT_COLORS[selected.category] }}
            >
              {selected.category[0]}
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><p className="text-zinc-600 mb-0.5">Description</p><p className="text-zinc-200 font-medium">{selected.description}</p></div>
              <div><p className="text-zinc-600 mb-0.5">Amount</p><p className="text-indigo-400 font-mono font-bold text-sm">${selected.amount}</p></div>
              <div><p className="text-zinc-600 mb-0.5">Category</p><p style={{ color: CAT_COLORS[selected.category] }}>{selected.category}</p></div>
              <div><p className="text-zinc-600 mb-0.5">Status</p><p style={{ color: STATUS_COLORS[selected.status] }} className="capitalize">{selected.status}</p></div>
            </div>
            <button onClick={() => setSelected(null)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
