import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } from '@/store';
import { CardSkeleton } from '@/components/Skeletons';
import { LottieEmpty } from '@/components/LottieAnimations';
import type { Notification } from '@/types';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const typeStyles: Record<string, string> = {
  expense_submitted: 'bg-primary/10 text-primary',
  expense_approved: 'bg-success/10 text-success',
  expense_rejected: 'bg-destructive/10 text-destructive',
  expense_paid: 'bg-info/10 text-info',
  expense_step_approved: 'bg-warning/10 text-warning',
  expense_reminder: 'bg-accent/10 text-accent',
};

const NotificationsPage: React.FC = () => {
  const { data: notifications = [], isLoading } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h1 className="page-title">Notifications</h1></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-description">{unreadCount} unread notifications</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead()}>
            <CheckCheck className="w-3.5 h-3.5 mr-2" /> Mark all as read
          </Button>
        )}
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-3">
        {notifications.map((notif, i) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card p-4 flex items-start gap-4 transition-all ${!notif.isRead ? 'border-l-2 border-l-primary' : 'opacity-70'}`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${typeStyles[notif.type] || 'bg-muted'}`}>
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{notif.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
            </div>
            {!notif.isRead && (
              <Button variant="ghost" size="sm" onClick={() => markRead(notif.id)}>
                <Check className="w-3.5 h-3.5" />
              </Button>
            )}
          </motion.div>
        ))}
        {notifications.length === 0 && (
          <div className="glass-card p-16 text-center">
            <LottieEmpty size={120} />
            <p className="text-sm text-muted-foreground mt-4">No notifications yet</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default NotificationsPage;
