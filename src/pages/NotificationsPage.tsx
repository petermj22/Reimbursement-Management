import React from 'react';
import { motion } from 'framer-motion';
import { mockNotifications } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CheckCircle2, XCircle, Receipt, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const iconMap: Record<string, React.ReactNode> = {
  expense_submitted: <Receipt className="w-4 h-4 text-primary" />,
  expense_approved: <CheckCircle2 className="w-4 h-4 text-success" />,
  expense_rejected: <XCircle className="w-4 h-4 text-destructive" />,
};

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const notifications = mockNotifications.filter(n => n.userId === user?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="max-w-2xl mx-auto space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-description">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm">Mark all as read</Button>
        )}
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-3">
        {notifications.map((notification, i) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`glass-card p-4 flex items-start gap-4 ${!notification.isRead ? 'border-l-2 border-l-primary' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              {iconMap[notification.type] || <Bell className="w-4 h-4 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!notification.isRead ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <Clock className="w-3 h-3 inline mr-1" />
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
            {!notification.isRead && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
            )}
          </motion.div>
        ))}

        {notifications.length === 0 && (
          <div className="glass-card p-16 text-center">
            <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default NotificationsPage;
