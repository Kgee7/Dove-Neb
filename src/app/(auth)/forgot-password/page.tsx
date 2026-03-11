'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, sendPasswordResetEmail } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Firebase authentication is not initialized. Please try again in a moment.',
      });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setEmailSent(true);
      toast({
        title: 'Reset Link Sent',
        description: `Check ${values.email} for instructions to reset your password.`,
      });
    } catch (error: any) {
      let title = 'Reset Failed';
      let description = 'We encountered an error sending the reset link. Please try again.';

      if (error instanceof FirebaseError) {
        if (error.code === 'auth/user-not-found') {
          title = 'Account Not Found';
          description = 'No account exists with this email address.';
        } else if (error.code === 'auth/invalid-email') {
          description = 'The email address provided is invalid.';
        } else {
          description = error.message;
        }
      }
      
      console.error('Password reset error:', error);
      toast({
        variant: 'destructive',
        title: title,
        description: description,
      });
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="p-0 mb-6">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription className="text-base mt-2">
            We've sent a password reset link to <strong>{form.getValues('email')}</strong>.
            Please follow the instructions in the email to regain access to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
          <Link href="/login" className="block">
            <Button variant="default" className="w-full h-11 font-bold">
              Return to Sign In
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-primary text-sm"
            onClick={() => setEmailSent(false)}
          >
            Didn't get the email? Try again.
          </Button>
        </CardContent>
      </div>
    );
  }

  return (
    <>
      <CardHeader className="p-0 mb-8 text-center">
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription className="text-base mt-2">
          Enter your email address and we'll send you a secure link to reset your password.
        </CardDescription>
      </CardHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" className="h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-4">
            <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
            
            <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </form>
      </Form>
    </>
  );
}
