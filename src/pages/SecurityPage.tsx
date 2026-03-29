// =============================================================
// SECURITY DASHBOARD - Sessions, Audit Trail, GDPR, Encryption
// =============================================================
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, Globe, Smartphone, Monitor, AlertTriangle,
  CheckCircle2, XCircle, Clock, Download, Trash2, Eye, EyeOff,
  Key, RefreshCw, Activity, MapPin, ChevronDown, ChevronRight,
  FileText, User, Settings, LogOut, Zap, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { saveFileToSystem } from '@/lib/webApis';

// ---- Mock Security Data ----
const MOCK_SESSIONS = [
  { id: 's1', device: 'Chrome on Windows', location: 'Mumbai, IN', ip: '103.21.xxx.xxx', lastActive: new Date(Date.now() - 2 * 60 * 1000), current: true, icon: 'monitor' },
  { id: 's2', device: 'Safari on iPhone 15', location: 'Delhi, IN', ip: '49.36.xxx.xxx', lastActive: new Date(Date.now() - 3600 * 2 * 1000), current: false, icon: 'mobile' },
  { id: 's3', device: 'Firefox on macOS', location: 'Bengaluru, IN', ip: '122.161.xxx.xxx', lastActive: new Date(Date.now() - 86400 * 2 * 1000), current: false, icon: 'monitor' },
];

const MOCK_AUDIT_TRAIL = [
  { id: 'a1', action: 'EXPENSE_SUBMITTED', user: 'John Smith', details: 'Submitted expense #EXP-1042 for $234.50', timestamp: new Date(Date.now() - 5 * 60 * 1000), severity: 'info', category: 'expense' },
  { id: 'a2', action: 'LOGIN_SUCCESS', user: 'Admin User', details: 'Logged in from Chrome/Windows · Mumbai', timestamp: new Date(Date.now() - 20 * 60 * 1000), severity: 'info', category: 'auth' },
  { id: 'a3', action: 'EXPENSE_APPROVED', user: 'James Rodriguez', details: 'Approved expense #EXP-1039 ($89.00)', timestamp: new Date(Date.now() - 45 * 60 * 1000), severity: 'success', category: 'approval' },
  { id: 'a4', action: 'LOGIN_FAILED', user: 'unknown@evil.com', details: 'Failed login attempt from 185.220.xxx.xxx (TOR exit node)', timestamp: new Date(Date.now() - 2 * 3600 * 1000), severity: 'warning', category: 'auth' },
  { id: 'a5', action: 'USER_ROLE_CHANGED', user: 'Admin User', details: 'Changed Jane Doe role from employee → manager', timestamp: new Date(Date.now() - 5 * 3600 * 1000), severity: 'warning', category: 'admin' },
  { id: 'a6', action: 'BULK_EXPORT', user: 'Finance Manager', details: 'Exported 847 expense records to CSV', timestamp: new Date(Date.now() - 86400 * 1000), severity: 'info', category: 'data' },
  { id: 'a7', action: 'EXPENSE_REJECTED', user: 'James Rodriguez', details: 'Rejected expense #EXP-1038 — duplicate detected', timestamp: new Date(Date.now() - 86400 * 1.5 * 1000), severity: 'error', category: 'approval' },
  { id: 'a8', action: 'SETTINGS_CHANGED', user: 'Admin User', details: 'Updated approval threshold from $500 → $750', timestamp: new Date(Date.now() - 86400 * 2 * 1000), severity: 'warning', category: 'admin' },
];

const ENCRYPTION_SPECS = [
  { label: 'Data in Transit', value: 'TLS 1.3 + HSTS', icon: Lock, secure: true },
  { label: 'Data at Rest', value: 'AES-256-GCM', icon: Database, secure: true },
  { label: 'Passwords', value: 'bcrypt (cost=12)', icon: Key, secure: true },
  { label: 'API Tokens', value: 'JWT RS256', icon: Shield, secure: true },
  { label: 'Session Storage', value: 'PBKDF2 + Salt', icon: Zap, secure: true },
];

const ACTION_COLORS: Record<string, string> = {
  info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  error: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  expense: FileText,
  auth: Shield,
  approval: CheckCircle2,
  admin: Settings,
  data: Database,
};

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ---- Sub-Component: Active Sessions ----
const ActiveSessions: React.FC = () => {
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [terminating, setTerminating] = useState<string | null>(null);

  const terminateSession = async (id: string) => {
    setTerminating(id);
    await new Promise(r => setTimeout(r, 800));
    setSessions(prev => prev.filter(s => s.id !== id));
    toast.success('Session terminated successfully');
    setTerminating(null);
  };

  const terminateAll = async () => {
    const others = sessions.filter(s => !s.current);
    for (const s of others) {
      setTerminating(s.id);
      await new Promise(r => setTimeout(r, 400));
      setSessions(prev => prev.filter(p => p.id !== s.id));
    }
    setTerminating(null);
    toast.success('All other sessions terminated');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" /> Active Sessions
          <span className="text-xs text-zinc-600 font-normal">({sessions.length} device{sessions.length !== 1 ? 's' : ''})</span>
        </h3>
        {sessions.length > 1 && (
          <Button variant="outline" size="sm" onClick={terminateAll}
            className="h-7 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40">
            <LogOut className="w-3 h-3 mr-1" /> End All Others
          </Button>
        )}
      </div>

      <AnimatePresence>
        {sessions.map((session) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${session.current ? 'bg-blue-500/15 border border-blue-500/20' : 'bg-zinc-800 border border-white/5'}`}>
              {session.icon === 'mobile'
                ? <Smartphone className={`w-4 h-4 ${session.current ? 'text-blue-400' : 'text-zinc-500'}`} />
                : <Monitor className={`w-4 h-4 ${session.current ? 'text-blue-400' : 'text-zinc-500'}`} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-zinc-200 truncate">{session.device}</p>
                {session.current && (
                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-semibold">This device</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-600">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{session.location}</span>
                <span>·</span>
                <span className="font-mono">{session.ip}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(session.lastActive)}</span>
              </div>
            </div>
            {!session.current && (
              <Button
                variant="ghost" size="sm"
                onClick={() => terminateSession(session.id)}
                disabled={terminating === session.id}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-3 text-xs text-red-400 hover:bg-red-500/10"
              >
                {terminating === session.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                {terminating === session.id ? 'Ending...' : 'End'}
              </Button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// ---- Sub-Component: Audit Trail ----
const AuditTrail: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = ['all', 'auth', 'expense', 'approval', 'admin', 'data'];
  const filtered = filter === 'all' ? MOCK_AUDIT_TRAIL : MOCK_AUDIT_TRAIL.filter(a => a.category === filter);

  const handleExport = async () => {
    const headers = ['Timestamp', 'Action', 'User', 'Details', 'Severity'];
    const rows = filtered.map(a => [
      a.timestamp.toISOString(),
      a.action,
      `"${a.user}"`,
      `"${a.details.replace(/"/g, '""')}"`,
      a.severity,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    await saveFileToSystem(csv, `audit_trail_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    toast.success('Audit trail exported');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" /> Audit Trail
        </h3>
        <Button variant="outline" size="sm" onClick={handleExport}
          className="h-7 text-xs border-white/10 text-zinc-400 hover:text-white">
          <Download className="w-3 h-3 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filter === cat ? 'bg-purple-600/80 text-white' : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
        {filtered.map((entry, i) => {
          const Icon = CATEGORY_ICONS[entry.category] || Activity;
          const isExpanded = expanded === entry.id;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group"
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : entry.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors text-left"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${ACTION_COLORS[entry.severity]}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-zinc-400">{entry.action}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${ACTION_COLORS[entry.severity]}`}>{entry.severity}</span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-0.5 truncate">{entry.user} · {timeAgo(entry.timestamp)}</p>
                </div>
                <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} className="flex-shrink-0">
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                </motion.div>
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-10 mr-4 mb-2 px-3 py-2.5 bg-white/[0.02] rounded-lg border border-white/5 text-xs text-zinc-400 leading-relaxed">
                      <strong className="text-zinc-300">Details: </strong>{entry.details}
                      <br />
                      <strong className="text-zinc-500">Timestamp: </strong>
                      <span className="font-mono">{entry.timestamp.toLocaleString()}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ---- Sub-Component: Encryption Status ----
const EncryptionStatus: React.FC = () => (
  <div className="space-y-3">
    <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
      <Lock className="w-4 h-4 text-emerald-400" /> Encryption & Security
      <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" /> Fully Secured
      </span>
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {ENCRYPTION_SPECS.map((spec) => (
        <div key={spec.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 group">
          <spec.icon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-400 truncate">{spec.label}</p>
            <p className="text-xs font-mono font-semibold text-emerald-400 truncate">{spec.value}</p>
          </div>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
        </div>
      ))}
    </div>
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15 mt-2">
      <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-zinc-500 leading-relaxed">
        All data is encrypted in transit using TLS 1.3 and at rest using AES-256-GCM.
        Authentication tokens are signed with RS256. Certificate transparency is verified.
        <span className="text-blue-400 cursor-pointer hover:underline ml-1">View Certificate</span>
      </p>
    </div>
  </div>
);

// ---- Sub-Component: GDPR Privacy Controls ----
const GDPRControls: React.FC = () => {
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    await new Promise(r => setTimeout(r, 1200));
    const userData = {
      profile: { id: user?.id, email: user?.email, firstName: user?.firstName, lastName: user?.lastName, role: user?.role },
      exportedAt: new Date().toISOString(),
      gdprNote: 'This is all personal data held by ReimburseFlow under GDPR Article 20 (Right to Data Portability).',
    };
    await saveFileToSystem(JSON.stringify(userData, null, 2), 'my_data_export.json', 'application/json');
    setExporting(false);
    toast.success('Your data has been exported');
  };

  const handleDeleteAccount = () => {
    if (deleteInput !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }
    toast.success('Account deletion request submitted. You will receive an email confirmation.');
    setShowDeleteConfirm(false);
    setDeleteInput('');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
        <Eye className="w-4 h-4 text-indigo-400" /> Data Privacy & GDPR
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Export */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-4 h-4 text-blue-400" />
            <p className="text-sm font-semibold text-zinc-200">Export My Data</p>
          </div>
          <p className="text-xs text-zinc-500 mb-3 leading-relaxed">Download all your personal data in machine-readable format (GDPR Art. 20).</p>
          <Button onClick={handleExportData} disabled={exporting} size="sm"
            className="w-full h-8 text-xs bg-blue-600/70 hover:bg-blue-500 border-0">
            {exporting ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
            {exporting ? 'Preparing...' : 'Download JSON'}
          </Button>
        </div>

        {/* Data collected */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <p className="text-sm font-semibold text-zinc-200">What We Collect</p>
          </div>
          <ul className="text-xs text-zinc-500 space-y-1">
            {['Name & email address', 'Expense records & receipts', 'Login timestamps & IP', 'Device/browser type', 'Approval audit logs'].map(item => (
              <li key={item} className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Retention policy */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
        <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-amber-300 mb-0.5">Data Retention Policy</p>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Expense records: 7 years (legal requirement) · Audit logs: 2 years · Session data: 30 days · Deleted accounts: purged in 30 days.
          </p>
        </div>
      </div>

      {/* Delete account */}
      <div className="mt-2">
        <Button
          variant="outline" size="sm"
          onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
          className="h-8 text-xs border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
        >
          <Trash2 className="w-3 h-3 mr-1" /> Request Account Deletion (GDPR Art. 17)
        </Button>

        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3">
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 space-y-3">
                <p className="text-xs text-red-400 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> This action is irreversible after 30 days
                </p>
                <p className="text-xs text-zinc-500">Type <strong className="text-zinc-300 font-mono">DELETE MY ACCOUNT</strong> to confirm:</p>
                <input
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full bg-black/40 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-300 placeholder:text-zinc-700 focus:outline-none focus:border-red-500/50 font-mono"
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                    className="flex-1 h-7 text-xs border-white/10 text-zinc-500">Cancel</Button>
                  <Button size="sm" onClick={handleDeleteAccount}
                    className="flex-1 h-7 text-xs bg-red-600/80 hover:bg-red-500 border-0 text-white">
                    Confirm Deletion
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ---- MAIN Security Dashboard Page ----
const SecurityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'audit' | 'encryption' | 'privacy'>('sessions');

  const tabs = [
    { id: 'sessions', label: 'Sessions', icon: Globe },
    { id: 'audit', label: 'Audit Trail', icon: Activity },
    { id: 'encryption', label: 'Encryption', icon: Lock },
    { id: 'privacy', label: 'Privacy & GDPR', icon: Eye },
  ] as const;

  const securityScore = 92;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-1">Security Center</h1>
          <p className="text-zinc-500 text-sm">Sessions, audit trail, encryption, and privacy controls</p>
        </div>
        {/* Security Score */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-1 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/5 border border-emerald-500/20"
        >
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <motion.circle
                cx="32" cy="32" r="28"
                fill="none" stroke="#10b981" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={175.9}
                initial={{ strokeDashoffset: 175.9 }}
                animate={{ strokeDashoffset: 175.9 * (1 - securityScore / 100) }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-emerald-400">{securityScore}</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-500 text-center">Security<br/>Score</p>
        </motion.div>
      </div>

      {/* Quick Security Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Sessions', value: '3', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/15' },
          { label: 'Failed Logins (24h)', value: '1', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/15' },
          { label: 'Audit Events', value: '847', icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/15' },
          { label: '2FA Users', value: '76%', icon: Key, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/15' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className={`p-4 rounded-xl border ${stat.bg}`}
          >
            <stat.icon className={`w-4 h-4 ${stat.color} mb-2`} />
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-zinc-600 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-2xl border border-white/5 w-full">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="border border-white/5 bg-[#0d0d0d] rounded-2xl p-6"
        >
          {activeTab === 'sessions' && <ActiveSessions />}
          {activeTab === 'audit' && <AuditTrail />}
          {activeTab === 'encryption' && <EncryptionStatus />}
          {activeTab === 'privacy' && <GDPRControls />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default SecurityPage;
