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
  Card,
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
      <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 px-4">
        {/* Animated Background Elements */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-secondary/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-0 shadow-2xl bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-blue-400 to-secondary" />
            
            <CardHeader className="pt-10 pb-6 px-8 flex flex-col items-center">
              <Link href="/" className="mb-6 hover:scale-110 transition-transform duration-500">
                <div className="p-3 bg-white rounded-2xl shadow-lg ring-1 ring-slate-100">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                </div>
              </Link>
              
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full ring-8 ring-green-50">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Check Your Email</CardTitle>
                <CardDescription className="text-base font-medium">
                  We've sent a link to <span className="text-primary font-bold">{form.getValues('email')}</span>
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-10 space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-center text-muted-foreground leading-relaxed">
                  Please follow the instructions in the email to regain access to your account.
                </p>
                <div className="text-xs font-semibold text-amber-600 bg-amber-50/50 rounded-xl p-4 border border-amber-100/50 text-center">
                  NOTE: CHECK YOUR SPAM IF YOU DID NOT RECEIVE IT IN YOUR INBOX
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/login" className="block">
                  <Button variant="default" className="w-full h-12 font-bold text-md shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl">
                    Return to Sign In
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full h-12 text-muted-foreground hover:text-primary transition-all rounded-xl text-sm font-medium"
                  onClick={() => setEmailSent(false)}
                >
                  Didn't get the email? Try again.
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50 px-4">
        {/* Animated Background Elements */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-secondary/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <Card className="border-0 shadow-2xl bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-blue-400 to-secondary" />
                
                <CardHeader className="pt-10 pb-6 px-8 flex flex-col items-center">
                    <Link href="/" className="mb-6 hover:scale-110 transition-transform duration-500">
                        <div className="p-2.5 bg-white rounded-2xl shadow-lg ring-1 ring-slate-100">
                            <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
                        </div>
                    </Link>
                    <div className="text-center space-y-2">
                        <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">Reset Password</CardTitle>
                        <CardDescription className="text-base font-medium">
                            We'll send you a secure link to reset access.
                        </CardDescription>
                    </div>
                </CardHeader>
                
                <CardContent className="px-8 pb-10">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</FormLabel>
                                        <FormControl>
                                            <div className="relative group">
                                                <Input 
                                                    placeholder="name@example.com" 
                                                    className="h-12 bg-muted/30 border-muted-foreground/10 focus:border-primary/50 transition-all rounded-xl px-4" 
                                                    {...field} 
                                                />
                                                <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px] ml-1" />
                                    </FormItem>
                                )}
                            />
                            
                            <div className="space-y-4 pt-2">
                                <Button 
                                    type="submit" 
                                    className="w-full h-12 font-bold text-md shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all rounded-xl" 
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Securing Access...
                                        </>
                                    ) : 'Send Reset Link'}
                                </Button>
                                
                                <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all group py-2">
                                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                                    Back to Sign In
                                </Link>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            
            <div className="mt-8 text-center text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">
                Dove Neb Security &bull; Trusted Verification System
            </div>
        </div>
    </main>
  );
}
