
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth, useUser, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "@/firebase";
import { initiateEmailSignIn } from "@/firebase/non-blocking-login";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";
import { useFirestore } from "@/firebase";
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import React from "react";
import { firebaseConfig } from "@/firebase/config";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  React.useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    initiateEmailSignIn(auth, values.email, values.password)
      .then(() => {
        toast({
          title: "Signing In...",
          description: "You will be redirected shortly.",
        });
      })
      .catch((error: any) => {
        let title = "Sign-in Failed";
        let description = "An unexpected error occurred.";

        if (error instanceof FirebaseError) {
          switch (error.code) {
            case 'auth/invalid-credential':
              title = "Invalid Credentials";
              description = "The email or password you entered is incorrect. Please try again.";
              break;
            case 'auth/user-not-found':
              title = "User Not Found";
              description = "No account found with this email address.";
              break;
            case 'auth/wrong-password':
               title = "Incorrect Password";
              description = "The password you entered is incorrect. Please try again.";
              break;
            default:
              description = error.message;
              break;
          }
        }
        
        console.error(error);
        toast({
          variant: "destructive",
          title: title,
          description: description,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }

  async function handleGoogleSignIn() {
    if (!auth || !firestore) return;
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const [firstName, ...lastName] = (user.displayName || "").split(" ");
        const userData = {
          id: user.uid,
          userType: "renter",
          firstName: firstName || "",
          lastName: lastName.join(" ") || "",
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, userData);
      }
      
      toast({
        title: "Signed in with Google!",
        description: "You will be redirected shortly.",
      });

    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Google Sign-in Failed",
        description: error.message || "Could not sign in with Google.",
      });
    } finally {
        setGoogleLoading(false);
    }
  }


  if (isUserLoading || user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <CardHeader className="p-0 mb-8 text-center">
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to access your dashboard and bookings.
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
                  <Label>Email</Label>
                  <FormControl>
                    <Input placeholder="m@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <Label>Password</Label>
                    <Link
                      href="/forgot-password"
                      className="ml-auto inline-block text-sm underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={loading || googleLoading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={loading || googleLoading}>
              {googleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in with Google
            </Button>
          </CardContent>
        </form>
      </Form>
      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </div>
    </>
  );
}
