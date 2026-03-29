// =============================================================
// SHARE EXPENSE BUTTON - Web Share API with deep links
// =============================================================
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, CheckCircle2, Mail, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { shareExpense } from '@/lib/webApis';
import type { Expense } from '@/types';

interface ShareExpenseButtonProps {
  expense: Expense;
}

export const ShareExpenseButton: React.FC<ShareExpenseButtonProps> = ({ expense }) => {
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const nativeShare = async () => {
    setSharing(true);
    const used = 'share' in navigator;
    const success = await shareExpense({
      expenseId: expense.id,
      description: expense.description,
      amount: Number(expense.amount),
      currency: expense.currency,
      status: expense.status,
    });
    setSharing(false);
    setMenuOpen(false);
    if (success && !used) {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/expenses/${expense.id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setMenuOpen(false);
    toast.success('Direct link copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent(`Expense: ${expense.description}`);
    const body = encodeURIComponent(
      `Hi,\n\nPlease review this expense:\n\n` +
      `Description: ${expense.description}\n` +
      `Amount: ${expense.currency} ${Number(expense.amount).toFixed(2)}\n` +
      `Status: ${expense.status.toUpperCase()}\n\n` +
      `View details: ${window.location.origin}/expenses/${expense.id}\n\n` +
      `— Sent via ReimburseFlow`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setMenuOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setMenuOpen(o => !o)}
        disabled={sharing}
        className="h-8 px-3 text-xs border-white/10 text-zinc-400 hover:text-white gap-1.5"
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </motion.div>
          ) : (
            <motion.div key="share" initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
              <Share2 className="w-3 h-3" />
              Share
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 z-40 w-52 bg-[#111] border border-white/10 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden p-1"
            >
              {'share' in navigator && (
                <button onClick={nativeShare}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-white/8 transition-colors">
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  Share via System
                  <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">Native</span>
                </button>
              )}
              <button onClick={copyLink}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-white/8 transition-colors">
                <Link className="w-4 h-4 text-blue-400" />
                Copy Direct Link
              </button>
              <button onClick={shareByEmail}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-300 hover:bg-white/8 transition-colors">
                <Mail className="w-4 h-4 text-zinc-400" />
                Send via Email
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
