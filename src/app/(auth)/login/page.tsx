"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth, useUser, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, linkWithCredential, EmailAuthProvider } from "@/firebase";
import { initiateEmailSignIn } from "@/firebase/non-blocking-login";
import { useToast } from "@/hooks/use-toast";
import { FirebaseError } from "firebase/app";
import { useFirestore, query, collection, where, getDocs, signOut } from "@/firebase";
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import React, { useState } from "react";
import { AuthCredential } from "firebase/auth";

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
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkPassword, setLinkPassword] = useState("");
  const [linkEmail, setLinkEmail] = useState("");
  const [pendingCredential, setPendingCredential] = useState<AuthCredential | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);

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
    if (!auth) {
        setLoading(false);
        return;
    }
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
              description = "The email or password you entered is incorrect. If you've signed in with Google before, try the Google option.";
              break;
            case 'auth/user-not-found':
              title = "User Not Found";
              description = "No account found with this email address.";
              break;
            case 'auth/wrong-password':
               title = "Incorrect Password";
              description = "The password you entered is incorrect. Please try again.";
              break;
            case 'auth/user-disabled':
                title = "Account Disabled";
                description = "This account has been disabled. Please contact support.";
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
        // PROACTIVE CHECK: See if this email exists under another UID
        const q = query(collection(firestore, "users"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            // Document already exists for this email under a DIFFERENT UID!
            // We need to link this Google account to that existing UID.
            setPendingCredential(GoogleAuthProvider.credentialFromResult(result));
            setLinkEmail(user.email || "");
            setShowLinkDialog(true);
            
            // Sign out the new "split" user so we can re-auth as the old one to link
            await signOut(auth);
            return;
        }

        const [firstName, ...lastName] = (user.displayName || "").split(" ");
        const userData = {
          id: user.uid,
          userType: "seeker", 
          firstName: firstName || "",
          lastName: lastName.join(" ") || "",
          email: user.email,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, userData, { merge: true });
      }
      
      toast({
        title: "Signed in with Google!",
        description: "Welcome back.",
      });
      router.push("/dashboard");

    } catch (error: any) {
      console.error(error);
      let title = "Google Sign-in Failed";
      let description = error.message;

      if (error.code === 'auth/account-exists-with-different-credential') {
          setPendingCredential(GoogleAuthProvider.credentialFromError(error));
          setLinkEmail(error.customData?.email || "");
          setShowLinkDialog(true);
          return; // Stop here, wait for password in dialog
      }

      toast({
        variant: "destructive",
        title: title,
        description: description,
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleLinkAccount() {
    if (!auth || !pendingCredential || !linkPassword || !linkEmail) return;
    setLinkLoading(true);

    try {
        // 1. Sign in with the existing provider (Email/Password)
        const result = await signInWithEmailAndPassword(auth, linkEmail, linkPassword);
        
        // 2. Link the pending Google credential to this user
        await linkWithCredential(result.user, pendingCredential);
        
        toast({
            title: "Accounts Linked!",
            description: "Your Google account is now linked. You can use either method to sign in.",
        });
        
        setShowLinkDialog(false);
        router.push("/dashboard");
    } catch (error: any) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Linking Failed",
            description: error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential' 
                ? "Incorrect password for the existing account." 
                : error.message,
        });
    } finally {
        setLinkLoading(false);
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
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription className="text-base mt-2">
          Sign in to access your dashboard.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <CardContent className="p-0 space-y-4">
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="pt-2 space-y-4">
              <Button type="submit" className="w-full h-11 font-bold text-base" disabled={loading || googleLoading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button variant="outline" type="button" className="w-full h-11 font-medium" onClick={handleGoogleSignIn} disabled={loading || googleLoading}>
                {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                  </svg>
                )}
                Google
              </Button>
            </div>
          </CardContent>
        </form>
      </Form>
      <div className="mt-8 pt-6 border-t text-center">
        <p className="text-sm text-muted-foreground mr-1">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary font-bold hover:underline">
            Sign up now
          </Link>
        </p>
      </div>

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Link Your Account
            </DialogTitle>
            <DialogDescription>
              An account already exists with <strong>{linkEmail}</strong>. 
              Please enter your password to link Google sign-in to your existing profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-password">Your Password</Label>
              <Input
                id="link-password"
                type="password"
                placeholder="••••••••"
                value={linkPassword}
                onChange={(e) => setLinkPassword(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowLinkDialog(false)}
              disabled={linkLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkAccount}
              disabled={linkLoading || !linkPassword}
              className="font-bold"
            >
              {linkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {linkLoading ? "Linking..." : "Link & Sign In"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
