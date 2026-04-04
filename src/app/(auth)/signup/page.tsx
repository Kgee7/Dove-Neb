
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth, useUser } from "@/firebase";
import { initiateEmailSignUp } from "@/firebase/non-blocking-login";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from 'firebase/firestore';
import { Eye, EyeOff, AlertCircle } from "lucide-react";

import { useFirestore, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, linkWithCredential, EmailAuthProvider, signOut, collection, query, where, getDocs, getDoc } from "@/firebase";
import { AuthCredential } from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import React, { Suspense } from "react";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(1, { message: "Please confirm your password." }),
  userType: z.enum(["seeker", "employer"], {
    required_error: "Please select an account type.",
  }),
  terms: z.boolean().refine(val => val === true, {
    message: "You must accept the Terms of Service and Privacy Policy.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

function SignupPageClient() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [showLinkDialog, setShowLinkDialog] = React.useState(false);
  const [linkPassword, setLinkPassword] = React.useState("");
  const [linkEmail, setLinkEmail] = React.useState("");
  const [pendingCredential, setPendingCredential] = React.useState<AuthCredential | null>(null);
  const [linkLoading, setLinkLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      userType: "seeker",
      terms: false,
    },
  });

  React.useEffect(() => {
    if (user) {
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, router, redirectUrl]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    if (!auth || !firestore) {
        console.error("Auth or Firestore not available");
        setLoading(false);
        return;
    }
    try {
      const userCredential = await initiateEmailSignUp(auth, values.email, values.password);
      
      const user = userCredential.user;
      const [firstName, ...lastName] = values.fullName.split(' ');
      
      const userData: any = {
        id: user.uid,
        userType: values.userType,
        firstName: firstName,
        lastName: lastName.join(' '),
        email: values.email,
        createdAt: new Date().toISOString(),
      };

      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(userDocRef, userData, { merge: true });

      toast({
        title: "Account Created!",
        description: "You will be redirected.",
      });

    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Sign-up Failed",
        description: error.message || "Could not create account.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!auth || !firestore) return;
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

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
            // Already exists! Trigger link dialog
            setPendingCredential(GoogleAuthProvider.credentialFromResult(result));
            setLinkEmail(user.email || "");
            setShowLinkDialog(true);
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
        await setDoc(userDocRef, userData);
      }
      
      toast({ title: "Signed in with Google!", description: "Welcome back." });
      router.push("/dashboard");
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Google Sign-in Failed", description: error.message });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleLinkAccount() {
    if (!auth || !pendingCredential || !linkPassword || !linkEmail) return;
    setLinkLoading(true);

    try {
        const result = await signInWithEmailAndPassword(auth, linkEmail, linkPassword);
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
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>
          Join to find jobs or list your space.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>I am a...</FormLabel>
                   <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem>
                        <FormControl>
                           <RadioGroupItem value="seeker" id="seeker" className="peer sr-only" />
                        </FormControl>
                        <Label
                          htmlFor="seeker"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          Job Seeker
                        </Label>
                      </FormItem>
                      <FormItem>
                         <FormControl>
                           <RadioGroupItem value="employer" id="employer" className="peer sr-only" />
                         </FormControl>
                         <Label
                          htmlFor="employer"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          Employer
                        </Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Input type={showPassword ? "text" : "password"} {...field} />
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Input type={showConfirmPassword ? "text" : "password"} {...field} />
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Accept terms and conditions
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      You agree to our <Link href="/terms-of-service" className="underline hover:text-primary">Terms of Service</Link> and <Link href="/privacy-policy" className="underline hover:text-primary">Privacy Policy</Link>.
                    </p>
                     <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={loading || googleLoading}>
              {(loading || googleLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={loading || googleLoading}>
               {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                  <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                  </svg>
                )}
                Sign up with Google
            </Button>
          </CardContent>
        </form>
      </Form>
      <div className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
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
              Please enter your password to link Google sign-up to your existing profile.
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

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SignupPageClient />
    </Suspense>
  );
}
