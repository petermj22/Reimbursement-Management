// =============================================================
// EXPENSE COMMENTS - Threaded discussion with @mentions & typing indicators
// =============================================================
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, AtSign, MessageSquare, Reply, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
  id: string;
  authorName: string;
  authorInitials: string;
  authorRole: string;
  content: string;
  timestamp: Date;
  mentions: string[];
  parentId?: string;
  replies?: Comment[];
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    authorName: 'James Rodriguez',
    authorInitials: 'JR',
    authorRole: 'manager',
    content: 'Please provide the original receipt for this. The uploaded image is blurry.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    mentions: [],
    replies: [
      {
        id: '1-1',
        authorName: 'John Smith',
        authorInitials: 'JS',
        authorRole: 'employee',
        content: '@James Rodriguez I\'ll upload the clearer version shortly. Got it from my email.',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        mentions: ['James Rodriguez'],
        parentId: '1',
      }
    ]
  }
];

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return date.toLocaleDateString();
}

const CommentBubble: React.FC<{
  comment: Comment;
  onReply: (id: string, authorName: string) => void;
  depth?: number;
}> = ({ comment, onReply, depth = 0 }) => {
  const roleColors: Record<string, string> = {
    admin: 'bg-purple-500/20 text-purple-400',
    manager: 'bg-blue-500/20 text-blue-400',
    employee: 'bg-zinc-500/20 text-zinc-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${depth > 0 ? 'ml-10 mt-2' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
        comment.authorRole === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/20' :
        comment.authorRole === 'manager' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20' :
        'bg-zinc-700 text-zinc-300 border border-zinc-600'
      }`}>
        {comment.authorInitials}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-zinc-200">{comment.authorName}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize font-medium ${roleColors[comment.authorRole] || roleColors.employee}`}>
            {comment.authorRole}
          </span>
          <span className="text-[11px] text-zinc-600">{timeAgo(comment.timestamp)}</span>
        </div>

        <div className="bg-white/[0.04] border border-white/5 rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm text-zinc-300 leading-relaxed">
          {/* Render @mentions with highlight */}
          {comment.content.split(/(@\w+(?:\s+\w+)?)/).map((part, i) =>
            part.startsWith('@') ? (
              <span key={i} className="text-indigo-400 font-medium">{part}</span>
            ) : <span key={i}>{part}</span>
          )}
        </div>

        <button
          onClick={() => onReply(comment.id, comment.authorName)}
          className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <Reply className="w-3 h-3" /> Reply
        </button>

        {/* Nested replies */}
        {comment.replies?.map(reply => (
          <CommentBubble key={reply.id} comment={reply} onReply={onReply} depth={depth + 1} />
        ))}
      </div>
    </motion.div>
  );
};

export const ExpenseComments: React.FC<{ expenseId: string }> = ({ expenseId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [input, setInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Simulate someone else typing occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      setOtherTyping(true);
      setTimeout(() => setOtherTyping(false), 1800);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setIsTyping(true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => setIsTyping(false), 1000);
  };

  const handleReply = (id: string, authorName: string) => {
    setReplyingTo({ id, name: authorName });
    setInput(`@${authorName} `);
    inputRef.current?.focus();
  };

  const handleSend = () => {
    if (!input.trim() || !user) return;

    const mentions = [...input.matchAll(/@(\w+(?:\s+\w+)?)/g)].map(m => m[1]);
    const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || ''}`;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      authorName: `${user.firstName} ${user.lastName}`,
      authorInitials: initials,
      authorRole: user.role,
      content: input.trim(),
      timestamp: new Date(),
      mentions,
      parentId: replyingTo?.id,
    };

    if (replyingTo) {
      setComments(prev => prev.map(c => {
        if (c.id === replyingTo.id) {
          return { ...c, replies: [...(c.replies || []), newComment] };
        }
        return c;
      }));
    } else {
      setComments(prev => [...prev, newComment]);
    }

    setInput('');
    setReplyingTo(null);
    toast.success('Comment posted');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border border-white/5 bg-[#0d0d0d] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
        <MessageSquare className="w-4 h-4 text-zinc-500" />
        <h3 className="text-sm font-semibold text-zinc-300">Discussion</h3>
        <span className="ml-auto text-xs text-zinc-600">{comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)} comments</span>
      </div>

      {/* Comments */}
      <div className="px-5 py-4 space-y-5 max-h-80 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-4">No comments yet. Start the discussion.</p>
        )}
        {comments.map(comment => (
          <CommentBubble key={comment.id} comment={comment} onReply={handleReply} />
        ))}

        {/* Typing indicator */}
        <AnimatePresence>
          {otherTyping && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2 text-xs text-zinc-600"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400">JR</div>
              <div className="bg-white/[0.04] border border-white/5 rounded-xl rounded-tl-sm px-3 py-2 flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-zinc-500"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
              <span>James is typing...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="px-5 py-4 border-t border-white/5">
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/15">
            <Reply className="w-3 h-3 text-indigo-400" />
            <span className="text-xs text-indigo-400">Replying to <strong>{replyingTo.name}</strong></span>
            <button onClick={() => { setReplyingTo(null); setInput(''); }} className="ml-auto text-zinc-600 hover:text-zinc-400 text-xs">×</button>
          </div>
        )}
        <div className="flex gap-3 items-end">
          <div className="w-8 h-8 rounded-full flex-shrink-0 bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Add a comment... (use @name to mention)"
              rows={1}
              className="w-full bg-white/[0.04] border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 resize-none transition-all"
              style={{ minHeight: 40 }}
            />
            {/* Mention hint */}
            <button className="absolute right-10 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
              <AtSign className="w-4 h-4" />
            </button>
          </div>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-zinc-700 mt-2 ml-11">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
};
