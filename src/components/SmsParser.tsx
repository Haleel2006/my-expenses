'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { TransactionType, PaymentMethod } from '@/lib/api/transactions';

interface SmsParserProps {
  onParsed: (data: { amount: string; category: string; paymentMethod: PaymentMethod; type: TransactionType; notes: string }) => void;
}

export function SmsParser({ onParsed }: SmsParserProps) {
  const [smsText, setSmsText] = useState('');
  const { toast } = useToast();

  const handleParse = () => {
    if (!smsText.trim()) return;

    try {
      // Very basic regex to simulate UPI SMS parsing
      // e.g., "Rs.500.00 debited from a/c **1234 on 02-May-26 to VPA swiggy@okhdfcbank Ref No 12345678"
      // e.g., "Sent Rs. 500 to Swiggy via UPI"
      
      let amount = '';
      let type: TransactionType = 'expense';
      let category = 'Other';
      const paymentMethod: PaymentMethod = 'Bank account';
      let notes = '';

      // Extract amount
      const amountMatch = smsText.match(/(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i);
      if (amountMatch && amountMatch[1]) {
        amount = amountMatch[1].replace(/,/g, '');
      }

      // Check credit/debit
      if (/credited/i.test(smsText) || /received/i.test(smsText)) {
        type = 'income';
        category = 'Income'; // Or specific based on keyword
      } else if (/debited/i.test(smsText) || /sent/i.test(smsText) || /paid/i.test(smsText)) {
        type = 'expense';
      }

      // Detect category based on keywords
      const lowerSms = smsText.toLowerCase();
      if (type === 'expense') {
        if (lowerSms.includes('swiggy') || lowerSms.includes('zomato') || lowerSms.includes('food')) {
          category = 'Food';
        } else if (lowerSms.includes('uber') || lowerSms.includes('ola') || lowerSms.includes('irctc')) {
          category = 'Travel';
        } else if (lowerSms.includes('amazon') || lowerSms.includes('flipkart') || lowerSms.includes('myntra')) {
          category = 'Shopping';
        } else if (lowerSms.includes('jio') || lowerSms.includes('airtel') || lowerSms.includes('electricity') || lowerSms.includes('bill')) {
          category = 'Bills';
        }
      }

      // Extract notes (receiver info roughly)
      const toMatch = smsText.match(/to\s+([a-zA-Z0-9@.\s]+?)(?:\s+via|\s+Ref|\s+on|$)/i);
      if (toMatch && toMatch[1]) {
        notes = `Paid to ${toMatch[1].trim()}`;
      } else {
        notes = 'Auto-parsed from SMS';
      }

      if (!amount) {
        toast({ title: "Could not detect amount", description: "Please enter details manually.", variant: "destructive" });
        return;
      }

      toast({ title: "SMS Parsed!", description: "Verify the extracted details." });
      onParsed({ amount, category, paymentMethod, type, notes });
      setSmsText('');
      
    } catch {
      toast({ title: "Parsing failed", description: "Could not understand the SMS format.", variant: "destructive" });
    }
  };

  return (
    <Card className="w-full border-dashed bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Smart SMS Import</CardTitle>
        <CardDescription className="text-xs">Paste your bank/UPI SMS here to auto-fill details.</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea 
          placeholder="e.g., Rs. 500 debited from a/c **1234 to Swiggy via UPI" 
          value={smsText}
          onChange={(e) => setSmsText(e.target.value)}
          className="min-h-[80px] text-sm"
        />
      </CardContent>
      <CardFooter>
        <Button onClick={handleParse} size="sm" variant="secondary" className="w-full">
          Parse SMS
        </Button>
      </CardFooter>
    </Card>
  );
}
