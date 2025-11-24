
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Contact Support</CardTitle>
          <CardDescription>
            We're here to help. Reach out to us through any of the channels below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold">Email Support</h3>
              <a href="mailto:dovenebinfo@gmail.com" className="text-muted-foreground hover:underline">
                dovenebinfo@gmail.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <MessageCircle className="h-6 w-6 text-primary" />
            <div>
              <h3 className="font-semibold">WhatsApp Support</h3>
              <a href="https://wa.me/+233500863382" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:underline">
                wa.me/+233500863382
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
