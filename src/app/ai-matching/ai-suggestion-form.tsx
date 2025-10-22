
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { suggestJobs, type SuggestJobsOutput } from "@/ai/flows/ai-suggested-jobs";
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";


type UserProfile = {
    skills?: string[];
    experience?: string;
};

const formSchema = z.object({
  profile: z.string().min(50, "Please provide more details about your skills and experience."),
  searchHistory: z.string().min(10, "Please provide some examples of jobs you've searched for."),
});

export default function AISuggestionForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestJobsOutput | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profile: "",
      searchHistory: "",
    },
  });

  useEffect(() => {
    if (userProfile) {
        const profileParts = [];
        if (userProfile.skills && userProfile.skills.length > 0) {
            profileParts.push(`Skills: ${userProfile.skills.join(', ')}.`);
        }
        if (userProfile.experience) {
            profileParts.push(`Experience: ${userProfile.experience}`);
        }
        const fullProfile = profileParts.join('\n');
        form.setValue('profile', fullProfile);
    }
  }, [userProfile, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const suggestionResult = await suggestJobs(values);
      setResult(suggestionResult);
    } catch (error) {
      console.error("Error getting suggestions:", error);
      // You could use a toast notification here to show the error
    } finally {
      setLoading(false);
    }
  }

  if (isProfileLoading) {
      return (
          <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full max-w-sm" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-24 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
      )
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
            <CardDescription>
              We've pre-filled this form from your profile. Add any other details to improve recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="profile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Profile (Skills & Experience)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Experienced frontend developer with 5 years in React and TypeScript...'"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="searchHistory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recent Job Searches or Interests</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Senior React Developer', 'Remote UI/UX Designer', 'Product Manager San Francisco'"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
            <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate Suggestions
            </Button>

            {loading && (
                <div className="text-center text-sm text-muted-foreground">
                    Our AI is analyzing your profile... this may take a moment.
                </div>
            )}

            {result && (
              <div className="rounded-lg border bg-secondary/50 p-4">
                <h3 className="font-semibold mb-2">Suggested Job Titles:</h3>
                {result.jobSuggestions.length > 0 ? (
                  <ul className="list-disc space-y-1 pl-5">
                    {result.jobSuggestions.map((job, index) => (
                      <li key={index}>{job}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No specific suggestions found. Try adding more detail to your profile.</p>
                )}
              </div>
            )}
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    