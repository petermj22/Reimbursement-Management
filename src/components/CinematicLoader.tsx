import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Shield } from 'lucide-react';

const LOADING_STEPS = [
  { message: "Initializing enterprise workspace...", icon: "🏢", duration: 600 },
  { message: "Loading expense records...", icon: "💳", duration: 500 },
  { message: "Syncing approval workflows...", icon: "✅", duration: 500 },
  { message: "Establishing secure connection...", icon: "🔒", duration: 500 },
  { message: "Calibrating analytics engine...", icon: "📊", duration: 400 },
  { message: "All systems ready.", icon: "🚀", duration: 0 },
];

// Particle component for the background effect
const Particle: React.FC<{ index: number }> = ({ index }) => {
  const size = Math.random() * 3 + 1;
  const startX = `${Math.random() * 100}%`;
  const startY = `${Math.random() * 100}%`;
  const duration = Math.random() * 10 + 8;
  const delay = Math.random() * 5;

  return (
    <motion.div
      className="absolute rounded-full bg-indigo-400/30 pointer-events-none"
      style={{ width: size, height: size, left: startX, top: startY }}
      animate={{
        y: [0, -60, 0],
        x: [0, Math.random() * 40 - 20, 0],
        opacity: [0, 0.8, 0],
        scale: [0, 1.5, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      key={index}
    />
  );
};

// Animated number counter
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: "easeOut" });
    const unsubscribe = rounded.on("change", (v) => setDisplay(v as number));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }); // intentionally runs when value changes — motion values are stable refs

  return <span>{display}</span>;
};

export const CinematicLoader: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const progressRef = useRef(0);

  useEffect(() => {
    let cumulativeTime = 0;
    const totalDuration = LOADING_STEPS.reduce((sum, s) => sum + s.duration, 0) + 400;

    LOADING_STEPS.forEach((step, idx) => {
      if (idx === 0) {
        // First step is immediate
        setTimeout(() => {
          setStepIndex(idx);
          progressRef.current = ((idx + 1) / LOADING_STEPS.length) * 100;
          setProgress(progressRef.current);
        }, 300);
      } else {
        cumulativeTime += LOADING_STEPS[idx - 1].duration;
        const delay = cumulativeTime + 300;
        setTimeout(() => {
          setStepIndex(idx);
          progressRef.current = ((idx + 1) / LOADING_STEPS.length) * 100;
          setProgress(progressRef.current);
        }, delay);
      }
    });

    // Begin exit after all steps complete
    setTimeout(() => {
      setIsExiting(true);
    }, totalDuration + 100);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, filter: "blur(12px)", transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#030306] overflow-hidden"
    >
      {/* Animated particle field */}
      <div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <Particle key={i} index={i} />
        ))}
      </div>

      {/* Sweeping light beams */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="absolute top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent"
          animate={{ scaleY: [0, 1, 0], x: [-200, 200] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
        />
        <motion.div
          className="absolute top-0 left-2/3 w-px h-full bg-gradient-to-b from-transparent via-purple-500/10 to-transparent"
          animate={{ scaleY: [0, 1, 0], x: [200, -200] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 2 }}
        />
      </motion.div>

      {/* Central ambient glow - breathes with the loading */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)"
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-8">
        {/* Logo with orbital rings */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 30, filter: "blur(20px)" }}
          animate={{ scale: 1, opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-16 flex items-center justify-center"
        >
          {/* Three orbital rings at different speeds */}
          <motion.div
            className="absolute w-32 h-32 rounded-full border border-indigo-500/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-400/60 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
          </motion.div>
          <motion.div
            className="absolute w-20 h-20 rounded-full border border-purple-500/15"
            animate={{ rotate: -360 }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-purple-400/60 shadow-[0_0_4px_rgba(167,139,250,0.8)]" />
          </motion.div>
          <motion.div
            className="absolute w-44 h-44 rounded-full border border-indigo-400/8"
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-1 rounded-full bg-blue-400/50" />
          </motion.div>

          {/* Logo icon */}
          <div className="relative w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-[0_0_60px_rgba(79,70,229,0.2),inset_0_0_20px_rgba(99,102,241,0.05)] overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-indigo-600/30 via-purple-600/20 to-transparent"
              animate={{ opacity: [0.5, 1, 0.5], rotate: [0, 360] }}
              transition={{ opacity: { duration: 2, repeat: Infinity }, rotate: { duration: 8, repeat: Infinity, ease: "linear" } }}
            />
            <Shield className="w-8 h-8 text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
          </div>
        </motion.div>

        {/* App name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center mb-10"
        >
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
            Reimburse<span className="text-indigo-400">Flow</span>
          </h1>
          <p className="text-xs text-zinc-600 tracking-widest uppercase">Enterprise Edition</p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="w-full mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="relative w-full h-[2px] bg-white/[0.06] rounded-full overflow-visible">
            {/* Glow trail */}
            <motion.div
              className="absolute top-0 bottom-0 left-0 rounded-full"
              style={{
                background: "linear-gradient(90deg, #4f46e5, #7c3aed, #6366f1)",
                boxShadow: "0 0 20px 4px rgba(99,102,241,0.6), 0 0 8px 2px rgba(139,92,246,0.4)",
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", damping: 30, stiffness: 80, mass: 0.5 }}
            />
            {/* Leading dot */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8),0_0_20px_rgba(99,102,241,0.5)]"
              initial={{ left: "0%" }}
              animate={{ left: `calc(${progress}% - 6px)` }}
              transition={{ type: "spring", damping: 30, stiffness: 80, mass: 0.5 }}
            />
          </div>

          {/* Percentage */}
          <div className="flex justify-between mt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={stepIndex}
                initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 10, filter: "blur(4px)" }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="text-sm"
                >
                  {LOADING_STEPS[stepIndex].icon}
                </motion.span>
                <span className="text-xs text-zinc-500 font-mono">{LOADING_STEPS[stepIndex].message}</span>
              </motion.div>
            </AnimatePresence>
            <span className="text-xs text-zinc-600 font-mono tabular-nums">
              <AnimatedCounter value={Math.round(progress)} />%
            </span>
          </div>
        </motion.div>

        {/* Step indicators */}
        <motion.div
          className="flex gap-1.5 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {LOADING_STEPS.map((_, i) => (
            <motion.div
              key={i}
              className="h-[2px] rounded-full"
              initial={{ width: 16, backgroundColor: "rgba(255,255,255,0.08)" }}
              animate={{
                width: i <= stepIndex ? 24 : 16,
                backgroundColor: i < stepIndex
                  ? "rgba(99,102,241,0.8)"
                  : i === stepIndex
                  ? "rgba(255,255,255,0.9)"
                  : "rgba(255,255,255,0.08)",
                boxShadow: i === stepIndex ? "0 0 8px rgba(255,255,255,0.6)" : "none",
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};
