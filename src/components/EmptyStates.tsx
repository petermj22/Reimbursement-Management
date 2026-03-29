// =============================================================
// INTELLIGENT EMPTY STATES - Contextual, animated, smart
// Covers: first-time, filtered-empty, network-error, role-based
// =============================================================
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus, RefreshCw, WifiOff, Filter, X, Inbox, FileText,
  CheckSquare, BarChart3, ArrowRight, Sparkles, ChevronRight,
  Receipt, Clock, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// ---- Micro-animated SVG Illustrations ----
const FloatingReceiptIllustration: React.FC = () => (
  <motion.svg
    width="120" height="120" viewBox="0 0 120 120" fill="none"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="mx-auto mb-6"
    aria-hidden="true"
  >
    {/* Glow */}
    <motion.circle cx="60" cy="60" r="50" fill="rgba(99,102,241,0.07)" animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} />

    {/* Receipt body */}
    <motion.rect x="32" y="22" width="56" height="76" rx="6" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5"
      animate={{ y: [22, 19, 22] }} transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }} />

    {/* Receipt lines */}
    {[38, 48, 58, 68, 76].map((y, i) => (
      <motion.rect key={y} x="42" y={y} width={i === 4 ? 20 : 36} height="3" rx="1.5" fill="rgba(139,92,246,0.4)"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }} style={{ originX: 0 }} />
    ))}

    {/* Sparkle top-right */}
    <motion.g animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}>
      <Sparkles className="text-indigo-400" style={{ transform: 'translate(78px, 18px)' }} />
    </motion.g>

    {/* Plus badge */}
    <motion.circle cx="85" cy="35" r="12" fill="rgba(99,102,241,0.9)"
      animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }} />
    <text x="85" y="40" textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">+</text>
  </motion.svg>
);

const FilterEmptyIllustration: React.FC = () => (
  <motion.svg
    width="100" height="100" viewBox="0 0 100 100" fill="none"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="mx-auto mb-5"
    aria-hidden="true"
  >
    <motion.circle cx="50" cy="50" r="42" fill="rgba(245,158,11,0.06)" stroke="rgba(245,158,11,0.15)" strokeWidth="1.5"
      animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3 }} />
    <motion.path d="M30 35h40M35 50h30M40 65h20" stroke="rgba(245,158,11,0.5)" strokeWidth="3" strokeLinecap="round"
      animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
    <motion.circle cx="68" cy="65" r="10" fill="rgba(239,68,68,0.2)" stroke="rgba(239,68,68,0.5)" strokeWidth="1.5"
      animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
    <path d="M64 61l8 8M72 61l-8 8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
  </motion.svg>
);

const OfflineIllustration: React.FC = () => (
  <motion.svg
    width="100" height="100" viewBox="0 0 100 100" fill="none"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    className="mx-auto mb-5"
    aria-hidden="true"
  >
    {/* Wifi arcs that go dark */}
    {[50, 35, 22].map((r, i) => (
      <motion.circle key={i} cx="50" cy="55" r={r} fill="none" stroke={i === 0 ? '#374151' : 'rgba(75,85,99,0.3)'} strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray="40 100" strokeDashoffset={-25}
        animate={{ opacity: i === 0 ? 1 : [0.3, 0.7, 0.3] }}
        transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }} />
    ))}
    <motion.circle cx="50" cy="55" r="5" fill="#374151" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
    {/* Lightning slash */}
    <motion.line x1="25" y1="25" x2="75" y2="75" stroke="#ef4444" strokeWidth="3" strokeLinecap="round"
      animate={{ opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 1.5 }} />
  </motion.svg>
);

// ---- Tutorial Step component ----
interface TutorialStep {
  icon: React.FC<{ className?: string }>;
  label: string;
  desc: string;
}

const TutorialSteps: React.FC<{ steps: TutorialStep[] }> = ({ steps }) => (
  <div className="flex items-start gap-0 mt-6 max-w-sm mx-auto">
    {steps.map((step, i) => (
      <React.Fragment key={i}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.15 }}
          className="flex flex-col items-center text-center flex-1"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center mb-2">
            <step.icon className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-[11px] font-semibold text-zinc-300">{step.label}</p>
          <p className="text-[10px] text-zinc-600 mt-0.5">{step.desc}</p>
        </motion.div>
        {i < steps.length - 1 && (
          <div className="flex-shrink-0 mt-4 px-1">
            <ChevronRight className="w-3 h-3 text-zinc-700" />
          </div>
        )}
      </React.Fragment>
    ))}
  </div>
);

// ---- Filter suggestion chip ----
const SuggestionChip: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="px-3 py-1.5 rounded-full text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors"
  >
    {label}
  </motion.button>
);

// ---- MAIN EMPTY STATE TYPES ----

// 1. First-time / no expenses at all
export const FirstTimeEmptyState: React.FC<{ onAction?: () => void }> = ({ onAction }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const employeeSteps: TutorialStep[] = [
    { icon: Receipt, label: 'Upload Receipt', desc: 'Photo or PDF' },
    { icon: Sparkles, label: 'AI Fills Form', desc: 'Auto-categorized' },
    { icon: CheckSquare, label: 'Submit', desc: 'Notified instantly' },
  ];

  const managerSteps: TutorialStep[] = [
    { icon: Inbox, label: 'Review Queue', desc: 'All pending items' },
    { icon: FileText, label: 'Examine Details', desc: 'Receipts & notes' },
    { icon: CheckSquare, label: 'Approve / Reject', desc: 'One-click action' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <FloatingReceiptIllustration />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        {isEmployee ? (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Submit Your First Expense 🎉</h2>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
              Upload a receipt and our AI will automatically categorize it, extract the amount, and fill in the form for you.
            </p>
          </>
        ) : isManager ? (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Your Approval Queue is Clear ✅</h2>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
              No pending approvals at the moment. Expenses will appear here when your team submits them.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Welcome to ReimburseFlow 👋</h2>
            <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
              Your enterprise expense management platform. Start by inviting your team or submitting an expense.
            </p>
          </>
        )}
      </motion.div>

      {isEmployee && <TutorialSteps steps={employeeSteps} />}
      {isManager && <TutorialSteps steps={managerSteps} />}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-8 flex items-center gap-3"
      >
        {isEmployee && (
          <Button
            onClick={onAction || (() => navigate('/expenses/new'))}
            className="gap-2 px-6 h-10 text-sm font-semibold animate-pulse-slow"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <Plus className="w-4 h-4" />
            Submit First Expense
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}
        {isManager && (
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="gap-2 text-sm border-white/10">
            <BarChart3 className="w-4 h-4" /> View Dashboard
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
};

// 2. Filter result empty — smart suggestions
interface FilterEmptyStateProps {
  activeFilters: { label: string; key: string }[];
  onClearFilter: (key: string) => void;
  onClearAll: () => void;
  alternativeCount?: { label: string; href: string; count: number };
}

export const FilterEmptyState: React.FC<FilterEmptyStateProps> = ({
  activeFilters,
  onClearFilter,
  onClearAll,
  alternativeCount,
}) => {
  const navigate = useNavigate();
  const [undone, setUndone] = useState(false);

  const handleClearAll = () => {
    onClearAll();
    setUndone(true);
    setTimeout(() => setUndone(false), 3500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <FilterEmptyIllustration />
      <h2 className="text-lg font-bold text-white mb-2">No results for your filters</h2>
      <p className="text-sm text-zinc-500 mb-5 max-w-xs">
        Try removing one filter at a time to find what you're looking for.
      </p>

      {/* Active filter suggestions to remove */}
      {activeFilters.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-2 justify-center mb-5">
          {activeFilters.map(f => (
            <SuggestionChip key={f.key} label={`Remove "${f.label}" filter`} onClick={() => onClearFilter(f.key)} />
          ))}
        </motion.div>
      )}

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleClearAll}
          className="h-8 text-xs gap-1.5" style={{ background: 'var(--gradient-primary)' }}>
          <X className="w-3 h-3" /> Clear All Filters
        </Button>
        {alternativeCount && (
          <Button variant="outline" size="sm" onClick={() => navigate(alternativeCount.href)}
            className="h-8 text-xs border-white/10 text-zinc-400">
            {alternativeCount.count} {alternativeCount.label}
          </Button>
        )}
      </div>

      {/* Undo toast */}
      <AnimatePresence>
        {undone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 flex items-center gap-2 text-xs text-zinc-500 bg-white/5 border border-white/8 px-3 py-2 rounded-full"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            All filters cleared — showing all expenses
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 3. Network error / offline state — auto-retry countdown
interface NetworkErrorStateProps {
  error?: string;
  onRetry: () => void;
  cachedDataAvailable?: boolean;
}

export const NetworkErrorState: React.FC<NetworkErrorStateProps> = ({
  error,
  onRetry,
  cachedDataAvailable = false,
}) => {
  const [countdown, setCountdown] = useState(15);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = React.useCallback(async () => {
    setRetrying(true);
    await new Promise(r => setTimeout(r, 1200));
    onRetry();
    setRetrying(false);
    setCountdown(15);
  }, [onRetry]);

  useEffect(() => {
    if (countdown <= 0) {
      handleRetry();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, handleRetry]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <OfflineIllustration />
      <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
        <WifiOff className="w-5 h-5 text-zinc-500" />
        {navigator.onLine ? 'Server Unreachable' : 'You are Offline'}
      </h2>
      <p className="text-sm text-zinc-500 mb-2 max-w-xs">
        {error || "We couldn't reach the server. Your work is safe — we'll sync everything when you're back."}
      </p>

      {cachedDataAvailable && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-2 rounded-xl mb-5"
        >
          <Clock className="w-3.5 h-3.5" />
          Showing cached data — may be out of date
        </motion.div>
      )}

      <div className="flex items-center gap-3 mt-2">
        <Button
          size="sm"
          onClick={handleRetry}
          disabled={retrying}
          className="h-9 text-xs gap-2 px-5"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Retrying...' : `Retry now`}
        </Button>
        <div className="text-xs text-zinc-700">
          Auto-retry in <span className="font-mono text-zinc-500 font-bold">{countdown}s</span>
        </div>
      </div>

      {/* Progress bar for countdown */}
      <div className="mt-4 w-40 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-indigo-500/60 rounded-full"
          initial={{ width: '100%' }}
          animate={{ width: `${(countdown / 15) * 100}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
};

// 4. Role-specific dashboard empty for specific entities
interface RoleEmptyStateProps {
  entity: 'approvals' | 'users' | 'analytics';
}

export const RoleEmptyState: React.FC<RoleEmptyStateProps> = ({ entity }) => {
  const icons: Record<string, React.FC<{ className?: string }>> = {
    approvals: CheckSquare,
    users: Filter,
    analytics: BarChart3,
  };
  const messages: Record<string, { title: string; desc: string }> = {
    approvals: { title: 'All Caught Up! 🎉', desc: 'There are no pending approvals right now. Check back when your team submits new expenses.' },
    users: { title: 'No Users Found', desc: 'Try adjusting your search or invite new team members to get started.' },
    analytics: { title: 'No Data Yet', desc: 'Analytics will populate once expenses are submitted. Start by adding your first expense.' },
  };
  const Icon = icons[entity];
  const msg = messages[entity];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-5"
      >
        <Icon className="w-7 h-7 text-indigo-400" />
      </motion.div>
      <h2 className="text-lg font-bold text-white mb-2">{msg.title}</h2>
      <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">{msg.desc}</p>
    </motion.div>
  );
};

// 5. General SmartEmpty — picks the right state automatically
interface SmartEmptyProps {
  type: 'first-time' | 'filter' | 'network' | 'role';
  roleEntity?: 'approvals' | 'users' | 'analytics';
  filterProps?: FilterEmptyStateProps;
  networkProps?: NetworkErrorStateProps;
}

export const SmartEmpty: React.FC<SmartEmptyProps> = ({ type, roleEntity, filterProps, networkProps }) => {
  switch (type) {
    case 'first-time': return <FirstTimeEmptyState />;
    case 'filter': return filterProps ? <FilterEmptyState {...filterProps} /> : null;
    case 'network': return networkProps ? <NetworkErrorState {...networkProps} /> : null;
    case 'role': return roleEntity ? <RoleEmptyState entity={roleEntity} /> : null;
    default: return null;
  }
};
