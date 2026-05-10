'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { fetchTransactions, Transaction } from '@/lib/api/transactions';
import { format, isSameDay } from 'date-fns';

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { user } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user) {
      fetchTransactions(user.uid, 500).then(setTransactions); // Fetching a larger limit for calendar
    }
  }, [user]);

  const selectedDateTransactions = transactions.filter(tx => date && isSameDay(tx.date, date));
  
  // Calculate daily total for selected date
  const dailyTotal = selectedDateTransactions.reduce((acc, tx) => {
    return tx.type === 'expense' ? acc - tx.amount : acc + tx.amount;
  }, 0);

  // Dates that have expenses to highlight
  const expenseDates = transactions
    .filter(tx => tx.type === 'expense')
    .map(tx => tx.date);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col items-center p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border shadow"
            modifiers={{
              hasExpense: expenseDates
            }}
            modifiersStyles={{
              hasExpense: { borderBottom: '2px solid red' }
            }}
          />
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {date && (
              <>
                <div className="mb-4 flex items-center justify-between border-b pb-4">
                  <span className="font-medium text-muted-foreground">Daily Total:</span>
                  <span className={`text-xl font-bold ${dailyTotal < 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {dailyTotal < 0 ? '-' : '+'}{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Math.abs(dailyTotal))}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {selectedDateTransactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No transactions on this date.</p>
                  ) : (
                    selectedDateTransactions.map(tx => (
                      <div key={tx.id} className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{tx.category}</p>
                          <p className="text-xs text-muted-foreground">{tx.notes || tx.paymentMethod}</p>
                        </div>
                        <div className={`font-bold ${tx.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
                          {tx.type === 'expense' ? '-' : '+'}{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(tx.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
