// =============================================================
// CORE WEB VITALS FOOTER - Live metrics with color-coded ratings
// =============================================================
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ChevronUp, ChevronDown, Zap, Shield, Lock } from 'lucide-react';
import { measureWebVitals, type WebVitals } from '@/lib/webApis';

interface VitalRating {
  label: string;
  value: string;
  color: string;
  bgColor: string;
  rating: 'good' | 'needs-improvement' | 'poor';
}

function rateVital(name: keyof WebVitals, value: number | null): VitalRating {
  const formatMs = (v: number) => v < 1000 ? `${v}ms` : `${(v / 1000).toFixed(2)}s`;

  if (value === null) return { label: name.toUpperCase(), value: '—', color: 'text-zinc-600', bgColor: 'bg-zinc-800/50', rating: 'needs-improvement' };

  const thresholds: Record<string, { good: number; needs: number }> = {
    lcp: { good: 2500, needs: 4000 },
    fid: { good: 100, needs: 300 },
    cls: { good: 0.1, needs: 0.25 },
    ttfb: { good: 800, needs: 1800 },
    fcp: { good: 1800, needs: 3000 },
  };

  const t = thresholds[name];
  const displayValue = name === 'cls' ? value.toFixed(3) : formatMs(value);
  
  if (!t) return { label: name.toUpperCase(), value: displayValue, color: 'text-zinc-400', bgColor: 'bg-zinc-800/50', rating: 'needs-improvement' };

  let rating: VitalRating['rating'] = 'poor';
  let color = 'text-red-400';
  let bgColor = 'bg-red-500/10';
  if (value <= t.good) { rating = 'good'; color = 'text-emerald-400'; bgColor = 'bg-emerald-500/10'; }
  else if (value <= t.needs) { rating = 'needs-improvement'; color = 'text-amber-400'; bgColor = 'bg-amber-500/10'; }

  return { label: name.toUpperCase(), value: displayValue, color, bgColor, rating };
}

export const CoreWebVitalsFooter: React.FC = () => {
  const [vitals, setVitals] = useState<WebVitals>({ lcp: null, fid: null, cls: null, ttfb: null, fcp: null });
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Measure after a delay to let page settle
    const timer = setTimeout(() => {
      measureWebVitals(setVitals);
      setMounted(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const ratings = (Object.entries(vitals) as [keyof WebVitals, number | null][])
    .map(([key, val]) => ({ key, ...rateVital(key, val) }));

  const goodCount = ratings.filter(r => r.rating === 'good').length;
  const overallColor = goodCount >= 4 ? 'text-emerald-400' : goodCount >= 2 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="border-t border-white/5 bg-[#070707]">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Collapsed state — always visible bar */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between py-3 text-xs"
        >
          <div className="flex items-center gap-4">
            {/* Security badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-zinc-600 hover:text-zinc-400 transition-colors">
              <Lock className="w-3 h-3" />
              <span>TLS 1.3 · AES-256</span>
            </div>
            <div className="hidden sm:block w-px h-3 bg-white/10" />
            {/* Vitals summary */}
            <div className="flex items-center gap-2">
              <Activity className={`w-3 h-3 ${overallColor}`} />
              <span className={`font-medium ${overallColor}`}>
                {mounted ? `${goodCount}/5 Core Web Vitals passing` : 'Measuring vitals...'}
              </span>
            </div>
            {mounted && (
              <div className="hidden md:flex items-center gap-2">
                {ratings.slice(0, 3).map(r => (
                  <span key={r.key} className={`font-mono ${r.color} text-[11px]`}>
                    {r.key.toUpperCase()}: {r.value}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-zinc-600">
            <div className="hidden sm:flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              <span>ReimburseFlow v2.0</span>
            </div>
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </button>

        {/* Expanded vitals panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pb-6 pt-2 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {ratings.map((r, i) => (
                    <motion.div
                      key={r.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-3 rounded-xl border ${r.bgColor} ${r.rating === 'good' ? 'border-emerald-500/15' : r.rating === 'needs-improvement' ? 'border-amber-500/15' : 'border-red-500/15'}`}
                    >
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-semibold mb-1">{r.key}</p>
                      <p className={`text-lg font-bold font-mono ${r.color}`}>{r.value}</p>
                      <p className={`text-[10px] mt-0.5 capitalize ${r.color} opacity-70`}>{r.rating.replace('-', ' ')}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Thresholds legend */}
                <div className="flex flex-wrap gap-4 text-[10px] text-zinc-700">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" />Good • Fast</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" />Needs Improvement</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" />Poor</div>
                  <span className="ml-auto flex items-center gap-1"><Zap className="w-3 h-3 text-zinc-600" />Measured live in your browser</span>
                </div>

                {/* Encryption & headers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {[
                    { label: 'Protocol', value: 'TLS 1.3' },
                    { label: 'Cipher', value: 'AES-256-GCM' },
                    { label: 'HSTS', value: 'Enabled' },
                    { label: 'CSP', value: 'Strict' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded-lg border border-white/5">
                      <span className="text-zinc-600">{item.label}</span>
                      <span className="text-emerald-400 font-mono font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
