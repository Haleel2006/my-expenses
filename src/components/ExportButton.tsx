'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useStore } from '@/lib/store';
import { fetchTransactions } from '@/lib/api/transactions';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function ExportButton() {
  const { user } = useStore();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const txs = await fetchTransactions(user.uid, 1000); // Fetch up to 1000 for export
      
      const csvData = txs.map(tx => ({
        Date: format(tx.date, 'yyyy-MM-dd'),
        Type: tx.type,
        Category: tx.category,
        Amount: tx.amount,
        Method: tx.paymentMethod,
        Notes: tx.notes
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `transactions_${format(new Date(), 'MMM_yyyy')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Export successful" });
    } catch (error) {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading} className="gap-2">
      <Download className="h-4 w-4" />
      {loading ? "Exporting..." : "Export CSV"}
    </Button>
  );
}
