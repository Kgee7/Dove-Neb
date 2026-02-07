
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
import { useFirestore } from "@/firebase";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  userType: z.enum(["seeker", "employer"], {
    required_error: "Please select an account type.",
  }),
  terms: z.boolean().refine(val => val === true, {
    message: "You must accept the Terms of Service and Privacy Policy.",
  }),
});

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
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
    if (!firestore) {
        console.error("Firestore not available");
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

      // The useEffect will handle redirection once the user state is updated.
      // No explicit push is needed here if the useEffect is reliable.
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Sign-up Failed",
        description: error.message || "Could not create account.",
      });
      setLoading(false);
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
                    <Input type="password" {...field} />
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
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
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
    </>
  );
}
