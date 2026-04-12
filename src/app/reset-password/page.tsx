'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, verifyPasswordResetCode, confirmPasswordReset } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
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
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const formSchema = z.object({
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function ResetPasswordContent() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [verifying, setVerifying] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const oobCode = searchParams.get('oobCode');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    async function verifyCode() {
      if (!auth) return;
      
      // If oobCode is missing, we check if we're in 'action' mode but missing code
      if (!oobCode) {
        setError('Invalid or missing reset code. Please request a new password reset link.');
        setVerifying(false);
        return;
      }

      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setVerifying(false);
      } catch (err: any) {
        console.error('Verify reset code error:', err);
        let message = 'The password reset link is invalid or has expired.';
        if (err instanceof FirebaseError) {
          if (err.code === 'auth/expired-action-code') {
            message = 'The password reset link has expired. Please request a new one.';
          } else if (err.code === 'auth/invalid-action-code') {
            message = 'The password reset link is invalid. Please check the link or request a new one.';
          }
        }
        setError(message);
        setVerifying(false);
      }
    }

    verifyCode();
  }, [auth, oobCode]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!auth || !oobCode) return;

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, values.password);
      setSuccess(true);
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been updated. You can now sign in with your new password.',
      });
    } catch (err: any) {
      console.error('Confirm password reset error:', err);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: err.message || 'An error occurred while updating your password.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse rounded-full" />
        </div>
        <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Verifying Secure Link</h3>
            <p className="text-muted-foreground text-sm max-w-[200px]">Ensuring your account safety. One moment please...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-destructive/10 p-4 rounded-full ring-8 ring-destructive/5">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">Invalid Reset Link</CardTitle>
            <CardDescription className="text-base">
              {error}
            </CardDescription>
          </div>
          <div className="grid gap-3 pt-4">
            <Link href="/forgot-password" size="lg" asChild>
              <Button variant="default" className="w-full h-12 font-bold shadow-lg shadow-primary/20">
                Request New Link
              </Button>
            </Link>
            <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all group py-2">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full ring-8 ring-green-50">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-extrabold tracking-tight">Access Restored</CardTitle>
            <CardDescription className="text-base">
              Your password has been successfully reset. Welcome back to Dove Neb!
            </CardDescription>
          </div>
          <div className="pt-6">
            <Link href="/login" asChild>
              <Button variant="default" className="w-full h-12 font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Sign In Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="text-center mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3 h-3" /> Secure Verification
            </div>
            <CardTitle className="text-3xl font-extrabold tracking-tight">New Password</CardTitle>
            <CardDescription className="text-base">
                Create a strong password for <span className="text-foreground font-semibold underline decoration-primary/30 decoration-2 underline-offset-4">{email}</span>
            </CardDescription>
        </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Password</FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="h-12 bg-muted/30 border-muted-foreground/10 focus:border-primary/50 transition-all rounded-xl pl-4 pr-10" 
                        {...field} 
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
                  </div>
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        className="h-12 bg-muted/30 border-muted-foreground/10 focus:border-primary/50 transition-all rounded-xl pl-4" 
                        {...field} 
                    />
                     <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
                  </div>
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )}
          />
          
          <div className="space-y-4 pt-4">
            <Button 
                type="submit" 
                className="w-full h-12 font-bold text-md shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all rounded-xl" 
                disabled={submitting}
            >
              {submitting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Account...
                </>
              ) : 'Update My Password'}
            </Button>
            
            <Link href="/login" className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-all group py-2 border border-transparent hover:border-muted rounded-lg">
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              Return to Sign In
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-50">
        {/* Animated Background Elements */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-secondary/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="container relative z-10 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-blue-400 to-secondary" />
                <CardHeader className="pt-10 pb-2 px-8 flex flex-col items-center">
                    <Link href="/" className="mb-6 hover:scale-110 transition-transform duration-500">
                        <div className="p-3 bg-white rounded-2xl shadow-lg ring-1 ring-slate-100">
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                        </div>
                    </Link>
                </CardHeader>
                <CardContent className="px-8 pb-10">
                    <Suspense fallback={
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground text-sm font-medium animate-pulse">Initializing Security...</p>
                    </div>
                    }>
                    <ResetPasswordContent />
                    </Suspense>
                </CardContent>
            </Card>
        </div>

        {/* Footer info */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">
                Dove Neb Security &bull; Trusted Verification System
            </p>
        </div>
    </main>
  );
}
