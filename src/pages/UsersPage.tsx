import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Shield, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useGetUsersQuery } from '@/store';
import { ExpenseListSkeleton } from '@/components/Skeletons';
import { useGsapFadeInStagger } from '@/hooks/useGsapAnimations';
import type { User } from '@/types';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const roleBadge = (role: string) => ({
  admin: 'bg-accent/10 text-accent border-accent/30',
  manager: 'bg-primary/10 text-primary border-primary/30',
  employee: 'bg-muted text-muted-foreground border-border',
}[role] || 'bg-muted text-muted-foreground border-border');

const UsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data: users = [], isLoading } = useGetUsersQuery();
  const statsRef = useGsapFadeInStagger('.stat-card');

  const filtered = users.filter((u: User) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="space-y-6"><div><h1 className="page-title">User Management</h1></div><ExpenseListSkeleton /></div>;

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-description">{users.length} users in organization</p>
        </div>
        <Button onClick={() => toast.info('User creation form would open here')} style={{ background: 'var(--gradient-primary)' }}>
          <UserPlus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </motion.div>

      {/* Stats */}
      <div ref={statsRef} className="grid grid-cols-3 gap-4">
        {[
          { label: 'Admins', count: users.filter((u: User) => u.role === 'admin').length, icon: Shield, gradient: 'var(--gradient-danger)' },
          { label: 'Managers', count: users.filter((u: User) => u.role === 'manager').length, icon: UsersIcon, gradient: 'var(--gradient-primary)' },
          { label: 'Employees', count: users.filter((u: User) => u.role === 'employee').length, icon: UsersIcon, gradient: 'var(--gradient-success)' },
        ].map(stat => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">{stat.label}</p><p className="text-2xl font-bold text-foreground">{stat.count}</p></div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: stat.gradient }}><stat.icon className="w-5 h-5 text-primary-foreground" /></div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <motion.div variants={fadeUp} className="glass-card p-4">
        <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp} className="table-container">
        <table className="w-full">
          <thead><tr className="bg-muted/30">
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Last Login</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Joined</th>
          </tr></thead>
          <tbody>
            {filtered.map((user: User) => (
              <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-t border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-6 py-3.5"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{user.firstName[0]}{user.lastName[0]}</div><div><p className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p><p className="text-xs text-muted-foreground">{user.email}</p></div></div></td>
                <td className="px-6 py-3.5"><Badge variant="outline" className={`${roleBadge(user.role)} text-xs capitalize`}>{user.role}</Badge></td>
                <td className="px-6 py-3.5"><div className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-success' : 'bg-muted-foreground'}`} /><span className="text-xs text-muted-foreground">{user.isActive ? 'Active' : 'Inactive'}</span></div></td>
                <td className="px-6 py-3.5 text-sm text-muted-foreground">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '—'}</td>
                <td className="px-6 py-3.5 text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
};

export default UsersPage;
