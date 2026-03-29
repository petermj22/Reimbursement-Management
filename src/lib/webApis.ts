// =============================================================
// CUTTING-EDGE WEB APIS - File System, Share, Payment, View Transitions
// =============================================================

// ---- File System Access API ----
export async function saveFileToSystem(
  data: string | Blob,
  suggestedName: string,
  mimeType = 'text/csv'
): Promise<boolean> {
  // Modern File System Access API (Chrome 86+)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as Window & { showSaveFilePicker: (opts: object) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: mimeType.includes('csv') ? 'CSV File' : 'JSON File',
            accept: { [mimeType]: [`.${suggestedName.split('.').pop()}`] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
      return true;
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') console.warn('File save failed:', err);
      return false;
    }
  }
  
  // Fallback: classic download
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export async function bulkExportByMonth(
  expenses: Array<{ amount: number; description: string; expenseDate: string; status: string; employeeName: string; categoryName: string }>
): Promise<void> {
  // Group by month
  const byMonth = expenses.reduce<Record<string, typeof expenses>>((acc, exp) => {
    const month = exp.expenseDate.substring(0, 7); // "2024-03"
    if (!acc[month]) acc[month] = [];
    acc[month].push(exp);
    return acc;
  }, {});

  const headers = ['Date', 'Description', 'Amount', 'Category', 'Employee', 'Status'];
  
  // If File System Access API supports directories (future API), use it
  // For now: download a combined ZIP-like file per month
  for (const [month, monthExpenses] of Object.entries(byMonth)) {
    const rows = monthExpenses.map(e => [
      e.expenseDate,
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount,
      e.categoryName,
      e.employeeName,
      e.status,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const [year, mon] = month.split('-');
    const monthName = new Date(Number(year), Number(mon) - 1, 1).toLocaleString('en', { month: 'long' });
    await saveFileToSystem(csv, `expenses_${monthName}_${year}.csv`, 'text/csv');
    // Small delay between downloads
    await new Promise(r => setTimeout(r, 300));
  }
}

// ---- Web Share API ----
export interface ShareExpenseOptions {
  expenseId: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
}

export async function shareExpense(opts: ShareExpenseOptions): Promise<boolean> {
  const url = `${window.location.origin}/expenses/${opts.expenseId}`;
  const title = `Expense: ${opts.description}`;
  const text = `💳 ${opts.currency} ${opts.amount.toFixed(2)} — ${opts.description}\nStatus: ${opts.status.toUpperCase()}\n\nView details:`;

  if ('share' in navigator) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return false;
    }
  }

  // Fallback: copy to clipboard with rich metadata
  const richText = `${title}\n${text}\n${url}`;
  await navigator.clipboard.writeText(richText);
  return true; // caller shows "Copied!" toast
}

// ---- Payment Request API ----
export interface ReimbursementPaymentOptions {
  amount: number;
  currency: string;
  description: string;
  recipientName: string;
}

export async function requestReimbursementPayment(
  opts: ReimbursementPaymentOptions
): Promise<{ success: boolean; method?: string; transactionId?: string }> {
  if (!('PaymentRequest' in window)) {
    return { success: false };
  }

  const methodData: PaymentMethodData[] = [
    { supportedMethods: 'https://apple.com/apple-pay' },
    { supportedMethods: 'https://google.com/pay', data: { apiVersion: 2, apiVersionMinor: 0 } },
    { supportedMethods: 'basic-card', data: { supportedNetworks: ['visa', 'mastercard', 'amex'] } },
  ];

  const details: PaymentDetailsInit = {
    id: `reimburse-${Date.now()}`,
    displayItems: [
      {
        label: opts.description,
        amount: { currency: opts.currency, value: opts.amount.toFixed(2) },
      },
    ],
    total: {
      label: `Reimbursement to ${opts.recipientName}`,
      amount: { currency: opts.currency, value: opts.amount.toFixed(2) },
    },
  };

  try {
    const request = new PaymentRequest(methodData, details);
    const canMakePayment = await request.canMakePayment();
    if (!canMakePayment) return { success: false };

    const response = await request.show();
    await response.complete('success');
    return {
      success: true,
      method: response.methodName,
      transactionId: `TXN-${Date.now()}`,
    };
  } catch (err: unknown) {
    if ((err as Error).name !== 'AbortError') console.error('Payment failed:', err);
    return { success: false };
  }
}

// ---- View Transitions API ----
export function startViewTransition(callback: () => void | Promise<void>): void {
  if ('startViewTransition' in document) {
    (document as Document & { startViewTransition: (cb: () => void | Promise<void>) => void }).startViewTransition(callback);
  } else {
    // Fallback: just run callback
    callback();
  }
}

// ---- Web NFC API ----
export async function readNFCTag(): Promise<{ serialNumber: string; data: string } | null> {
  if (!('NDEFReader' in window)) return null;

  try {
    const reader = new (window as Window & { NDEFReader: new () => { scan: () => Promise<void>; onreading: ((event: { serialNumber: string; message: { records: Array<{ data: ArrayBuffer; encoding: string }> } }) => void) | null } }).NDEFReader();
    await reader.scan();
    return new Promise((resolve) => {
      reader.onreading = (event) => {
        const record = event.message.records[0];
        const textDecoder = new TextDecoder(record.encoding || 'utf-8');
        resolve({
          serialNumber: event.serialNumber,
          data: textDecoder.decode(record.data),
        });
      };
    });
  } catch {
    return null;
  }
}

// ---- Core Web Vitals ----
export interface WebVitals {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  fcp: number | null;
}

export function measureWebVitals(callback: (vitals: WebVitals) => void): void {
  const vitals: WebVitals = { lcp: null, fid: null, cls: null, ttfb: null, fcp: null };

  // TTFB
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (nav) vitals.ttfb = Math.round(nav.responseStart - nav.requestStart);

  // FCP
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
  if (fcpEntry) vitals.fcp = Math.round(fcpEntry.startTime);

  // LCP — PerformanceObserver
  if ('PerformanceObserver' in window) {
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
        vitals.lcp = Math.round(last.startTime);
        callback({ ...vitals });
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // CLS
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!layoutShift.hadRecentInput) clsValue += layoutShift.value;
        }
        vitals.cls = Math.round(clsValue * 1000) / 1000;
        callback({ ...vitals });
      }).observe({ type: 'layout-shift', buffered: true });

      // FID
      new PerformanceObserver((list) => {
        const entry = list.getEntries()[0] as PerformanceEntry & { processingStart: number; startTime: number };
        vitals.fid = Math.round(entry.processingStart - entry.startTime);
        callback({ ...vitals });
      }).observe({ type: 'first-input', buffered: true });
    } catch { /* observer not supported */ }
  }

  callback({ ...vitals });
}
