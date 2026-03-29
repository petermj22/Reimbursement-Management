import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { mockApprovalRules, mockCategories } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Shield, Receipt, Bell, Database, Plus } from 'lucide-react';
import { toast } from 'sonner';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const SettingsPage: React.FC = () => {
  const { user, switchRole } = useAuth();

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="max-w-3xl mx-auto space-y-8">
      <motion.div variants={fadeUp}>
        <h1 className="page-title">Settings</h1>
        <p className="page-description">System configuration and approval rules</p>
      </motion.div>

      {/* Role Switcher (Demo) */}
      <motion.div variants={fadeUp} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Demo Role Switcher</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Switch between roles to see different views</p>
        <div className="flex gap-3">
          {(['admin', 'manager', 'employee'] as const).map(role => (
            <Button
              key={role}
              variant={user?.role === role ? 'default' : 'outline'}
              size="sm"
              onClick={() => switchRole(role)}
              className="capitalize"
              style={user?.role === role ? { background: 'var(--gradient-primary)' } : {}}
            >
              {role}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Approval Rules */}
      <motion.div variants={fadeUp} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Approval Rules</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info('Rule editor would open')}>
            <Plus className="w-3 h-3 mr-1" /> Add Rule
          </Button>
        </div>
        <div className="space-y-3">
          {mockApprovalRules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{rule.name}</p>
                <p className="text-xs text-muted-foreground">
                  ${rule.minAmount.toLocaleString()} – ${rule.maxAmount.toLocaleString()} · {rule.approvalType}
                  {rule.requiredApprovalPercentage ? ` · ${rule.requiredApprovalPercentage}% required` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs capitalize">{rule.approvalType}</Badge>
                <Switch checked={rule.isActive} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div variants={fadeUp} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Expense Categories</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info('Category editor would open')}>
            <Plus className="w-3 h-3 mr-1" /> Add Category
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {mockCategories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div>
                <p className="text-sm font-medium text-foreground">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.description}</p>
              </div>
              <Switch checked={cat.isActive} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notification Preferences */}
      <motion.div variants={fadeUp} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Notification Preferences</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Email notifications', desc: 'Receive email for expense status changes', defaultOn: true },
            { label: 'Push notifications', desc: 'Browser notifications for new approvals', defaultOn: true },
            { label: 'Weekly digest', desc: 'Summary of expense activity every Monday', defaultOn: false },
          ].map(pref => (
            <div key={pref.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{pref.label}</p>
                <p className="text-xs text-muted-foreground">{pref.desc}</p>
              </div>
              <Switch defaultChecked={pref.defaultOn} />
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SettingsPage;
