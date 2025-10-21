import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SignupPage() {
  return (
    <>
      <CardHeader className="text-center p-0 mb-8">
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>
          Join Dove Jobs to start your journey.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input id="full-name" placeholder="John Doe" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required />
        </div>
        <div className="space-y-2">
            <Label>You are a...</Label>
            <RadioGroup defaultValue="seeker" className="grid grid-cols-2 gap-4">
                <div>
                    <RadioGroupItem value="seeker" id="seeker" className="peer sr-only" />
                    <Label htmlFor="seeker" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Job Seeker
                    </Label>
                </div>
                <div>
                    <RadioGroupItem value="employer" id="employer" className="peer sr-only" />
                    <Label htmlFor="employer" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Employer
                    </Label>
                </div>
            </RadioGroup>
        </div>
        <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
          Create Account
        </Button>
      </CardContent>
      <div className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </div>
    </>
  );
}
