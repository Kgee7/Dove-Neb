
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
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
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
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setEmailSent(true);
      toast({
        title: 'Password Reset Email Sent',
        description: `An email has been sent to ${values.email} with instructions to reset your password.`,
      });
    } catch (error: any) {
      let title = 'Error';
      let description = 'An unexpected error occurred.';
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/user-not-found') {
            title = 'User Not Found';
            description = 'No account exists with this email address.';
        } else {
            description = error.message;
        }
      }
      console.error(error);
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
        <div className="text-center">
            <CardHeader>
                <CardTitle className="text-2xl">Check Your Inbox</CardTitle>
                <CardDescription>
                    A password reset link has been sent to your email address. Please follow the instructions in the email to reset your password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Link href="/login">
                    <Button variant="link">Back to Sign In</Button>
                </Link>
            </CardContent>
        </div>
    )
  }

  return (
    <>
      <CardHeader className="p-0 mb-8 text-center">
        <CardTitle className="text-2xl">Forgot Your Password?</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a link to reset it.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="m@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </Button>
          </CardContent>
        </form>
      </Form>
      <div className="mt-4 text-center text-sm">
        Remember your password?{' '}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </div>
    </>
  );
}
