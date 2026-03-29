import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { mockCategories } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, Scan, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const NewExpensePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    currency: 'USD',
    categoryId: '',
    expenseDate: new Date().toISOString().split('T')[0],
    merchantName: '',
  });

  const handleOCR = () => {
    setScanning(true);
    setTimeout(() => {
      setForm(prev => ({
        ...prev,
        description: 'Business lunch - client meeting',
        amount: '127.50',
        merchantName: 'The Capital Grille',
        categoryId: 'cat2',
      }));
      setScanning(false);
      setScanned(true);
      toast.success('Receipt scanned successfully! Confidence: 96.2%');
    }, 2000);
  };

  const handleSubmit = (asDraft: boolean) => {
    toast.success(asDraft ? 'Expense saved as draft' : 'Expense submitted for approval');
    navigate('/expenses');
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="max-w-2xl mx-auto space-y-6">
      <motion.div variants={fadeUp}>
        <button onClick={() => navigate('/expenses')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Expenses
        </button>
        <h1 className="page-title">New Expense</h1>
        <p className="page-description">Submit a new expense for reimbursement</p>
      </motion.div>

      {/* OCR Section */}
      <motion.div variants={fadeUp} className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Receipt Scanner (OCR)</h3>
        <p className="text-xs text-muted-foreground mb-4">Upload a receipt image to auto-fill expense details</p>
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
          {scanning ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <Scan className="w-8 h-8 text-primary mx-auto" />
            </motion.div>
          ) : scanned ? (
            <div className="space-y-2">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
              <p className="text-sm text-success font-medium">Receipt processed successfully</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Drag & drop or click to upload</p>
              <Button variant="outline" size="sm" onClick={handleOCR}>
                <Scan className="w-3.5 h-3.5 mr-2" /> Scan Receipt (Demo)
              </Button>
            </>
          )}
        </div>
      </motion.div>

      {/* Form */}
      <motion.div variants={fadeUp} className="glass-card p-6 space-y-5">
        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea id="description" placeholder="What was this expense for?" value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} className="mt-1.5" rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Amount *</Label>
            <Input id="amount" type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))} className="mt-1.5" />
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={form.currency} onValueChange={v => setForm(prev => ({ ...prev, currency: v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Category *</Label>
            <Select value={form.categoryId} onValueChange={v => setForm(prev => ({ ...prev, categoryId: v }))}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {mockCategories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date">Expense Date *</Label>
            <Input id="date" type="date" value={form.expenseDate} onChange={e => setForm(prev => ({ ...prev, expenseDate: e.target.value }))} className="mt-1.5" />
          </div>
        </div>

        <div>
          <Label htmlFor="merchant">Merchant Name</Label>
          <Input id="merchant" placeholder="e.g. Delta Airlines, Amazon" value={form.merchantName} onChange={e => setForm(prev => ({ ...prev, merchantName: e.target.value }))} className="mt-1.5" />
        </div>

        <div className="flex gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => handleSubmit(true)} className="flex-1">Save as Draft</Button>
          <Button onClick={() => handleSubmit(false)} className="flex-1" style={{ background: 'var(--gradient-primary)' }}>Submit for Approval</Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default NewExpensePage;
