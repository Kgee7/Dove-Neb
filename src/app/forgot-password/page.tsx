'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFunctions, httpsCallable, sendPasswordResetEmail } from '@/firebase';
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
  const functions = useFunctions();
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
      // Diagnostic logging
      console.log('Attempting password reset for:', values.email);
      
      const isProduction = process.env.NODE_ENV === 'production';
      const productionUrl = 'https://doveneb--studio-7235955659-7c316.us-central1.hosted.app';
      
      // Call custom Cloud Function first (Premium Branded Email)
      try {
        const resetEmailFn = httpsCallable(functions!, 'sendCustomPasswordReset');
        await resetEmailFn({ 
          email: values.email,
          continueUrl: `${isProduction ? productionUrl : window.location.origin}/reset-password`
        });
        console.log('Custom branded email reset triggered');
      } catch (fnError: any) {
        console.warn('Custom reset failed, falling back to standard Firebase reset:', fnError);
        
        // FALLBACK: Standard Firebase Email Reset
        const actionCodeSettings = {
          url: `${isProduction ? productionUrl : window.location.origin}/reset-password`,
          handleCodeInApp: true,
        };
        await sendPasswordResetEmail(auth, values.email, actionCodeSettings);
        console.log('Standard Firebase email reset triggered as fallback');
      }
      setEmailSent(true);
      toast({
        title: 'Reset Link Processed',
        description: `If an account exists for ${values.email}, a reset link has been sent.`,
      });
    } catch (error: any) {
      console.error('Password reset detail error:', error);
      let title = 'Reset Request Failed';
      let description = 'We encountered an error processing your request. Please try again.';

      if (error instanceof FirebaseError) {
        // Newer Firebase projects have enumeration protection enabled by default.
        // auth/user-not-found may not be thrown.
        if (error.code === 'auth/user-not-found') {
          title = 'Account Not Found';
          description = 'No account exists with this email address.';
        } else if (error.code === 'auth/invalid-email') {
          description = 'The email address provided is invalid. Please check for typos.';
        } else if (error.code === 'auth/too-many-requests') {
            description = 'Too many requests. Please wait a few minutes and try again.';
        } else {
          description = `Firebase Error: ${error.message}`;
        }
      }
      
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
            <br /><br />
            <span className="text-xs font-semibold text-amber-600 block bg-amber-50 rounded-lg p-2 border border-amber-100">
              NOTE: CHECK YOUR SPAM IF YOU DID NOT RECEIVE IT IN YOUR INBOX
            </span>
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
